import React from 'react';
import './Dashboard.css';

export default function Dashboard() {
  const stats = [
    { label: 'Total Fields Scanned', value: '42', up: '+3 this week' },
    { label: 'Avg. Pathogen Pressure', value: '14%', up: '-2% improved' },
    { label: 'Alerts Resolved', value: '128', up: '98% efficiency' },
    { label: 'Active Recommendations', value: '5', up: 'Urgent' },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Farmer Dashboard</h1>
        <p className="dashboard-subtitle">Overview of your regional crop health and recent scans</p>
      </div>

      <div className="dashboard-stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="dashboard-stat-card glass-strong">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-meta" style={{ color: stat.up.includes('-') || stat.up.includes('improved') ? '#10B981' : '#F59E0B' }}>
              {stat.up}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-main-grid">
        <div className="dashboard-chart-card glass-strong">
          <h2>Spore Concentration Over Time</h2>
          <div className="mock-chart">
            <div className="chart-bar" style={{ height: '40%' }}></div>
            <div className="chart-bar" style={{ height: '60%' }}></div>
            <div className="chart-bar" style={{ height: '35%' }}></div>
            <div className="chart-bar" style={{ height: '80%' }}></div>
            <div className="chart-bar" style={{ height: '55%' }}></div>
            <div className="chart-bar" style={{ height: '90%' }}></div>
            <div className="chart-bar" style={{ height: '70%' }}></div>
          </div>
          <div className="chart-legend">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        <div className="dashboard-recent-card glass-strong">
          <h2>Regional Health Map</h2>
          <div className="mock-map">
             <div className="map-point red" style={{ top: '30%', left: '40%' }}></div>
             <div className="map-point orange" style={{ top: '60%', left: '70%' }}></div>
             <div className="map-point green" style={{ top: '40%', left: '20%' }}></div>
             <div className="map-point green" style={{ top: '80%', left: '50%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
