"""User model for authentication and RBAC."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    """System user with RBAC role and Argon2 password hash."""

    __tablename__ = "users"

    __table_args__ = (
        Index("ix_users_email", "email", unique=True),
        Index("ix_users_customer_id", "customer_id"),
        {"schema": "solarverse_legacy"},
    )

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    customer_id: Mapped[UUID | None] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("solarverse_legacy.customer.id", ondelete="SET NULL"),
        nullable=True,
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="ADMIN", server_default=text("'ADMIN'"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
