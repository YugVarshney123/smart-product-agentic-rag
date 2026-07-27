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
    } catch (error) {
      console.error(error);
      localStorage.removeItem("adminToken");
      setLoggedIn(false);
    }
  };
  const handleCleanWaste = async () => {
  if (!window.confirm("Permanently remove all expired products?")) return;

  try {
    const data = await cleanWasteBin();
    alert(data.message);
    loadInventory();
  } catch (error) {
    console.error(error);
    alert("Failed to clean waste bin");
  }
};
  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data.products || []);
    } catch (error) {
      console.error(error);
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
  const safeCount = items.filter((i) => getExpiryStatus(i.expiry_date) === "Safe").length;
  const lowStock = items.filter((i) => Number(i.stock_count || 0) <= 5).length;
  const expired = items.filter((i) => getExpiryStatus(i.expiry_date) === "Expired").length;
  const nearExpiry = items.filter((i) => getExpiryStatus(i.expiry_date) === "Near Expiry").length;

  const expiredItems = items.filter(
    (i) => getExpiryStatus(i.expiry_date) === "Expired"
  );

  return (
    <section className="admin-dashboard">
      <div className="admin-top">
        <div>
          <p className="admin-badge">Admin Panel</p>
          <h2>📦 Smart Store Dashboard</h2>
          <p>Manage products, inventory, expiry alerts and RAG knowledge base.</p>
        </div>

        <div className="admin-actions">
          <button
            className="refresh-btn"
            onClick={() => {
              loadInventory();
              loadProducts();
            }}
          >
            🔄 Refresh
          </button>

          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <Stat title="Inventory Items" value={total} icon="📦" />
        <Stat title="Knowledge Products" value={products.length} icon="🧠" />
        <Stat title="Low Stock" value={lowStock} icon="⚠️" />
        <Stat title="Expired" value={expired} icon="❌" />
        <Stat title="Near Expiry" value={nearExpiry} icon="⏳" />
      </div>

      <div className="waste-full-row">
        <div className="panel waste-panel">
          <h3>♻️ Waste Management Workflow</h3>

          <div className="waste-grid">
            <div className="waste-card safe-card">
              <h4>🟢 Safe Products</h4>
              <strong>{safeCount}</strong>
              <p>Keep in inventory</p>
            </div>

            <div className="waste-card discount-card">
              <h4>🟡 Discount Section</h4>
              <strong>{nearExpiry}</strong>
              <p>Move near-expiry products to 30% discount section</p>
            </div>

            <div className="waste-card expired-card">
              <h4>🔴 Waste Bin</h4>
              <strong>{expired}</strong>
              <p>Expired products moved to waste bin</p>
            </div>
          </div>

          <div className="waste-list">
            <h4>🗑 Waste Bin Products</h4>

            {expiredItems.length === 0 ? (
              <p>No expired products in waste bin.</p>
            ) : (
              expiredItems.map((item) => (
                <div className="waste-item" key={item.id}>
                  <span>{item.product_name || "Not found"}</span>
                  <b>{item.expiry_date || "Not found"}</b>
                </div>
              ))
            )}
          </div>

         <button className="clean-waste-btn" onClick={handleCleanWaste}>
  🧹 Clean Waste Bin
</button>
        </div>
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
                {items.map((item) => {
                  const status = getExpiryStatus(item.expiry_date);

                  return (
                    <tr key={item.id}>
                      <td>{item.product_name || "Not found"}</td>
                      <td>{item.brand || "Not found"}</td>
                      <td>{item.mrp || "Not found"}</td>
                      <td>{item.stock_count || 0}</td>
                      <td>{item.expiry_date || "Not found"}</td>
                      <td>
                        <span className={`status ${statusClass(status)}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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

function getExpiryStatus(expiryDate) {
  if (!expiryDate || expiryDate === "Not found") return "Unknown";

  const parts = expiryDate.split("/");
  if (parts.length !== 3) return "Unknown";

  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  let year = Number(parts[2]);

  if (!day || month < 0 || !year) return "Unknown";
  if (year < 100) year += 2000;

  const expiry = new Date(year, month, day);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Expired";
  if (diffDays <= 7) return "Near Expiry";
  return "Safe";
}

function statusClass(status) {
  if (status === "Expired") return "danger";
  if (status === "Near Expiry") return "warning";
  if (status === "Safe") return "safe";
  return "unknown";
}

export default AdminPreview;