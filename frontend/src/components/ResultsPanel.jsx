import React from 'react';
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

  const detectedBreakdown = React.useMemo(() => {
    if (!results.detections || results.detections.length === 0) return null;
    const counts = {};
    results.detections.forEach(d => {
      counts[d.class] = (counts[d.class] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]);
  }, [results.detections]);

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
        <div className="stat-card glass" style={{ background: 'var(--color-primary-fixed)' }}>
          <div className="stat-card-label" style={{ color: 'var(--color-primary-dark)', opacity: 0.8 }}>Spore Profile</div>
          <div className="stat-card-value spore-type" style={{ color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🦠</span>
            {spore_type}
          </div>
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

      {/* Detected Breakdown */}
      {detectedBreakdown && detectedBreakdown.length > 0 && (
        <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>Detected Species Breakdown</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {detectedBreakdown.map(([clsName, count]) => (
              <span key={clsName} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <strong style={{ color: 'var(--color-primary)', textTransform: 'capitalize' }}>{clsName.replace(/_/g, ' ')}:</strong> {count}
              </span>
            ))}
          </div>
        </div>
      )}

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
              <strong>Pathogen:</strong> {spore_type}
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
