# SolarVerse
### One Platform. Complete Solar Business Management.

SolarVerse is a centralized management system designed for solar installation businesses. It brings customer enquiries, site surveys, quotations, inventory, equipment tracking, technician scheduling, installations, warranties and service management into one platform.

The goal is to reduce manual work, avoid operational errors and give the business a clear view of every project, from the first customer enquiry to post-installation support.

---

## About the Project

Solar installation businesses often manage their daily operations using WhatsApp messages, phone calls, spreadsheets and paper records.

This can create problems such as:
- Customer information being scattered across different platforms.
- Delays in conducting and approving site surveys.
- Missing components in quotations.
- Difficulty tracking stock and equipment.
- Lost or unrecorded product serial numbers.
- Confusion around technician assignments and installation progress.
- Difficulty checking warranty status and service history.
- Limited visibility into project costs, payments and profits.

SolarVerse aims to bring these activities together in one organized system.

---

## Project Objectives

- Centralize customer and project information.
- Manage enquiries and site surveys systematically.
- Generate accurate quotations and Bills of Materials (BOM).
- Maintain visibility into inventory and equipment.
- Track product serial numbers from dispatch onwards.
- Simplify technician scheduling and installation tracking.
- Manage product warranties and customer service requests.
- Provide useful reports for business decision-making.

---

## Key Features

### 1. Customer and Enquiry Management
- Maintain customer contact information.
- Record new solar installation enquiries.
- Track customer requirements and project details.
- Maintain the history of customer interactions.

### 2. Site Survey Management
- Schedule site visits.
- Record roof area, direction and tilt.
- Check shadow-free roof space.
- Record monthly electricity consumption or bills.
- Capture cable distance and grid suitability.
- Submit surveys for approval before quotation.

### 3. Solar Packages and Quotations
- Manage solar packages from 1 kW to 5 kW.
- Support On-Grid and Off-Grid systems.
- Maintain package component details.
- Generate quotations based on approved surveys.
- Calculate the required components and estimated costs.

### 4. Bill of Materials (BOM)
- Generate a component list for each solar package.
- Identify the quantity of panels, inverters, wiring and other components.
- Check the required materials before order confirmation.
- Maintain package-level component configurations.

### 5. Inventory Management
- Maintain records of solar panels, inverters, batteries and accessories.
- Track available and reserved stock.
- Monitor stock movements.
- Record equipment dispatch.
- Identify stock shortages before installation.

### 6. Serial Number Tracking
- Record equipment serial numbers.
- Link products to customer orders and installation sites.
- Maintain equipment history.
- Use serial number records to support warranty verification.

### 7. Technician and Installation Management
- Assign technicians to installation projects.
- Schedule installation dates.
- Track installation progress.
- Record installation start and completion times.
- Capture site photographs and installation details.
- Maintain installation checklists and customer sign-off.

### 8. Warranty Management
- Maintain product warranty information.
- Track warranty start and end dates.
- Link warranties to equipment serial numbers.
- Check warranty status when a service request is created.

### 9. Service and Complaint Management
- Register customer complaints.
- Create service and repair tickets.
- Track assigned technicians.
- Record repair activities and replacement parts.
- Keep tickets open until the customer confirms resolution.

### 10. Reports and Dashboard
- View ongoing and completed installations.
- Monitor pending customer enquiries.
- Track stock availability.
- Review advance payments and outstanding amounts.
- Analyze project costs and profitability.
- Monitor technician workload and service requests.

---

## Technology Stack

SolarVerse is planned using the following technologies:

| Component | Technology |
|---|---|
| ERP and Application Platform | Odoo Community |
| Backend | Python |
| ORM | Odoo ORM |
| Database | PostgreSQL |
| Frontend | Odoo XML Views |
| Interactive UI | JavaScript / OWL (when required) |
| Reports | QWeb |
| Code Editor | Visual Studio Code |
| Version Control | Git |
| Repository Hosting | GitHub |

The project uses Odoo's existing application framework, ORM and web client instead of maintaining a separate frontend and backend.

---

## System Architecture

The planned application follows this architecture:

```text
             Users
               |
               v
        Odoo Web Client
               |
               v
        XML Views / OWL
               |
               v
       Python Application
               |
               v
           Odoo ORM
               |
               v
          PostgreSQL