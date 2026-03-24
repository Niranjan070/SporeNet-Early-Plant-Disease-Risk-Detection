import { useState } from 'react';
import { getImageUrl } from '../services/api';
import './AnnotatedImage.css';

/**
 * Displays the annotated detection image with a click-to-fullscreen feature.
 */
export default function AnnotatedImage({ imageUrl }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!imageUrl) return null;

  const fullUrl = getImageUrl(imageUrl);

  return (
    <div className="annotated-image">
      <h3 className="annotated-image-title">
        <span>🖼️</span> Detection Output
      </h3>

      <div
        className="annotated-image-container"
        onClick={() => setIsFullscreen(true)}
      >
        <img src={fullUrl} alt="Annotated spore detection" loading="lazy" />
        <div className="annotated-image-overlay">🔍 Click to enlarge</div>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div
          className="fullscreen-overlay"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            className="fullscreen-close"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
          >
            ✕
          </button>
          <img src={fullUrl} alt="Annotated spore detection (full)" />
        </div>
      )}
    </div>
  );
}
