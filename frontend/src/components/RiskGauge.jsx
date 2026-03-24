import { useEffect, useState } from 'react';
import './RiskGauge.css';

/**
 * Animated semicircular gauge that visually represents disease risk level.
 *
 * The gauge uses an SVG arc with three colored zones:
 *  - Green (Low): 0-33%
 *  - Amber (Moderate): 33-66%
 *  - Red (High): 66-100%
 */
export default function RiskGauge({ riskLevel, sporeCount, normalizedCount }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate gauge position (0 to 1) based on risk level
  const getGaugePosition = () => {
    const level = riskLevel?.toLowerCase();
    if (level === 'low') {
      // Map normalized count 0-150 to gauge 0-0.33
      const ratio = Math.min(normalizedCount / 150, 1);
      return ratio * 0.33;
    } else if (level === 'moderate') {
      // Map normalized count 150-250 to gauge 0.33-0.66
      const ratio = Math.min((normalizedCount - 150) / 100, 1);
      return 0.33 + ratio * 0.33;
    } else {
      // Map normalized count 250-500 to gauge 0.66-1.0 (assuming 500 max for gauge swing limit)
      const ratio = Math.min((normalizedCount - 250) / 250, 1);
      return 0.66 + ratio * 0.34;
    }
  };

  const position = animated ? getGaugePosition() : 0;

  // SVG Arc parameters
  const cx = 110, cy = 110, r = 90;
  const startAngle = Math.PI;       // 180 degrees (left)
  const endAngle = 0;               // 0 degrees (right)
  const totalAngle = Math.PI;       // 180 degrees sweep

  // Arc path
  const arcPath = (startFraction, endFraction) => {
    const a1 = startAngle - startFraction * totalAngle;
    const a2 = startAngle - endFraction * totalAngle;
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy - r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy - r * Math.sin(a2);
    const largeArc = (endFraction - startFraction) > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Full arc circumference
  const arcLength = Math.PI * r; // Half circle

  // Gauge fill
  const fillLength = position * arcLength;
  const dashOffset = arcLength - fillLength;

  // Needle angle (line points left at 0 deg, rotates clockwise to right at 180 deg)
  const needleAngle = position * 180;

  // Color based on position
  const getColor = () => {
    const level = riskLevel?.toLowerCase();
    if (level === 'high') return 'var(--color-risk-high)';
    if (level === 'moderate') return 'var(--color-risk-moderate)';
    return 'var(--color-risk-low)';
  };

  return (
    <div className="risk-gauge">
      <div className="gauge-svg-container">
        <svg className="gauge-svg" viewBox="0 0 220 130">
          {/* Background arc */}
          <path
            className="gauge-bg"
            d={arcPath(0, 1)}
          />

          {/* Colored zone indicators (subtle) */}
          <path d={arcPath(0, 0.33)} fill="none" stroke="var(--color-risk-low)" strokeWidth="3" strokeLinecap="round" opacity="0.2" />
          <path d={arcPath(0.33, 0.66)} fill="none" stroke="var(--color-risk-moderate)" strokeWidth="3" strokeLinecap="round" opacity="0.2" />
          <path d={arcPath(0.66, 1)} fill="none" stroke="var(--color-risk-high)" strokeWidth="3" strokeLinecap="round" opacity="0.2" />

          {/* Fill arc */}
          <path
            className="gauge-fill"
            d={arcPath(0, 1)}
            stroke={getColor()}
            strokeDasharray={arcLength}
            strokeDashoffset={animated ? dashOffset : arcLength}
          />

          {/* Needle */}
          <g
            className="gauge-needle"
            style={{ 
              transform: `rotate(${animated ? needleAngle : 0}deg)`,
              transformOrigin: `${cx}px ${cy}px`
            }}
          >
            <line className="gauge-needle-line" x1={cx} y1={cy} x2={cx - r + 15} y2={cy} />
            <circle className="gauge-needle-dot" cx={cx} cy={cy} r="5" />
          </g>
        </svg>

        <div className="gauge-label-container">
          <div className={`gauge-risk-label ${riskLevel?.toLowerCase()}`}>
            {riskLevel} Risk
          </div>
        </div>
      </div>

      <div className="gauge-zone-labels">
        <span className="gauge-zone-label">Low</span>
        <span className="gauge-zone-label">Moderate</span>
        <span className="gauge-zone-label">High</span>
      </div>

      <div className="gauge-count">
        <div className="gauge-count-number" style={{ color: getColor() }}>
          {sporeCount}
        </div>
        <div className="gauge-count-label">
          Spores Detected {normalizedCount !== sporeCount && `(${normalizedCount} normalized)`}
        </div>
      </div>
    </div>
  );
}
