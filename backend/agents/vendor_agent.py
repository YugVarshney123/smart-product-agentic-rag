def stock_status(item: dict) -> str:
    count = int(item.get('stock_count') or 0)
    if count <= 0: return 'OUT_OF_STOCK'
    if count <= 5: return 'LOW_STOCK'
    return 'AVAILABLE'
