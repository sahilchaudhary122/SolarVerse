"""SQLAlchemy model registration package."""

from app.models.customer import Customer
from app.models.customer_interaction import CustomerInteraction
from app.models.enquiry import Enquiry
from app.models.site import Site
from app.models.user import User
from app.models.survey import SiteSurvey
from app.models.product import Product
from app.models.quotation import Quotation
from app.models.order import Order
from app.models.serial_number import SerialNumber
from app.models.installation import Installation
from app.models.warranty import Warranty
from app.models.support_ticket import SupportTicket

__all__ = [
    "Customer",
    "CustomerInteraction",
    "Enquiry",
    "Site",
    "User",
    "SiteSurvey",
    "Product",
    "Quotation",
    "Order",
    "SerialNumber",
    "Installation",
    "Warranty",
    "SupportTicket",
]
