function RoleSelection({ onCustomer, onAdmin }) {
  return (
    <div className="landing-page">
      <div className="landing-overlay"></div>

      <section className="landing-hero">
        <div className="landing-badge">AI + OCR + RAG + Voice Assistant</div>

        <h1>🛒 Smart Shopping Assistant</h1>

        <p>
          A smart product reader for elderly and visually impaired users.
          Scan products, extract MRP, expiry, ingredients, and listen to results
          using voice.
        </p>

        <div className="role-card-grid">
          <div className="role-big-card">
            <div className="role-icon">👤</div>
            <h2>Customer</h2>
            <p>Scan products and get AI voice guidance instantly.</p>
            <ul>
              <li>OCR Product Reading</li>
              <li>AI Summary</li>
              <li>Voice Output</li>
              <li>RAG Product Knowledge</li>
            </ul>
            <button onClick={onCustomer}>Continue as Customer</button>
          </div>

          <div className="role-big-card admin-role">
            <div className="role-icon">🏪</div>
            <h2>Admin</h2>
            <p>Manage products, inventory, expiry and stock alerts.</p>
            <ul>
              <li>Product Knowledge Base</li>
              <li>Inventory Scanner</li>
              <li>Low Stock Alerts</li>
              <li>Expiry Monitoring</li>
            </ul>
            <button onClick={onAdmin}>Login as Admin</button>
          </div>
        </div>

        <div className="tech-badges">
          <span>FastAPI</span>
          <span>React</span>
          <span>PostgreSQL</span>
          <span>FAISS</span>
          <span>Llama 3</span>
          <span>OCR</span>
        </div>
      </section>
    </div>
  );
}

export default RoleSelection;