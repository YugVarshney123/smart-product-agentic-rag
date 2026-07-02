from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "postgresql://postgres:1908@localhost:5432/smart_shopping"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()


class ProductKnowledge(Base):
    __tablename__ = "product_knowledge"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(255), nullable=False)
    brand = Column(String(255))
    category = Column(String(255))
    variants = Column(Text)
    ingredients = Column(Text)
    nutrition = Column(Text)
    allergens = Column(Text)
    health_info = Column(Text)
    storage = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(255))
    brand = Column(String(255))
    category = Column(String(255))
    mrp = Column(String(100))
    weight = Column(String(100))
    stock_count = Column(Integer, default=0)
    batch_no = Column(String(100))
    manufacture_date = Column(String(100))
    expiry_date = Column(String(100))
    expiry_status = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(255))
    brand = Column(String(255))
    ocr_text = Column(Text)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_postgres():
    Base.metadata.create_all(bind=engine)


def get_db():
    return SessionLocal()