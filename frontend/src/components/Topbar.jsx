import React from 'react';
import './Topbar.css';

export default function Topbar() {
  return (
    <header className="topbar">
      <nav className="topbar-links">
        <a href="#" className="active">Earth-Modern Agri</a>
        <a href="#">Field View</a>
        <a href="#">Sensors</a>
        <a href="#">Reports</a>
      </nav>
      
      <div className="topbar-right">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search fields..." className="search-input" />
        </div>
        
        <button className="bell-btn" aria-label="Notifications">
          🔔
        </button>
        
        <div className="profile">
          <div className="profile-text">
            <span className="profile-name">Dr. Aris Thorne</span>
            <span className="profile-role">Senior Agronomist</span>
          </div>
          <div className="profile-avatar">
            👨‍⚕️
          </div>
        </div>
      </div>
    </header>
  );
}
