# SolarVerse Database Design — Version 1.1

**PROPOSED – PENDING TEAM APPROVAL**

Version 1.1 revises the approved initial Version 1.0 design after backend technical review. It is documentation only; no application code, SQLAlchemy models, Alembic migrations, or database tables are created by these documents.

Version 1.0 is preserved in Git history at commit `f2b449c` (`docs: add approved database design v1.0`). This update changes only these five database documentation files; the README at the repository root and unrelated work are not part of this design revision.

## Documents

- [01-er-diagram.md](01-er-diagram.md) — Mermaid entity relationship diagram and cardinality notes.
- [02-database-schema.md](02-database-schema.md) — proposed PostgreSQL DDL, keys, constraints, indexes, cross-table checks, and unresolved schema decisions.
- [03-data-dictionary.md](03-data-dictionary.md) — explanation of every proposed table and column.
- [04-constraints-and-business-rules.md](04-constraints-and-business-rules.md) — the 14 backend review areas, business rules, implementation boundaries, and team approval questions.

## Scope and standards

PostgreSQL is the proposed source of truth for relational data. SQLAlchemy 2.x and Alembic are the intended backend ORM/migration tools; Psycopg 3 is the documented PostgreSQL driver. Supabase Storage holds photo/document objects while PostgreSQL stores file metadata and storage keys.

The docs aim to align the database-facing contract with the React/TypeScript/Zod frontend and FastAPI/Pydantic backend architecture. The current checkout has no frontend contract files or backend source/models, so API names, casing/aliases, request/response shapes, and exact nullability must be verified with the implementation owners before migration work.

The eight existing enquiry statuses are preserved: `new`, `contacted`, `survey_pending`, `qualified`, `quoted`, `converted`, `lost`, `cancelled`. Other new rules/statuses remain proposals unless explicitly confirmed by the team.

## Change and review policy

Do not treat this version as approved until the team reviews the unresolved decisions in `02-database-schema.md` and `04-constraints-and-business-rules.md`. After any decision, update all five docs together and compare the ER diagram, PostgreSQL DDL, dictionary, rules, and this index for consistency. Backend implementation owner: coordinate with the backend developer (Sahil/Member 3). Database design owner: Member 2.
