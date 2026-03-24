import RiskGauge from './RiskGauge';
import AnnotatedImage from './AnnotatedImage';
import './ResultsPanel.css';

/**
 * Displays complete analysis results including risk gauge,
 * detection stats, recommendations, and annotated image.
 */
export default function ResultsPanel({ results, onNewAnalysis }) {
  if (!results) return null;

  const {
    spore_type,
    disease,
    affected_crop,
    description,
    spore_count,
    coverage_percent,
    confidence_avg,
    risk_level,
    recommendation,
    precautions,
    annotated_image_url,
    image_width,
    image_height,
  } = results;

  const riskClass = risk_level?.toLowerCase();

  const getRiskIcon = () => {
    switch (riskClass) {
      case 'low': return '✅';
      case 'moderate': return '⚠️';
      case 'high': return '🚨';
      default: return '📊';
    }
  };

  return (
    <div className="results-panel">
      <h2 className="results-panel-title">
        <span>📊</span> Analysis Results
      </h2>

      {/* Risk Gauge */}
      <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-6)' }}>
        <RiskGauge
          riskLevel={risk_level}
          sporeCount={spore_count}
          coveragePercent={coverage_percent}
        />
      </div>

      {/* Stats Grid */}
      <div className="results-stats">
        <div className="stat-card glass">
          <div className="stat-card-label">Spore Type</div>
          <div className="stat-card-value spore-type">{spore_type}</div>
        </div>

        <div className="stat-card glass">
          <div className="stat-card-label">Risk Level</div>
          <div className="stat-card-value">
            <span className={`risk-badge ${riskClass}`}>
              <span className="risk-badge-dot"></span>
              {risk_level}
            </span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-card-label">Detection Confidence</div>
          <div className="stat-card-value">
            {(confidence_avg * 100).toFixed(1)}%
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-card-label">Image Resolution</div>
          <div className="stat-card-value">
            {image_width} × {image_height}
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className={`results-recommendation ${riskClass}`}>
        <h3 className="recommendation-title">
          {getRiskIcon()} Recommendation
        </h3>
        <p className="recommendation-text">{recommendation}</p>

        {precautions && precautions.length > 0 && (
          <>
            <h4 className="precautions-title">Action Items</h4>
            <ul className="precautions-list">
              {precautions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Annotated Image */}
      {annotated_image_url && (
        <AnnotatedImage imageUrl={annotated_image_url} />
      )}

      {/* Disease Info */}
      {description && (
        <div className="disease-info glass">
          <h3 className="disease-info-title">
            <span>🦠</span> About {disease}
          </h3>
          <p className="disease-info-text">{description}</p>
          <div className="disease-meta">
            <span className="disease-meta-item">
              <strong>Pathogen:</strong> Magnaporthe oryzae
            </span>
            <span className="disease-meta-item">
              <strong>Affected Crop:</strong> {affected_crop}
            </span>
            <span className="disease-meta-item">
              <strong>Type:</strong> Fungal
            </span>
          </div>
        </div>
      )}

      {/* New Analysis Button */}
      <button className="new-analysis-btn" onClick={onNewAnalysis}>
        🔬 Analyze Another Sample
      </button>
    </div>
  );
}
