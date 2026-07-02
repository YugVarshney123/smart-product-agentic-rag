function UploadCard({ selectedFile, preview, onFileSelect, onScan }) {
  return (
    <section className="upload-card" id="scan">
      <div className="section-title">
        <span>📷</span>
        <div>
          <h2>Scan Product</h2>
          <p>Choose a packet image and let AI read it.</p>
        </div>
      </div>

      <label className="upload-box">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => onFileSelect(e.target.files[0])}
        />

        {preview ? (
          <img src={preview} alt="Selected product" className="preview-img" />
        ) : (
          <div>
            <div className="upload-icon">⬆️</div>
            <h3>Tap to upload product image</h3>
            <p>Supports JPG, PNG, JPEG, WEBP</p>
          </div>
        )}
      </label>

      {selectedFile && (
        <p className="file-name">Selected: {selectedFile.name}</p>
      )}

      <button className="scan-btn" onClick={onScan}>
        🔍 Scan Product
      </button>
    </section>
  );
}

export default UploadCard;