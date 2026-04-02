import { useEffect, useState } from 'react';
import AIAssistants from './components/AIAssistants';
import FloatingFarmingAssistant from './components/FloatingFarmingAssistant';
import AnnotatedImage from './components/AnnotatedImage';
import { checkHealth, predictSpores } from './services/api';
import './App.css';

const capabilityCards = [
  {
    id: '01',
    title: 'Image-first analysis',
    description:
      'The farmer starts with one microscope image, not a maze of tabs. The product responds around that sample.',
  },
  {
    id: '02',
    title: 'Frequency-aware disease signal',
    description:
      'YOLO detections, spore count, and coverage all feed the early disease warning instead of a single label.',
  },
  {
    id: '03',
    title: 'Live Gemini copilots',
    description:
      'The general farm assistant and the image diagnosis assistant now run inside the same application.',
  },
];

const workflowSteps = [
  'Upload a microscopic image from the farmer or field technician.',
  'Run YOLO detection, count the spores, and estimate coverage.',
  'Ask Gemini for practical farming help or a diagnosis linked to the analyzed image.',
];

function formatNumber(value) {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat('en-US').format(numericValue);
}

function formatPercent(value) {
  const numericValue = Number(value || 0);
  return `${numericValue.toFixed(1)}%`;
}

function formatConfidence(value) {
  const numericValue = Number(value || 0) * 100;
  return `${numericValue.toFixed(1)}%`;
}

