# SolarVerse Database Design v1.0

**TEAM-APPROVED INITIAL DATABASE DESIGN – VERSION 1.0**

Contents:
- 01-er-diagram.md
- 02-database-schema.md
- 03-data-dictionary.md
- 04-constraints-and-business-rules.md

Approved initial design for the SolarVerse MVP. PostgreSQL is the source of truth for structured data. Supabase Storage holds file objects; PostgreSQL stores file metadata and storage keys.

Implementation owner: Backend developer (SQLAlchemy 2.x and Alembic).
Database design owner: Database and Data Design Engineer.

These documents describe the logical schema and implementation rules. They do not create database tables or migrations.
