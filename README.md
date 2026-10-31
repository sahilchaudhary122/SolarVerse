# SolarVerse
### One Platform. Complete Solar Business Management.

SolarVerse is a centralized management platform designed for solar installation businesses. It brings customer enquiries, site surveys, quotations, inventory, equipment tracking, technician scheduling, installations, warranties and service management into one application.

The goal is to simplify daily operations, reduce manual work, minimize errors and provide better visibility into every solar project — from the first customer enquiry to post-installation support.

---

## About the Project

Solar installation businesses often manage their operations using WhatsApp messages, phone calls, spreadsheets and paper records.

This creates several challenges:

- Customer information is scattered across different platforms.
- Site surveys and approvals are difficult to track.
- Quotations may contain missing or incorrect components.
- Inventory and equipment movement are not properly monitored.
- Product serial numbers can get lost.
- Technician assignments and installation progress are difficult to manage.
- Warranty verification and service history are not easily accessible.
- Management has limited visibility into project costs and profitability.

SolarVerse aims to solve these problems through a single, organized management platform.

---

## Project Objectives

- Centralize customer and project information.
- Manage enquiries and site surveys systematically.
- Generate accurate quotations and Bills of Materials (BOM).
- Maintain inventory and equipment records.
- Track product serial numbers from dispatch onwards.
- Simplify technician scheduling and installation tracking.
- Manage product warranties and service requests.
- Provide useful reports for business decision-making.

---

## Key Features

### 1. Customer and Enquiry Management
- Register and manage customer information.
- Record new solar installation enquiries.
- Track customer requirements.
- Maintain customer interaction history.
- Monitor enquiry status.

### 2. Site Survey Management
- Schedule site visits.
- Record roof area, direction and tilt.
- Check shadow-free roof space.
- Record monthly electricity bills.
- Capture cable distance and grid suitability.
- Submit surveys for approval.
- Maintain survey history.

### 3. Solar Packages and Quotations
- Manage solar packages from 1 kW to 5 kW.
- Support On-Grid and Off-Grid systems.
- Maintain package component details.
- Generate quotations based on approved surveys.
- Calculate required components and estimated costs.

### 4. Bill of Materials (BOM)
- Generate component lists for selected solar packages.
- Calculate required quantities.
- Identify panels, inverters, wiring and other components.
- Check required materials before order confirmation.
- Maintain configurable package components.

### 5. Inventory Management
- Maintain records of solar panels, inverters, batteries and accessories.
- Track available and reserved stock.
- Monitor stock movements.
- Record equipment dispatch.
- Identify stock shortages before installation.

### 6. Serial Number Tracking
- Record equipment serial numbers.
- Link equipment to customer orders and installation sites.
- Maintain equipment history.
- Support warranty verification through serial numbers.

### 7. Technician and Installation Management
- Assign technicians to installation projects.
- Schedule installation dates.
- Track installation progress.
- Record installation start and completion times.
- Capture site photographs and installation details.
- Maintain installation checklists.
- Record customer sign-off.

### 8. Warranty Management
- Maintain product warranty information.
- Track warranty start and end dates.
- Link warranties to equipment serial numbers.
- Check warranty status during service requests.

### 9. Service and Complaint Management
- Register customer complaints.
- Create service and repair tickets.
- Assign technicians.
- Record repair activities and replacement parts.
- Track service status until customer confirmation.

### 10. Reports and Dashboard
- View ongoing and completed installations.
- Monitor pending enquiries.
- Track inventory availability.
- Review advance payments and outstanding amounts.
- Analyze project costs and profitability.
- Monitor technician workload.
- Review pending service requests.

---

## Technology Stack

SolarVerse is being developed as an independent web application.

| Component | Technology |
|---|---|
| Frontend Framework | React.js |
| Frontend Language | TypeScript |
| Frontend Build Tool | Vite |
| UI Styling | Tailwind CSS |
| Routing | React Router |
| Server State Management | TanStack Query |
| HTTP Client | Axios |
| Form Management | React Hook Form |
| Frontend Validation | Zod |
| Backend Framework | Python FastAPI |
| Backend Language | Python |
| API Validation | Pydantic |
| ORM | SQLAlchemy |
| Database Migrations | Alembic |
| Database | PostgreSQL |
| PostgreSQL Driver | Psycopg 3 |
| Authentication | JWT |
| Password Hashing | Argon2 using pwdlib |
| File Storage | Supabase Storage |
| API Testing | Postman |
| Backend Testing | Pytest and HTTPX |
| Code Quality | Ruff |
| Code Editor | Visual Studio Code |
| Version Control | Git |
| Repository Hosting | GitHub |

All team members will follow the same agreed dependency versions to avoid compatibility and integration problems.

---

## System Architecture

SolarVerse follows a frontend-backend-database architecture.

```text
                  USERS
                    |
                    v
             REACT FRONTEND
          TypeScript + Tailwind CSS
                    |
                    | REST API
                    | JSON / HTTP
                    v
              FASTAPI BACKEND
                  Python
                    |
          -----------------------
          |          |          |
          v          v          v
      AUTHENT.   BUSINESS   VALIDATION
                  LOGIC
          |          |          |
          -----------------------
                    |
                    v
                SQLALCHEMY
                    |
                    v
                POSTGRESQL

             FASTAPI BACKEND
                    |
                    v
              SUPABASE STORAGE
              Photos/Documents