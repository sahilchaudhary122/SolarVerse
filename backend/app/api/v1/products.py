"""Product catalog API endpoints."""

from decimal import Decimal
from typing import Any
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models import Product

router = APIRouter(prefix="/products", tags=["Products"])


class ProductCreateRequest(BaseModel):
    name: str
    sku: str
    category: str
    unit_price: float | Decimal
    stock_quantity: int = 0
    description: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreateRequest, session: Session = Depends(get_db_session)) -> dict[str, Any]:
    prod = Product(
        name=payload.name,
        sku=payload.sku,
        category=payload.category,
        unit_price=Decimal(str(payload.unit_price)),
        stock_quantity=payload.stock_quantity,
        description=payload.description,
    )
    session.add(prod)
    session.commit()
    session.refresh(prod)
    return {"success": True, "message": "Product created successfully", "id": str(prod.id)}


@router.get("", response_model=list[dict[str, Any]])
def list_products(session: Session = Depends(get_db_session)) -> list[dict[str, Any]]:
    prods = session.query(Product).all()
    return [{
        "id": str(p.id),
        "name": p.name,
        "sku": p.sku,
        "category": p.category,
        "unit_price": float(p.unit_price),
        "stock_quantity": p.stock_quantity,
    } for p in prods]