function formatFileSize(file) {
  if (!file) {
    return 'Waiting for a microscope sample';
  }

  const sizeInKb = file.size / 1024;
  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(0)} KB`;
  }

  return `${(sizeInKb / 1024).toFixed(2)} MB`;
}

function getRiskTone(level = '') {
  if (!level) return 'pending';

  const normalized = level.toLowerCase();
  if (normalized === 'high') return 'high';
  if (normalized === 'moderate') return 'moderate';
  return 'low';
}

function groupDetections(detections = []) {
  return Object.values(
    detections.reduce((accumulator, detection) => {
      const key = detection.class || 'Unknown';
      const current = accumulator[key] || {
        name: key,
        count: 0,
        totalConfidence: 0,
      };

      current.count += 1;
      current.totalConfidence += Number(detection.confidence || 0);
      accumulator[key] = current;
      return accumulator;
    }, {})
  ).map((group) => ({
    ...group,
    averageConfidence: group.count ? (group.totalConfidence / group.count) * 100 : 0,
  }));
}

function buildFrequencyNarrative(results) {
  if (!results) {
    return 'Run one real analysis and this panel will translate YOLO detections and spore frequency into a farmer-friendly disease signal. No mock result is shown before the backend responds.';
  }

  const riskLevel = results.risk_level || 'Unknown';
  return `The sample shows ${formatNumber(results.spore_count)} detected spores with approximately ${formatPercent(
    results.coverage_percent
  )} slide coverage. That frequency pattern currently maps to a ${riskLevel.toLowerCase()} early warning for ${
    results.disease || 'the suspected disease'
  }, so the recommendation should be treated as a field action cue, not just a report.`;
}

function scrollToSection(sectionId) {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

export default function App() {
  const [backendStatus, setBackendStatus] = useState({
    state: 'checking',
    detail: 'Checking backend, YOLO model, and Gemini availability',
    aiReady: false,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cropType, setCropType] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHealth() {
      try {
        const health = await checkHealth();
        if (!isMounted) return;

        const modelReady = Boolean(health.model_loaded);
        const aiReady = Boolean(health.gemini_configured);

        let detail = 'Backend is reachable.';
        let state = 'degraded';

        if (modelReady && aiReady) {
          detail = 'YOLO and Gemini are both ready for analysis and assistant features';
          state = 'ready';
        } else if (modelReady) {
          detail = 'YOLO is ready, but Gemini AI is not configured';
          state = 'degraded';
        } else {
          detail = 'Backend is reachable, but the YOLO model is not fully loaded yet';
        }

        setBackendStatus({ state, detail, aiReady });
      } catch (error) {
        if (!isMounted) return;

        setBackendStatus({
          state: 'offline',
          detail: 'Frontend is running, but the backend could not be reached',
          aiReady: false,
        });
      }
    }

    loadHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const groupedDetections = groupDetections(results?.detections || []);
  const riskTone = getRiskTone(results?.risk_level);

  function showToast(tone, message) {
    setToast({ tone, message });
  }

  function updateSelectedFile(file) {
    if (!file) return;
    setSelectedFile(file);
    setResults(null);
    setUploadProgress(0);
  }

  function handleFileChange(event) {
    updateSelectedFile(event.target.files?.[0]);
  }

  async function handleAnalyze() {
    if (!selectedFile) {
      showToast('error', 'Choose a microscopic image before you start the analysis.');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setResults(null);

    try {
      const data = await predictSpores(selectedFile, cropType || 'Unknown', setUploadProgress);
      setResults(data);
      showToast('success', `Analysis completed. ${data.risk_level || 'Latest'} risk result is ready.`);
      scrollToSection('analysis-results');
    } catch (error) {
      let message = 'Analysis failed. ';

      if (error.response?.data?.detail) {
        message += error.response.data.detail;
      } else if (error.code === 'ERR_NETWORK') {
        message += 'The frontend could not connect to the backend.';
      } else {
        message += 'An unexpected error occurred while processing the sample.';
      }

      showToast('error', message);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setResults(null);
    setUploadProgress(0);
    showToast('success', 'The workspace is cleared and ready for a new sample.');
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark">SN</div>
          <div className="brand-copy">
            <p className="section-kicker">Microscope Intelligence For Farming</p>
            <h1>SporeNet</h1>
          </div>
        </div>

        <nav className="header-nav" aria-label="Primary">
          <button className="nav-button" type="button" onClick={() => scrollToSection('overview')}>
            Overview
          </button>
          <button className="nav-button" type="button" onClick={() => scrollToSection('analysis-lab')}>
            Analysis Lab
          </button>
          <button className="nav-button" type="button" onClick={() => scrollToSection('ai-assistants')}>
            AI Assistants
          </button>
        </nav>

        <div className={`status-pill ${backendStatus.state}`}>
          <span className="status-dot" />
          <span>{backendStatus.detail}</span>
        </div>
      </header>

      <div className="app-layout">
        <main className="app-main">
          <section className="hero-panel" id="overview">
            <article className="hero-copy">
              <p className="section-kicker">Integrated AI Workflow</p>
              <h2 className="hero-title">
                One frontend for <span className="hero-accent">YOLO detection</span>, disease prediction, and live
                Gemini assistants.
              </h2>
              <p className="hero-body">
                The application now keeps the full flow in one place: upload the microscope image, review the detected
                spore and frequency, then talk to Gemini for both general farming help and image-specific diagnosis.
              </p>

              <div className="hero-actions">
                <button className="primary-button" type="button" onClick={() => scrollToSection('analysis-lab')}>
                  Start microscope analysis
                </button>
                <button className="secondary-button" type="button" onClick={() => scrollToSection('ai-assistants')}>
                  Open AI assistants
                </button>
              </div>

              <div className="hero-stat-grid">
                <article className="stat-card">
                  <span className="stat-label">Model Readiness</span>
                  <strong className="stat-value">
                    {backendStatus.state === 'ready'
                      ? 'Ready'
                      : backendStatus.state === 'degraded'
                        ? 'Partial'
                        : backendStatus.state === 'offline'
                          ? 'Offline'
                          : 'Checking'}
                  </strong>
                  <p className="stat-helper">{backendStatus.detail}</p>
                </article>

                <article className="stat-card">
                  <span className="stat-label">Detection Logic</span>
                  <strong className="stat-value">YOLO + frequency</strong>
                  <p className="stat-helper">Count, coverage, and class breakdown shape the disease signal.</p>
                </article>

                <article className="stat-card">
                  <span className="stat-label">Gemini Assistants</span>
                  <strong className="stat-value">{backendStatus.aiReady ? 'Live' : 'Waiting'}</strong>
                  <p className="stat-helper">
                    The farming chat and image diagnosis assistant use the backend Gemini key.
                  </p>
                </article>
              </div>
            </article>

            <aside className="hero-side-stack">
              {capabilityCards.map((card) => (
                <article className="capability-card" key={card.id}>
                  <span className="capability-id">{card.id}</span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              ))}

              <article className="process-card">
                <p className="section-kicker process-kicker">Core Flow</p>
                <ul className="process-list">
                  {workflowSteps.map((step, index) => (
                    <li className="process-item" key={step}>
                      <span className="process-index">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </aside>
          </section>

          <section className="analysis-layout" id="analysis-lab">
            <article className="workspace-card">
              <div className="card-header">
                <div>
                  <p className="section-kicker">Analysis Lab</p>
                  <h2 className="card-title">Upload a microscopic image and inspect the real result</h2>
                  <p className="card-subtitle">
                    The new frontend removes demo values. This workspace only fills with actual backend output after
                    the farmer uploads a sample.
                  </p>
                </div>
                <span className="soft-badge">{isLoading ? 'Analyzing now' : 'Awaiting sample'}</span>
              </div>

              <label
                className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${previewUrl ? 'has-file' : ''}`}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  updateSelectedFile(event.dataTransfer.files?.[0]);
                }}
              >
                <input
                  className="file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                />

                {previewUrl ? (
                  <div className="upload-preview">
                    <img src={previewUrl} alt="Microscope sample preview" />
                    <div className="preview-panel">
                      <div>
                        <span className="preview-label">Selected Image</span>
                        <p className="preview-file-name">{selectedFile?.name}</p>
                        <p className="preview-meta">{formatFileSize(selectedFile)}</p>
                      </div>

                      <div className="preview-footnote">
                        Drop another image here anytime to replace the current sample before analysis.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="upload-empty">
                    <span className="preview-label">Drag and drop or click to browse</span>
                    <h3>Microscope image workspace</h3>
                    <p>
                      Add a JPG or PNG sample captured from the slide. The system will detect spore types, count their
                      frequency, and estimate early disease risk.
                    </p>
                  </div>
                )}
              </label>

              <div className="field-row">
                <div className="field-group">
                  <label className="field-label" htmlFor="crop-type">
                    Crop type
                  </label>
                  <input
                    className="text-input"
                    id="crop-type"
                    type="text"
                    value={cropType}
                    onChange={(event) => setCropType(event.target.value)}
                    placeholder="Rice, wheat, chilli, tomato..."
                  />
                </div>

                <div className="field-group">
                  <span className="field-label">Current sample</span>
                  <div className="input-display">{selectedFile ? selectedFile.name : 'No sample selected yet'}</div>
                </div>
              </div>

              {isLoading ? (
                <div className="progress-shell" aria-live="polite">
                  <div className="progress-meta">
                    <span>Uploading and analyzing</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : null}

              <div className="action-row">
                <button className="primary-button" type="button" onClick={handleAnalyze} disabled={isLoading}>
                  {isLoading ? 'Analyzing sample...' : 'Analyze spores'}
                </button>
                <button className="ghost-button" type="button" onClick={handleReset}>
                  Clear workspace
                </button>
              </div>
            </article>

            <article className="workspace-card" id="analysis-results">
              <div className="card-header">
                <div>
                  <p className="section-kicker">Outcome Snapshot</p>
                  <h2 className="card-title">Real analysis result</h2>
                  <p className="card-subtitle">
                    Primary spore type, count, coverage, confidence, and crop-aware recommendation all surface here.
                  </p>
                </div>
                {results ? <span className={`risk-chip ${riskTone}`}>{results.risk_level} risk</span> : null}
              </div>

              {results ? (
                <>
                  <div className="snapshot-grid">
                    <article className="snapshot-card">
                      <span className="snapshot-label">Detected Spore</span>
                      <strong>{results.spore_type}</strong>
                    </article>
                    <article className="snapshot-card">
                      <span className="snapshot-label">Spore Count</span>
                      <strong>{formatNumber(results.spore_count)}</strong>
                    </article>
                    <article className="snapshot-card">
                      <span className="snapshot-label">Coverage</span>
                      <strong>{formatPercent(results.coverage_percent)}</strong>
                    </article>
                    <article className="snapshot-card">
                      <span className="snapshot-label">Avg Confidence</span>
                      <strong>{formatConfidence(results.confidence_avg)}</strong>
                    </article>
                  </div>

                  <div className="summary-note">
                    <h3>{results.disease}</h3>
                    <p>{results.recommendation}</p>
                  </div>
                </>
              ) : (
                <div className="placeholder-state">
                  Upload a real microscope image to activate this panel. It intentionally stays empty until the backend
                  returns an actual prediction.
                </div>
              )}
            </article>
          </section>

          <section className="results-grid">
            <article className="detail-card">
              <div className="card-header">
                <div>
                  <p className="section-kicker">Detection View</p>
                  <h2 className="card-title">Annotated output image</h2>
                </div>
              </div>

              <div className="visual-stage">
                <AnnotatedImage imageUrl={results?.annotated_image_url} previewUrl={previewUrl} />
              </div>

              <div className="visual-stage-caption">
                {results?.annotated_image_url
                  ? 'YOLO annotations are now visible on the processed sample.'
                  : previewUrl
                    ? 'Preview loaded. Run the analysis to generate bounding-box annotations.'
                    : 'No image loaded yet.'}
              </div>
            </article>

            <article className="detail-card">
              <div className="card-header">
                <div>
                  <p className="section-kicker">Disease Intelligence</p>
                  <h2 className="card-title">Grouped detections and prevention detail</h2>
                </div>
              </div>

              {results ? (
                <>
                  <div className="summary-panel">
                    <h3>{results.disease}</h3>
                    <p>{results.description}</p>
                  </div>

                  <div className="split-column">
                    <div>
                      <h3 className="list-title">Detected spore clusters</h3>
                      {groupedDetections.length ? (
                        <ul className="detection-list">
                          {groupedDetections.map((group) => (
                            <li className="detection-item" key={group.name}>
                              <div>
                                <strong>{group.name}</strong>
                                <p>{group.count} detections</p>
                              </div>
                              <span>{group.averageConfidence.toFixed(1)}% avg confidence</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="placeholder-state">
                          No spore clusters were returned for this sample, so the result should be treated as a clean
                          or uncertain image until another capture confirms it.
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="list-title">Recommended precautions</h3>
                      {(results.precautions || []).length ? (
                        <ul className="precaution-list">
                          {(results.precautions || []).map((item) => (
                            <li className="precaution-item" key={item}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="placeholder-state">
                          The backend did not return prevention actions for this run, so the image assistant can help
                          you expand the response using Gemini.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="placeholder-state">
                  Disease description, grouped detections, and prevention items will appear here after the first real
                  backend response.
                </div>
              )}
            </article>

            <article className="detail-card full-span">
              <div className="card-header">
                <div>
                  <p className="section-kicker">Frequency Signal</p>
                  <h2 className="card-title">How the sample supports early prediction</h2>
                </div>
              </div>

              <div className="frequency-panel">
                <div className="summary-panel">
                  <h3>Frequency-aware reading</h3>
                  <p>{buildFrequencyNarrative(results)}</p>
                </div>

                <div className={`frequency-meter ${riskTone}`}>
                  <span className="stat-label">Current Risk</span>
                  <strong className="meter-value">{results?.risk_level || 'Waiting'}</strong>
                  <p>
                    {results
                      ? `${formatNumber(results.spore_count)} spores detected in this sample`
                      : 'Upload a sample to compute the first risk signal'}
                  </p>
                </div>
              </div>
            </article>
          </section>

          <AIAssistants aiReady={backendStatus.aiReady} cropType={cropType} results={results} onToast={showToast} />
        </main>

      <FloatingFarmingAssistant 
        aiReady={backendStatus.aiReady} 
        cropType={cropType} 
        onToast={showToast} 
      />
      </div>

      {toast ? <div className={`toast ${toast.tone}`}>{toast.message}</div> : null}
    </div>
  );
}
