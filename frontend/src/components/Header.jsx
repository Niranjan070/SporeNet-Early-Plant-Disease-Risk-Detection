import { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';
import './Header.css';

/**
 * App header with branding and backend status indicator.
 */
export default function Header() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const health = await checkHealth();
        setIsOnline(health.model_loaded);
      } catch {
        setIsOnline(false);
      }
    };

    check();
    const interval = setInterval(check, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-icon">🔬</div>
          <div>
            <h1 className="header-title">SporeNet</h1>
            <p className="header-tagline">Early Disease Detection for Smarter Farming</p>
          </div>
        </div>

        <div className="header-status">
          <span className={`status-dot ${isOnline ? '' : 'offline'}`}></span>
          <span>{isOnline ? 'Model Ready' : 'Connecting...'}</span>
        </div>
      </div>
    </header>
  );
}
