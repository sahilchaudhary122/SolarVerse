"""SQLAlchemy model registration package."""

from app.models.customer import Customer
from app.models.customer_interaction import CustomerInteraction
from app.models.enquiry import Enquiry
from app.models.site import Site

__all__ = ["Customer", "CustomerInteraction", "Enquiry", "Site"]
