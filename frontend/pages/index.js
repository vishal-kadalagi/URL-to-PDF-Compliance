import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [url, setUrl] = useState("");
  const [maxPages, setMaxPages] = useState(10);
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState(null);

  // Function to get the API base URL depending on environment
  const getApiBaseUrl = () => {
    // Check if we're running in development vs production
    const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    
    if (isDev) {
      // During development, backend runs on localhost:5000
      return 'http://localhost:5000';
    } else {
      // In production/hosted environment, backend runs on the same host
      // or can be configured via environment variable
      const backendHost = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      if (backendHost) {
        return backendHost;
      }
      // If no explicit backend URL, assume same host
      if (typeof window !== 'undefined') {
        return `${window.location.protocol}//${window.location.hostname}:${process.env.NEXT_PUBLIC_BACKEND_PORT || '5000'}`;
      }
      // Fallback
      return 'http://localhost:5000';
    }
  };

  const handleConvert = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError("");
    setPages([]);
    setSelectedPdf("");
    setJobId(null);

    const apiBaseUrl = getApiBaseUrl();

    try {
      const res = await axios.post(`${apiBaseUrl}/convert`, { 
        url, 
        maxPages: parseInt(maxPages) || 10 
      }, { timeout: 300000 });

      if (res.data.pages && res.data.pages.length > 0) {
        setPages(res.data.pages);
        setSelectedPdf(res.data.mergedPdf);
        setJobId(res.data.jobId);
      } else {
        setError("No pages found for this URL.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Conversion failed. Try a different website."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>URL → PDF Compliance Tool</h1>
      <p>Convert partner websites into audit-ready PDFs instantly</p>

      {/* Input */}
      <div className="input-box">
        <input
          type="text"
          placeholder="Enter website URL (https://example.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="controls">
          <input
            type="number"
            placeholder="Max pages"
            value={maxPages}
            onChange={(e) => setMaxPages(e.target.value)}
            min="1"
            max="50"
            style={{ width: "80px", marginRight: "10px" }}
          />
          <button onClick={handleConvert} disabled={loading}>
            {loading ? "Processing..." : "Convert"}
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {/* Dashboard: Pages + PDF Preview */}
      <div className="dashboard">
        {/* Pages Panel */}
        <div className="pages-panel">
          <h2>Website Pages ({pages.length})</h2>
          <ul className="pages">
            {pages.length > 0 ? (
              pages.map((page, idx) => (
                <li
                  key={idx}
                  onClick={() => setSelectedPdf(page.pdf)}
                  className={page.videoDetected ? "video-flag" : ""}
                >
                  {page.pageUrl}
                  {page.videoDetected && <span title="Video detected"> 🎬</span>}
                </li>
              ))
            ) : (
              <li>No pages found yet.</li>
            )}
          </ul>
        </div>

        {/* PDF Preview Panel */}
        <div className="pdf-panel">
          <h2>PDF Preview</h2>
          {selectedPdf ? (
            <iframe
              src={`${getApiBaseUrl()}/output/${selectedPdf}`}
              title="PDF Preview"
              style={{ width: "100%", height: "600px", border: "1px solid #ccc", borderRadius: "8px" }}
            />
          ) : (
            <p>PDF will appear here when selected.</p>
          )}

          {selectedPdf && (
            <div className="download-section">
              <a 
                href={`${getApiBaseUrl()}/output/${selectedPdf}`} 
                className="download"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Selected PDF
              </a>
              {jobId && (
                <a 
                  href={`${getApiBaseUrl()}/output/${jobId}/merged.pdf`} 
                  className="download"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginLeft: "10px" }}
                >
                  Download Full Report
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}