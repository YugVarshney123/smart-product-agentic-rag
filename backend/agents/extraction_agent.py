import json
import re
from datetime import datetime, timedelta

import requests


OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3"


def extract_json(text: str):
    try:
        return json.loads(text)
    except Exception:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            return None

    return None


def calculate_expiry(raw_text: str, mfd: str):
    if not mfd or mfd == "Not found":
        return "Not found", ""

    lower = raw_text.lower()

    match = re.search(r"best\s*before\s*(\d+)\s*days?", lower)

    if match:
        days = int(match.group(1))
        note = f"Calculated using best before {days} days."
    elif "milk" in lower and ("pasteurised" in lower or "uht" in lower):
        days = 5
        note = "Calculated using common milk shelf-life rule from packaging date."
    else:
        return "Not found", ""

    for fmt in ["%d/%m/%Y", "%d/%m/%y", "%d-%m-%Y", "%d-%m-%y"]:
        try:
            mfd_date = datetime.strptime(mfd, fmt)
            expiry_date = mfd_date + timedelta(days=days)
            return expiry_date.strftime("%d/%m/%Y"), note
        except Exception:
            pass

    return "Not found", ""


def extract_product_info(raw_text: str, rag_context: str = "") -> dict:
    prompt = f"""
You are an AI product label extraction agent.

Return ONLY valid JSON.
Do not use markdown.
Do not explain.

Use OCR text first.
Use RAG context only to normalize product name, brand, category, variants, and health advice.
Do not randomly guess values.
If value is missing, write "Not found".

Important extraction rules:
- Product name should be the consumer product name.
- Brand should be clean, not full company address.
- MRP can appear as MRP, Rs, ₹, or nearby a number.
- MFD can appear as MFD, MFG, Date of Packaging, Packed on, PKD.
- Expiry can appear as EXP, Use By, Best Before, or shelf-life instruction.
- Weight can appear as Net Quantity, Net Content, Net Weight, ml, g, kg, L.
- FSSAI can appear as FSSAI, Lic No, License No.
- Customer care can be phone number or email.
- Allergens must be list.
- Health advice should be simple for elderly users.

JSON schema:
{{
  "product_name": "",
  "brand": "",
  "category": "",
  "mrp": "",
  "weight": "",
  "manufacture_date": "",
  "expiry_date": "",
  "fssai_license": "",
  "customer_care": "",
  "ingredients": "",
  "nutrition": "",
  "allergens": [],
  "health_advice": "",
  "confidence": ""
}}

OCR TEXT:
\"\"\"
{raw_text}
\"\"\"

RAG CONTEXT:
\"\"\"
{rag_context}
\"\"\"
"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.1},
            },
            timeout=180,
        )
        response.raise_for_status()

        llm_text = response.json().get("response", "")
        data = extract_json(llm_text) or {}

    except Exception as e:
        data = {"error": str(e)}

    data = normalize_output(data, raw_text)

    expiry, note = calculate_expiry(raw_text, data.get("manufacture_date"))
    if data.get("expiry_date") == "Not found" and expiry != "Not found":
        data["expiry_date"] = expiry
        data["expiry_note"] = note

    return data


def normalize_output(data: dict, raw_text: str) -> dict:
    defaults = {
        "product_name": "Not found",
        "brand": "Not found",
        "category": "Not found",
        "mrp": "Not found",
        "weight": "Not found",
        "manufacture_date": "Not found",
        "expiry_date": "Not found",
        "fssai_license": "Not found",
        "customer_care": "Not found",
        "ingredients": "Not found",
        "nutrition": "Not found",
        "allergens": [],
        "health_advice": "Not found",
        "confidence": "low",
    }

    for key, value in defaults.items():
        if key not in data or data[key] in ["", None]:
            data[key] = value

    if not isinstance(data.get("allergens"), list):
        data["allergens"] = []

    data["raw_text"] = raw_text

    return data