import sqlite3
from backend.config import DB_PATH


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('''CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT,
        brand TEXT,
        net_quantity TEXT,
        mrp TEXT,
        batch_no TEXT,
        mfd_date TEXT,
        expiry_date TEXT,
        stock_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    conn.commit(); conn.close()


def add_inventory(item: dict):
    conn = get_conn(); cur = conn.cursor()
    cur.execute('''INSERT INTO inventory(product_name, brand, net_quantity, mrp, batch_no, mfd_date, expiry_date, stock_count)
    VALUES(?,?,?,?,?,?,?,?)''', (
        item.get('product_name'), item.get('brand'), item.get('net_quantity'), item.get('mrp'),
        item.get('batch_no'), item.get('mfd_date'), item.get('expiry_date'), int(item.get('stock_count') or 0)
    ))
    conn.commit(); rowid = cur.lastrowid; conn.close(); return rowid


def list_inventory():
    conn = get_conn(); cur = conn.cursor()
    rows = cur.execute('SELECT * FROM inventory ORDER BY id DESC').fetchall()
    conn.close(); return [dict(r) for r in rows]
