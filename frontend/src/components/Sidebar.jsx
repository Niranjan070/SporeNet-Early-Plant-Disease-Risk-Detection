import React from 'react';
import './Sidebar.css';

export default function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'Dashboard', icon: '📊' },
    { id: 'Image Upload', icon: '📁' },
    { id: 'Analysis Results', icon: '📈' },
    { id: 'AI Recommendations', icon: '🤖' },
    { id: 'Field History', icon: '⏱️' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1 className="sidebar-title">AgrIntel</h1>
        <p className="sidebar-subtitle">Spore Analysis Pro</p>
      </div>

      <nav className="sidebar-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="sidebar-nav-icon">{tab.icon}</span>
            {tab.id}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button 
          className="sidebar-btn-scan"
          onClick={() => setActiveTab('Image Upload')}
        >
          ➕ New Scan
        </button>
        <button className="sidebar-nav-item">
          <span className="sidebar-nav-icon">⚙️</span>
          Settings
        </button>
        <button className="sidebar-nav-item" style={{ marginBottom: '1rem' }}>
          <span className="sidebar-nav-icon">❓</span>
          Support
        </button>
      </div>
    </aside>
  );
}
