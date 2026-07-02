function Hero() {
  return (
    <section className="hero">
      <div className="hero-badge">AI + OCR + Voice Assistant</div>
      <h1>Smart Product Reader for Elderly & Visually Impaired Users</h1>
      <p>
        Upload or capture a product packet image. The system reads important
        information like brand, FSSAI, MRP, expiry, ingredients and speaks it aloud.
      </p>

      <div className="hero-actions">
        <a href="#scan" className="primary-btn">Start Scanning</a>
        <a href="#admin" className="secondary-btn">View Admin Features</a>
      </div>
    </section>
  );
}

export default Hero;