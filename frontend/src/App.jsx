import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import ResultsPanel from './components/ResultsPanel';
import { predictSpores } from './services/api';
import './App.css';

/**
 * SporeNet — Main Application Component
 *
 * Orchestrates the upload → analyze → results flow.
 */
export default function App() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState(null);
  const [particles, setParticles] = useState([]);

  // Generate background particles on mount
  useEffect(() => {
    const generated = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 10,
    }));
    setParticles(generated);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const handleAnalyze = useCallback(async (file) => {
    setIsLoading(true);
    setUploadProgress(0);
    setResults(null);

    try {
      const data = await predictSpores(file, (progress) => {
        setUploadProgress(progress);
      });

      setResults(data);
      showToast('success', `Analysis complete — ${data.risk_level} risk detected`);
    } catch (error) {
      console.error('Analysis failed:', error);

      let message = 'Failed to analyze image. ';
      if (error.response?.data?.detail) {
        message += error.response.data.detail;
      } else if (error.code === 'ERR_NETWORK') {
        message += 'Cannot connect to backend. Make sure the server is running on port 8000.';
      } else if (error.code === 'ECONNABORTED') {
        message += 'Request timed out. The model may be processing a large image.';
      } else {
        message += 'An unexpected error occurred. Please try again.';
      }

      showToast('error', message);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  }, []);

  const handleNewAnalysis = () => {
    setResults(null);
  };

  return (
    <div className="app">
      {/* Background particles */}
      <div className="particles-container">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="app-main">
        {/* Hero Section (only when no results) */}
        {!results && (
          <div className="app-hero">
            <h2 className="app-hero-title">
              Detect Plant Disease{' '}
              <span className="gradient-text">Before It Strikes</span>
            </h2>
            <p className="app-hero-description">
              Upload microscopic images of airborne spores. Our AI-powered detection
              system identifies Rice Blast pathogens and assesses disease risk in seconds.
            </p>
            <div className="feature-badges">
              <span className="feature-badge">🔬 YOLOv8 Detection</span>
              <span className="feature-badge">📊 Density Analysis</span>
              <span className="feature-badge">⚡ Real-time Results</span>
              <span className="feature-badge">🌾 Farmer-Friendly</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="app-content">
          {!results ? (
            <ImageUpload
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              uploadProgress={uploadProgress}
            />
          ) : (
            <ResultsPanel
              results={results}
              onNewAnalysis={handleNewAnalysis}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p className="app-footer-text">
          SporeNet v1.0 — Early Disease Detection for Smarter Farming
          <br />
          Powered by <a href="https://ultralytics.com" target="_blank" rel="noopener noreferrer">Ultralytics YOLOv8</a>
        </p>
      </footer>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.type === 'error' ? '❌' : '✅'}</span>
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
