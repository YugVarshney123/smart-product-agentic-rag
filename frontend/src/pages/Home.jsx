import { useState } from "react";
import { scanProduct } from "../services/api.js";
import Navbar from "../components/Navbar.jsx";
import Hero from "../components/Hero.jsx";
import UploadCard from "../components/UploadCard.jsx";
import ResultCard from "../components/ResultCard.jsx";
import Loading from "../components/Loading.jsx";
import AdminPreview from "../components/AdminPreview.jsx";
import Footer from "../components/Footer.jsx";

function Home({ hideAdmin = false }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setResult(null);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleScan = async () => {
    if (!selectedFile) {
      alert("Please choose a product image first.");
      return;
    }

    try {
      setLoading(true);
      const data = await scanProduct(selectedFile);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Scan failed. Please check backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <Hero />
      <main className="main-container">
        <UploadCard
          selectedFile={selectedFile}
          preview={preview}
          onFileSelect={handleFileSelect}
          onScan={handleScan}
        />
        {loading && <Loading />}
        {result && <ResultCard result={result} />}
        {!hideAdmin && <AdminPreview />}
      </main>
      <Footer />
    </div>
  );
}

export default Home;