
# SolarVerse Database Design — Version 1.2

**PROPOSED – PENDING TEAM APPROVAL**

Version 1.2 revises proposed Version 1.1 after the backend compatibility audit. It is documentation only; no application code, SQLAlchemy models, Alembic migrations, or database tables are created by these documents.

Version 1.0 is preserved at commit `f2b449c` and Version 1.1 at `307a14e` in Git history. This revision changes only these five database documentation files; the repository-root README and unrelated work are not part of this design revision.

## Documents

- [01-er-diagram.md](01-er-diagram.md) — Mermaid entity relationship diagram and cardinality notes.
- [02-database-schema.md](02-database-schema.md) — proposed PostgreSQL DDL, keys, constraints, indexes, cross-table checks, and unresolved schema decisions.
- [03-data-dictionary.md](03-data-dictionary.md) — explanation of every proposed table and column.
- [04-constraints-and-business-rules.md](04-constraints-and-business-rules.md) — the 14 backend review areas, business rules, implementation boundaries, and team approval questions.

## Scope and standards

PostgreSQL is the proposed source of truth for relational data. SQLAlchemy 2.x and Alembic are the intended backend ORM/migration tools; Psycopg 3 is the documented PostgreSQL driver. Supabase Storage holds photo/document objects while PostgreSQL stores file metadata and storage keys.

The docs aim to align the database-facing contract with the React/TypeScript/Zod frontend and FastAPI/Pydantic backend architecture. The current checkout has no frontend contract files or backend source/models, so API names, casing/aliases, request/response shapes, and exact nullability must be verified with the implementation owners before migration work.

The eight existing enquiry statuses are preserved: `new`, `contacted`, `survey_pending`, `qualified`, `quoted`, `converted`, `lost`, `cancelled`. The six customer-interaction types and four site-survey statuses are documented in the schema. UUIDs are generated application-side with Python `uuid.uuid4()`; PostgreSQL UUID defaults are not used. Other new rules remain proposals unless explicitly confirmed by the team.

Authentication records are represented by `app_user`. Email is normalized and unique, password hashes are stored instead of passwords, and accounts are deactivated instead of deleted. Survey review history references its reviewer through `app_user` with `ON DELETE RESTRICT` and retains a reviewer-label snapshot.

## Change and review policy

Do not treat this version as approved until the team reviews the unresolved decisions in `02-database-schema.md` and `04-constraints-and-business-rules.md`. After any decision, update all five docs together and compare the ER diagram, PostgreSQL DDL, dictionary, rules, and this index for consistency.

Backend implementation owner: coordinate with the backend developer (Sahil/Member 3).

Database design owner: Member 2.
