import { getAudioUrl } from "../services/api.js";

function ResultCard({ result }) {
  const info = result.extracted_info || {};

  return (
    <section className="result-card">
      <div className="section-title">
        <span>✅</span>
        <div>
          <h2>Product Information</h2>
          <p>AI extracted information from the uploaded product.</p>
        </div>
      </div>

      <div className="info-grid">
        <Info label="Product Name" value={info.product_name} />
        <Info label="Brand" value={info.brand} />
        <Info label="Category" value={info.category} />
        <Info label="MRP" value={info.mrp} />
        <Info label="Weight" value={info.weight} />
        <Info label="FSSAI License" value={info.fssai_license} />
        <Info label="Manufacturing Date" value={info.manufacture_date} />
        <Info label="Expiry Date" value={info.expiry_date} />
        <Info label="Customer Care" value={info.customer_care} />
        <Info
          label="Ingredients"
          value={info.ingredients || "Not found"}
        />
        <Info
          label="Allergens"
          value={Array.isArray(info.allergens)
            ? info.allergens.join(", ")
            : info.allergens}
        />
        <Info label="Confidence" value={info.confidence} />
      </div>

      <div className="summary-box">
        <h3>🧠 AI Summary</h3>
        <p>{result.summary}</p>
      </div>

      {result.rag && (
        <div className="summary-box">
          <h3>📚 Product Knowledge (RAG)</h3>

          <p>
            <strong>Status:</strong> {result.rag.message}
          </p>

          {result.rag.info && (
            <p>
              <strong>Information:</strong> {result.rag.info}
            </p>
          )}

          {result.rag.variants && (
            <p>
              <strong>Available Variants:</strong>{" "}
              {result.rag.variants.join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="voice-box">
        <h3>🔊 Voice Output</h3>
        <audio controls src={getAudioUrl(result.audio_url)} />
      </div>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value || "Not found"}</strong>
    </div>
  );
}

export default ResultCard;