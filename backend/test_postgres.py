from backend.db.postgres_db import init_postgres, engine
from sqlalchemy import inspect

init_postgres()

inspector = inspect(engine)
tables = inspector.get_table_names()

print("PostgreSQL connected successfully!")
print("Tables:", tables)