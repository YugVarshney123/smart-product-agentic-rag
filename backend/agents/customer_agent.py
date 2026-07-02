def customer_summary(info: dict, rag: dict) -> str:
    parts = [f"Product detected: {info.get('product_name') or 'Unknown'}."]
    if info.get('net_quantity'): parts.append(f"Quantity: {info['net_quantity']}.")
    if info.get('mrp'): parts.append(f"MRP: rupees {info['mrp']}.")
    if info.get('mfd_date'): parts.append(f"Manufacturing date: {info['mfd_date']}.")
    if info.get('expiry_date'): parts.append(f"Expiry date: {info['expiry_date']}.")
    if info.get('best_before'): parts.append(f"{info['best_before']}.")
    if rag.get('variants'): parts.append('Other variants available: ' + ', '.join(rag['variants']) + '.')
    if rag.get('info'): parts.append(rag['info'])
    return ' '.join(parts)
