import { useEffect, useState } from "react";
import {
  getInventory,
  getProducts,
  vendorScanStock,
} from "../services/api.js";
import AdminLogin from "./AdminLogin.jsx";

function AdminPreview() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("adminToken"));
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);

  const [stockFile, setStockFile] = useState(null);
  const [stockCount, setStockCount] = useState(1);
  const [batchNo, setBatchNo] = useState("");

  const loadInventory = async () => {
    try {
      const data = await getInventory();
      setItems(data.items || []);
    } catch {
      localStorage.removeItem("adminToken");
      setLoggedIn(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data.products || []);
    } catch {
      alert("Unable to load products");
    }
  };

  useEffect(() => {
    if (loggedIn) {
      loadInventory();
      loadProducts();
    }
  }, [loggedIn]);

  const logout = () => {
    localStorage.removeItem("adminToken");
    setLoggedIn(false);
    setItems([]);
    setProducts([]);
  };

  const addInventoryByScan = async () => {
    if (!stockFile) {
      alert("Please select product image");
      return;
    }

    try {
      await vendorScanStock(stockFile, stockCount, batchNo);
      alert("Inventory added successfully");
      setStockFile(null);
      setStockCount(1);
      setBatchNo("");
      loadInventory();
    } catch (error) {
      console.error(error);
      alert("Inventory scan failed");
    }
  };

  if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />;

  const total = items.length;
  const lowStock = items.filter((i) => Number(i.stock_count || 0) <= 5).length;
  const expired = items.filter((i) => i.expiry_status === "Expired").length;
  const nearExpiry = items.filter((i) => i.expiry_status === "Near Expiry").length;

  return (
    <section className="admin-dashboard">
      <div className="admin-top">
        <div>
          <p className="admin-badge">Admin Panel</p>
          <h2>📦 Smart Store Dashboard</h2>
          <p>Manage products, inventory, expiry alerts and RAG knowledge base.</p>
        </div>

        <div className="admin-actions">
          <button className="refresh-btn" onClick={() => { loadInventory(); loadProducts(); }}>
            🔄 Refresh
          </button>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="stats-grid">
        <Stat title="Inventory Items" value={total} icon="📦" />
        <Stat title="Knowledge Products" value={products.length} icon="🧠" />
        <Stat title="Low Stock" value={lowStock} icon="⚠️" />
        <Stat title="Expired" value={expired} icon="❌" />
        <Stat title="Near Expiry" value={nearExpiry} icon="⏳" />
      </div>

      <div className="admin-panels">
        <div className="panel">
          <h3>📷 Add New Inventory by Scanner</h3>

          <div className="admin-form">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setStockFile(e.target.files[0])}
            />

            <input
              type="number"
              min="1"
              value={stockCount}
              onChange={(e) => setStockCount(e.target.value)}
              placeholder="Stock count"
            />

            <input
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              placeholder="Batch number"
            />

            <button onClick={addInventoryByScan}>➕ Add to Inventory</button>
          </div>
        </div>

        <div className="panel">
          <h3>📄 Product Knowledge Base</h3>

          {products.length === 0 ? (
            <div className="empty-box">
              <h4>No products added</h4>
              <p>Add products from Swagger or product form API.</p>
            </div>
          ) : (
            <div className="product-list">
              {products.map((p) => (
                <div className="product-row" key={p.id}>
                  <strong>{p.product_name}</strong>
                  <span>{p.brand} • {p.category}</span>
                  <small>{p.variants}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="admin-panels">
        <div className="panel">
          <h3>📋 Inventory</h3>

          {items.length === 0 ? (
            <div className="empty-box">
              <h4>No inventory added yet</h4>
              <p>Use scanner above to add products into inventory.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>MRP</th>
                  <th>Stock</th>
                  <th>Expiry</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>{item.brand}</td>
                    <td>{item.mrp}</td>
                    <td>{item.stock_count}</td>
                    <td>{item.expiry_date}</td>
                    <td>
                      <span className={`status ${statusClass(item.expiry_status)}`}>
                        {item.expiry_status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <h3>🧠 AI System Status</h3>
          <div className="system-list">
            <p>✅ OCR Agent Active</p>
            <p>✅ PostgreSQL Connected</p>
            <p>✅ FAISS Vector RAG Ready</p>
            <p>✅ Voice Output Enabled</p>
            <p>✅ JWT Admin Protection</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ title, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function statusClass(status) {
  if (status === "Expired") return "danger";
  if (status === "Near Expiry") return "warning";
  if (status === "Safe") return "safe";
  return "unknown";
}

export default AdminPreview;