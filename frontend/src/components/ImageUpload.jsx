import { useState, useRef, useCallback } from 'react';
import './ImageUpload.css';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_MB = 10;

/**
 * Image upload component with drag-and-drop, preview, and validation.
 */
export default function ImageUpload({ onAnalyze, isLoading, uploadProgress }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [cropType, setCropType] = useState('Unknown');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a JPG, JPEG, or PNG image.';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum: ${MAX_SIZE_MB}MB.`;
    }
    return '';
  };

  const handleFile = useCallback((file) => {
    setError('');
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleAnalyze = () => {
    if (selectedFile && onAnalyze) {
      onAnalyze(selectedFile, cropType);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="upload-section">
      <h2 className="upload-section-title">🔬 Upload Spore Image</h2>
      <p className="upload-section-subtitle">
        Upload a microscopic image of airborne plant spores for analysis
      </p>

      {/* Loading State */}
      {isLoading ? (
        <div className="upload-loading">
          <div className="loading-spinner"></div>
          <p className="loading-text">Analyzing spore sample...</p>
          <p className="loading-subtext">Running AI detection model</p>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Drop Zone */}
          <div
            className={`upload-dropzone ${isDragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <div className="upload-dropzone-content">
              <span className="upload-icon">🧫</span>
              <p className="upload-text-main">
                {isDragOver ? 'Drop your image here' : 'Drag & drop your microscope image'}
              </p>
              <p className="upload-text-sub">
                or <span className="highlight">browse files</span> to upload
              </p>
              <div className="upload-formats">
                <span className="format-badge">JPG</span>
                <span className="format-badge">JPEG</span>
                <span className="format-badge">PNG</span>
                <span>• Max {MAX_SIZE_MB}MB</span>
              </div>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            className="upload-input"
            onChange={handleInputChange}
          />

          {/* Error */}
          {error && (
            <div className="upload-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="upload-preview">
              <div className="preview-container">
                <img src={previewUrl} alt="Preview" className="preview-image" />
                <div className="preview-overlay">
                  <span className="preview-filename">{selectedFile.name}</span>
                  <span className="preview-size">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
              </div>

              <div className="upload-options" style={{ marginTop: 'var(--space-4)' }}>
                <label className="crop-label" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                  Crop Type (Optional for Gemini AI)
                </label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    marginBottom: 'var(--space-4)'
                  }}
                >
                  <option value="Unknown">Unknown / Auto Detect</option>
                  <option value="Rice">Rice</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Corn">Corn</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Grasses">Grasses</option>
                  <option value="Potato">Potato</option>
                  <option value="Banana">Banana</option>
                </select>
              </div>

              <div className="upload-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleAnalyze}
                  disabled={isLoading}
                >
                  🔍 Analyze Spores
                </button>
                <button className="btn btn-secondary" onClick={handleClear}>
                  ✕ Clear
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
