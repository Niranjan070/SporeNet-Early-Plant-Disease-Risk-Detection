import React, { useState } from 'react';
import AnnotatedImage from './AnnotatedImage';
import './ResultsPanel.css';

export default function ResultsPanel({ results, onNewAnalysis }) {
  if (!results) return null;

  const {
    spore_count,
    confidence_avg,
    recommendation,
    annotated_image_url,
    detections,
    scanningTime,
  } = results;

  const sortedDetections = detections ? [...detections].sort((a,b) => b.confidence - a.confidence) : [];
  // For demo, we attach mock counts to detections if they don't have them
  const mockCounts = [842, 412, 168];
  const maxCount = 1000;

  const renderClassItem = (d, index) => {
    const riskLevel = index === 0 ? 'HIGH RISK' : index === 1 ? 'MEDIUM RISK' : 'LOW RISK';
    const riskColor = index === 0 ? '#ba1a1a' : index === 1 ? '#f59e0b' : '#10b981';
    const riskBg = index === 0 ? '#ffdad6' : index === 1 ? '#fef3c7' : '#d1fae5';
    const Icon = index === 0 ? '🚨' : index === 1 ? '⚠️' : '✅';
    const count = mockCounts[index] || 100;
    const progressWidth = `${(count / maxCount) * 100}%`;

    return (
      <div key={index} className="spore-item">
        <div className="spore-item-header">
          <div className="spore-item-info">
            <span className="spore-item-icon" style={{ background: riskBg }}>{Icon}</span>
            <div>
              <div className="spore-item-name">{d.class}</div>
              <div className="spore-item-desc">{index === 0 ? 'Fungal Pathogen' : index === 1 ? 'Common Spore' : 'Environmentally Common'}</div>
            </div>
          </div>
          <div className="spore-item-count">
            <span className="count-num">{count}</span>
            <span className="count-label">COUNT</span>
          </div>
        </div>
        <div className="spore-item-progress">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: progressWidth, background: riskColor }}></div>
          </div>
          <span className="progress-badge" style={{ background: riskBg, color: riskColor }}>
            {riskLevel}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="results-panel-layout">
      {/* Header Area */}
      <div className="results-header">
        <div className="results-title-group">
          <div className="breadcrumbs">Analysis &gt; Scan #8842-Alpha</div>
          <h1 className="results-main-title">Analysis Results</h1>
        </div>
        <div className="results-actions">
          <button className="btn-secondary" onClick={onNewAnalysis}>
            <span style={{ fontSize: '1.2rem' }}>📥</span> Export PDF
          </button>
          <button className="btn-primary">
            <span style={{ fontSize: '1.2rem' }}>⚙️</span> View AI Recommendations
          </button>
        </div>
      </div>

      <div className="results-grid">
        {/* Left Column */}
        <div className="results-left">
          <div className="image-card">
            {annotated_image_url ? (
               <AnnotatedImage imageUrl={annotated_image_url} />
            ) : (
               <div className="mock-image">
                  <div className="mock-box box-1">Fusarium detected</div>
                  <div className="mock-box box-2">Alternaria</div>
                  <div className="image-controls">
                     <span>🔍+</span>
                     <span>🔍-</span>
                     <span>📚</span>
                     <span>⚗️</span>
                     <span className="mag">400x Mag.</span>
                  </div>
               </div>
            )}
          </div>

          <div className="stats-cards-row">
            <div className="stat-box">
              <div className="stat-label">CONFIDENCE SCORE</div>
              <div className="stat-val">{confidence_avg ? (confidence_avg * 100).toFixed(1) : '98.4'}% <span className="stat-up">↗ +2.1%</span></div>
            </div>
            <div className="stat-box">
              <div className="stat-label">TOTAL COUNT</div>
              <div className="stat-val">{spore_count || '1,422'}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">SCANNING TIME</div>
              <div className="stat-val">{scanningTime || '1.2s'}</div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="results-right">
          <div className="panel-card spore-classification">
            <div className="card-heading">
              <h2>Spore Classification</h2>
              <span className="filter-icon">≡</span>
            </div>
            <div className="spore-list">
              {sortedDetections.map((d, i) => renderClassItem(d, i))}
            </div>
          </div>

          <div className="panel-card soil-health">
            <div className="card-heading-small">OVERALL SOIL HEALTH</div>
            <div className="health-row">
              <span className="health-label">Microbial Diversity</span>
              <div className="indicator-blocks">
                 <div className="block filled-green"></div>
                 <div className="block filled-green"></div>
                 <div className="block filled-green"></div>
                 <div className="block empty"></div>
                 <div className="block empty"></div>
              </div>
            </div>
            <div className="health-row">
              <span className="health-label">Pathogen Pressure</span>
              <div className="indicator-blocks">
                 <div className="block filled-red"></div>
                 <div className="block filled-red"></div>
                 <div className="block filled-red"></div>
                 <div className="block filled-red"></div>
                 <div className="block empty-red"></div>
              </div>
            </div>
          </div>

          <div className="panel-card ai-summary">
            <div className="card-heading-small">AI DIAGNOSTIC SUMMARY</div>
            <p className="summary-text">{recommendation}</p>
            <div className="summary-tags">
              <span className="summary-tag">#BLIGHT_RISK</span>
              <span className="summary-tag">#HUMIDITY_ALERT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
