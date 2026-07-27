import os
import uuid

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.responses import FileResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from backend.config import BASE_DIR, UPLOAD_DIR, ALLOWED_EXTENSIONS
from backend.agents.ocr_agent import read_text_from_image
from backend.agents.extraction_agent import extract_product_info
from backend.rag.rag_agent import search_product_knowledge, rebuild_faiss_index
from backend.agents.customer_agent import customer_summary
from backend.agents.vendor_agent import stock_status
from backend.db.database import init_db
from backend.tts_utils import create_voice_file
from backend.auth import create_access_token, verify_admin

from backend.db.postgres_db import (
    init_postgres,
    get_db,
    ProductKnowledge,
    Inventory,
    ScanHistory,
)


app = FastAPI(title="Smart Product Agentic RAG")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/static",
    StaticFiles(directory=os.path.join(BASE_DIR, "static")),
    name="static",
)

init_db()
init_postgres()


class AdminLogin(BaseModel):
    username: str
    password: str


class ProductCreate(BaseModel):
    product_name: str
    brand: str = ""
    category: str = ""
    variants: str = ""
    ingredients: str = ""
    nutrition: str = ""
    allergens: str = ""
    health_info: str = ""
    storage: str = ""


def allowed(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


async def save_upload(file: UploadFile, suffix: str = "") -> str:
    if not allowed(file.filename):
        raise HTTPException(400, "Only png, jpg, jpeg, webp allowed")

    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}{suffix}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(await file.read())

    return path


@app.get("/")
def home():
    return FileResponse(os.path.join(BASE_DIR, "frontend", "index.html"))


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/admin/login")
def admin_login(data: AdminLogin):
    if data.username == "admin" and data.password == "admin123":
        token = create_access_token({
            "sub": data.username,
            "role": "admin"
        })

        return {
            "access_token": token,
            "token_type": "bearer"
        }

    raise HTTPException(status_code=401, detail="Invalid username or password")


@app.post("/api/customer/scan")
async def customer_scan(
    front_file: UploadFile = File(...),
    back_file: UploadFile = File(None),
):
    front_path = await save_upload(front_file, "_front")
    front_text = read_text_from_image(front_path)

    back_path = None
    back_text = ""

    if back_file:
        back_path = await save_upload(back_file, "_back")
        back_text = read_text_from_image(back_path)

    raw_text = f"""
FRONT SIDE OCR TEXT:
{front_text}

BACK SIDE OCR TEXT:
{back_text}
""".strip()

    rag_first = search_product_knowledge(raw_text)
    rag_context = str(rag_first)

    info = extract_product_info(raw_text, rag_context)

    rag = search_product_knowledge(info.get("product_name", ""))

    summary = customer_summary(info, rag)

    audio_url = create_voice_file(summary)

    db = get_db()
    scan = ScanHistory(
        product_name=info.get("product_name", "Not found"),
        brand=info.get("brand", "Not found"),
        ocr_text=raw_text,
        summary=summary,
    )
    db.add(scan)
    db.commit()
    db.close()

    return {
        "front_image_url": front_path.replace(BASE_DIR, "").replace("\\", "/"),
        "back_image_url": back_path.replace(BASE_DIR, "").replace("\\", "/")
        if back_path
        else None,
        "ocr_text": raw_text,
        "extracted_info": info,
        "rag": rag,
        "summary": summary,
        "audio_url": audio_url,
    }


