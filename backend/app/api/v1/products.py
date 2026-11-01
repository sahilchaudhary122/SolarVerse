"""Canonical product catalog and solar package APIs."""

from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.auth import require_role
from app.db.session import get_db_session
from app.models.canonical import MODEL_CLASSES

Product = MODEL_CLASSES["product"]
SolarPackage = MODEL_CLASSES["solar_package"]
PackageComponent = MODEL_CLASSES["package_component"]
router = APIRouter(prefix="/products", tags=["Products"])


class ProductCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=160)
    category: str = Field(min_length=1, max_length=80)
    tracks_serial_number: bool = False
    active: bool = True


class ProductUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str | None = Field(default=None, min_length=1, max_length=160)
    category: str | None = Field(default=None, min_length=1, max_length=80)
    tracks_serial_number: bool | None = None
    active: bool | None = None


class PackageCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=120)
    capacity_kw: Decimal = Field(gt=0, max_digits=8, decimal_places=3)
    system_type: str = Field(pattern=r"^(on-grid|off-grid)$")


class PackageComponentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: UUID
    quantity: Decimal = Field(gt=0, max_digits=12, decimal_places=3)


def _product(product: Any) -> dict[str, Any]:
    return {"id": str(product.id), "name": product.name, "category": product.category,
            "tracks_serial_number": product.tracks_serial_number, "active": product.active,
            "created_at": product.created_at.isoformat() if product.created_at else None}


def _package(package: Any, components: list[tuple[Any, Any]] | None = None) -> dict[str, Any]:
    data = {"id": str(package.id), "name": package.name, "capacity_kw": str(package.capacity_kw),
            "system_type": package.system_type, "active": package.active,
            "created_at": package.created_at.isoformat() if package.created_at else None}
    if components is not None:
        data["components"] = [{"product": _product(product), "quantity": str(component.quantity)}
                              for component, product in components]
    return data


@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role("system_admin", "inventory_manager"))])
def create_product(payload: ProductCreateRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    product = Product(name=payload.name.strip(), category=payload.category.strip(),
                      tracks_serial_number=payload.tracks_serial_number, active=payload.active)
    session.add(product)
    try:
        session.commit()
        session.refresh(product)
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Product could not be created") from exc
    return _product(product)


@router.get("", response_model=list[dict[str, Any]], dependencies=[Depends(require_role("system_admin", "inventory_manager", "sales", "sales_manager"))])
def list_products(
    active: bool | None = True,
    search: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    session: Session = Depends(get_db_session),
) -> list[dict[str, Any]]:
    query = session.query(Product)
    if active is not None:
        query = query.filter(Product.active.is_(active))
    if search:
        query = query.filter(Product.name.ilike(f"%{search.strip()}%"))
    return [_product(row) for row in query.order_by(Product.name, Product.id).offset(offset).limit(limit).all()]


@router.get("/{product_id:uuid}", dependencies=[Depends(require_role("system_admin", "inventory_manager", "sales", "sales_manager", "technician"))])
def get_product(product_id: UUID, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return _product(product)


@router.patch("/{product_id:uuid}", dependencies=[Depends(require_role("system_admin", "inventory_manager"))])
def update_product(product_id: UUID, payload: ProductUpdateRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    values = payload.model_dump(exclude_unset=True)
    if not values:
        raise HTTPException(status_code=422, detail="At least one update field is required")
    for key, value in values.items():
        setattr(product, key, value.strip() if isinstance(value, str) else value)
    try:
        session.commit()
        session.refresh(product)
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Product could not be updated") from exc
    return _product(product)


@router.post("/packages", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role("system_admin", "sales_manager"))])
def create_package(payload: PackageCreateRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    package = SolarPackage(name=payload.name.strip(), capacity_kw=payload.capacity_kw, system_type=payload.system_type)
    session.add(package)
    try:
        session.commit()
        session.refresh(package)
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Solar package could not be created") from exc
    return _package(package)


@router.get("/packages", response_model=list[dict[str, Any]], dependencies=[Depends(require_role("system_admin", "sales", "sales_manager"))])
def list_packages(
    active: bool | None = True,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    session: Session = Depends(get_db_session),
) -> list[dict[str, Any]]:
    query = session.query(SolarPackage)
    if active is not None:
        query = query.filter(SolarPackage.active.is_(active))
    packages = query.order_by(SolarPackage.name, SolarPackage.id).offset(offset).limit(limit).all()
    return [_package(row) for row in packages]


@router.get("/packages/{package_id}", dependencies=[Depends(require_role("system_admin", "sales", "sales_manager"))])
def get_package(package_id: UUID, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    package = session.get(SolarPackage, package_id)
    if package is None:
        raise HTTPException(status_code=404, detail="Solar package not found")
    rows = (
        session.query(PackageComponent, Product)
        .join(Product, Product.id == PackageComponent.product_id)
        .filter(PackageComponent.package_id == package_id)
        .order_by(Product.name, Product.id)
        .all()
    )
    return _package(package, rows)


@router.post("/packages/{package_id}/components", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role("system_admin", "sales_manager"))])
def add_package_component(
    package_id: UUID,
    payload: PackageComponentRequest,
    session: Session = Depends(get_db_session),
) -> dict[str, Any]:
    if session.get(SolarPackage, package_id) is None or session.get(Product, payload.product_id) is None:
        raise HTTPException(status_code=404, detail="Package or product not found")
    component = PackageComponent(package_id=package_id, product_id=payload.product_id, quantity=payload.quantity)
    session.add(component)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Package component already exists") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(status_code=503, detail="Package component could not be saved") from exc
    return {"package_id": str(package_id), "product_id": str(payload.product_id), "quantity": str(payload.quantity)}
