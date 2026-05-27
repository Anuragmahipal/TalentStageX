import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/talentstage",
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def init_db():
    # Wait for the database container to become ready before creating tables.
    last_error = None
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

            def ensure_schema(sync_conn):
                inspector = inspect(sync_conn)

                def add_column_if_missing(table_name: str, column_name: str, definition: str) -> None:
                    existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
                    if column_name not in existing_columns:
                        sync_conn.execute(text(f'ALTER TABLE "{table_name}" ADD COLUMN {definition}'))

                add_column_if_missing("users", "verified", "verified BOOLEAN NOT NULL DEFAULT FALSE")
                add_column_if_missing("profiles", "photo_url", "photo_url TEXT")
                add_column_if_missing("profiles", "skills", "skills TEXT")
                add_column_if_missing("profiles", "portfolio_items", "portfolio_items TEXT")
                add_column_if_missing("profiles", "rating", "rating DOUBLE PRECISION")
                add_column_if_missing("profiles", "total_earnings", "total_earnings DOUBLE PRECISION DEFAULT 0")
                add_column_if_missing("proposals", "status", "status VARCHAR(32) NOT NULL DEFAULT 'submitted'")
                add_column_if_missing("projects", "deadline", "deadline TIMESTAMP WITH TIME ZONE")
                add_column_if_missing("projects", "project_type", "project_type VARCHAR(16) NOT NULL DEFAULT 'fixed'")
                add_column_if_missing("contracts", "completed_at", "completed_at TIMESTAMP WITH TIME ZONE")

            await conn.run_sync(ensure_schema)
        return
    except Exception as exc:
        last_error = exc
        await asyncio.sleep(2)

    raise last_error

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
