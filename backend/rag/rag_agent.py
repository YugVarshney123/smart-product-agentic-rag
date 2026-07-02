import faiss
from sentence_transformers import SentenceTransformer
from backend.db.postgres_db import get_db, ProductKnowledge

model = SentenceTransformer("all-MiniLM-L6-v2")

faiss_index = None
product_cache = []


def product_to_text(product):
    return f"""
Product Name: {product.product_name}
Brand: {product.brand}
Category: {product.category}
Variants: {product.variants}
Ingredients: {product.ingredients}
Nutrition: {product.nutrition}
Allergens: {product.allergens}
Health Info: {product.health_info}
Storage: {product.storage}
"""


def rebuild_faiss_index():
    global faiss_index, product_cache

    db = get_db()
    products = db.query(ProductKnowledge).all()
    db.close()

    product_cache = products

    if not products:
        faiss_index = None
        print("FAISS: No products found")
        return

    texts = [product_to_text(p) for p in products]

    embeddings = model.encode(texts, convert_to_numpy=True).astype("float32")
    faiss.normalize_L2(embeddings)

    dimension = embeddings.shape[1]
    faiss_index = faiss.IndexFlatIP(dimension)
    faiss_index.add(embeddings)

    print(f"FAISS rebuilt with {len(products)} products")


def search_product_knowledge(query, top_k=3):
    global faiss_index, product_cache

    if not query:
        return {
            "message": "Empty query",
            "best_match": None,
            "matches": []
        }

    if faiss_index is None:
        rebuild_faiss_index()

    if faiss_index is None or not product_cache:
        return {
            "message": "Knowledge base empty",
            "best_match": None,
            "matches": []
        }

    query_embedding = model.encode([query], convert_to_numpy=True).astype("float32")
    faiss.normalize_L2(query_embedding)

    scores, ids = faiss_index.search(query_embedding, top_k)

    matches = []

    for score, idx in zip(scores[0], ids[0]):
        if idx == -1:
            continue

        p = product_cache[idx]

        matches.append({
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
            "similarity": round(float(score), 3)
        })

    return {
        "message": "Vector RAG match found",
        "best_match": matches[0] if matches else None,
        "matches": matches
    }
rebuild_faiss_index()