@app.post("/api/vendor/scan-stock")
async def vendor_scan_stock(
    file: UploadFile = File(...),
    stock_count: int = Form(1),
    batch_no: str = Form(""),
    admin=Depends(verify_admin),
):
    path = await save_upload(file, "_stock")

    raw_text = read_text_from_image(path)

    rag_first = search_product_knowledge(raw_text)
    rag_context = str(rag_first)

    info = extract_product_info(raw_text, rag_context)

    db = get_db()

    item = Inventory(
        product_name=info.get("product_name", "Not found"),
        brand=info.get("brand", "Not found"),
        category=info.get("category", "Not found"),
        mrp=info.get("mrp", "Not found"),
        weight=info.get("weight", "Not found"),
        stock_count=stock_count,
        batch_no=batch_no,
        manufacture_date=info.get("manufacture_date", "Not found"),
        expiry_date=info.get("expiry_date", "Not found"),
        expiry_status=info.get("expiry_status", "Unknown"),
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    inventory_id = item.id
    db.close()

    return {
        "message": "Stock added",
        "inventory_id": inventory_id,
        "status": stock_status(info),
        "ocr_text": raw_text,
        "extracted_info": info,
    }


@app.get("/api/admin/inventory")
def admin_inventory(admin=Depends(verify_admin)):
    db = get_db()
    items = db.query(Inventory).all()

    data = []
    for item in items:
        data.append({
            "id": item.id,
            "product_name": item.product_name,
            "brand": item.brand,
            "category": item.category,
            "mrp": item.mrp,
            "weight": item.weight,
            "stock_count": item.stock_count,
            "batch_no": item.batch_no,
            "manufacture_date": item.manufacture_date,
            "expiry_date": item.expiry_date,
            "expiry_status": item.expiry_status,
            "created_at": str(item.created_at),
        })

    db.close()
    return {"items": data}


@app.post("/api/admin/products")
def add_product(product: ProductCreate, admin=Depends(verify_admin)):
    db = get_db()

    new_product = ProductKnowledge(
        product_name=product.product_name,
        brand=product.brand,
        category=product.category,
        variants=product.variants,
        ingredients=product.ingredients,
        nutrition=product.nutrition,
        allergens=product.allergens,
        health_info=product.health_info,
        storage=product.storage,
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    product_id = new_product.id
    db.close()
    rebuild_faiss_index()
    return {
        "message": "Product added successfully",
        "product_id": product_id,
    }


@app.get("/api/admin/products")
def get_products(admin=Depends(verify_admin)):
    db = get_db()
    products = db.query(ProductKnowledge).all()

    data = []
    for p in products:
        data.append({
            "id": p.id,
            "product_name": p.product_name,
            "brand": p.brand,
            "category": p.category,
            "variants": p.variants,
            "ingredients": p.ingredients,
            "nutrition": p.nutrition,
            "allergens": p.allergens,
            "health_info": p.health_info,
            "storage": p.storage,
            "created_at": str(p.created_at),
        })

    db.close()
    return {"products": data}


@app.get("/api/admin/scan-history")
def get_scan_history(admin=Depends(verify_admin)):
    db = get_db()
    scans = db.query(ScanHistory).all()

    data = []
    for scan in scans:
        data.append({
            "id": scan.id,
            "product_name": scan.product_name,
            "brand": scan.brand,
            "summary": scan.summary,
            "created_at": str(scan.created_at),
        })

    db.close()
    return {"scans": data}
@app.delete("/api/admin/clean-waste")
def clean_waste(admin=Depends(verify_admin)):
    from datetime import date

    db = get_db()
    items = db.query(Inventory).all()

    deleted = 0

    for item in items:
        try:
            expiry = item.expiry_date

            if not expiry or expiry == "Not found":
                continue

            parts = expiry.split("/")
            if len(parts) != 3:
                continue

            day = int(parts[0])
            month = int(parts[1])
            year = int(parts[2])

            if year < 100:
                year += 2000

            expiry_date = date(year, month, day)

            if expiry_date < date.today():
                db.delete(item)
                deleted += 1

        except Exception as e:
            print("Skipping invalid expiry:", item.expiry_date, e)
            continue

    db.commit()
    db.close()

    return {"message": f"{deleted} expired items removed from waste bin"}
@app.post("/api/admin/rebuild-rag")
def rebuild_rag(admin=Depends(verify_admin)):
    rebuild_faiss_index()
    return {"message": "FAISS index rebuilt successfully"}

@app.get("/api/admin/products/pdf")
def products_pdf(admin=Depends(verify_admin)):
    db = get_db()
    products = db.query(ProductKnowledge).all()

    pdf_path = os.path.join(BASE_DIR, "static", "products_list.pdf")
    c = canvas.Canvas(pdf_path, pagesize=A4)

    width, height = A4
    y = height - 50

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, "Smart Shopping Assistant - Product Knowledge List")
    y -= 35

    c.setFont("Helvetica", 10)

    for p in products:
        if y < 80:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 10)

        c.drawString(50, y, f"Product: {p.product_name}")
        y -= 15
        c.drawString(50, y, f"Brand: {p.brand} | Category: {p.category}")
        y -= 15
        c.drawString(50, y, f"Variants: {p.variants}")
        y -= 15
        c.drawString(50, y, f"Health: {p.health_info}")
        y -= 25

    c.save()
    db.close()

    return FileResponse(pdf_path, filename="products_list.pdf", media_type="application/pdf")
@app.delete("/api/admin/clear-inventory")
def clear_inventory(admin=Depends(verify_admin)):
    db = get_db()
    deleted = db.query(Inventory).delete()
    db.commit()
    db.close()

    return {"message": f"{deleted} inventory items removed"}