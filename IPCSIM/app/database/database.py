from sqlalchemy import create_engine
from sqlalchemy import inspect
from sqlalchemy import text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


DATABASE_URL = f"sqlite:///{settings.DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def ensure_schema():
    # Improve SQLite concurrency settings before creating tables
    try:
        with engine.begin() as conn:
            conn.execute(text("PRAGMA journal_mode=WAL"))
            conn.execute(text("PRAGMA synchronous=NORMAL"))
            conn.execute(text("PRAGMA busy_timeout=30000"))
    except Exception:
        pass

    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    if "environment_snapshots" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("environment_snapshots")]
        with engine.begin() as conn:
            if "rack_id" not in columns:
                conn.execute(text("ALTER TABLE environment_snapshots ADD COLUMN rack_id integer"))
            if "created_at" not in columns:
                conn.execute(text("ALTER TABLE environment_snapshots ADD COLUMN created_at datetime"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()