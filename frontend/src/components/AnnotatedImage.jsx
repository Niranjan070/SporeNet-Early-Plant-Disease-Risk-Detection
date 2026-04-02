import { useEffect, useRef, useState } from 'react';
import { getImageUrl } from '../services/api';
import './AnnotatedImage.css';

/**
 * Displays the annotated detection image with a click-to-fullscreen feature.
 */
export default function AnnotatedImage({ imageUrl, previewUrl }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // If no outcome is ready, we show the preview if available
  const activeUrl = imageUrl ? getImageUrl(imageUrl) : previewUrl;

  const handleFullscreen = async (e) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Fullscreen failed:', error);
      // Fallback to overlay if native fails
      setIsFullscreen(!isFullscreen);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  if (!activeUrl) {
    return (
      <div className="placeholder-stage">
        The annotated detection image will appear here after YOLO processes an uploaded sample.
      </div>
    );
  }

  return (
    <article className={`annotated-card ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
      <div className="stage-frame" onClick={handleFullscreen}>
        <img
          src={activeUrl}
          alt={imageUrl ? 'Annotated spore detection result' : 'Microscope sample awaiting annotation'}
          className="stage-image"
          loading="lazy"
        />

        <div className="stage-overlay">
          <button className="expand-button" type="button" onClick={handleFullscreen}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </svg>
            <span>Full Screen</span>
          </button>
        </div>
      </div>

      {isFullscreen && !document.fullscreenElement && (
        <div className="modern-overlay" onClick={() => setIsFullscreen(false)} role="dialog" aria-modal="true">
          <div className="overlay-header">
            <div className="overlay-branding">
              <span className="brand-mark sm">SN</span>
              <div>
                <p className="section-kicker">High-detail mode</p>
                <h3>{imageUrl ? 'Annotated detection' : 'Sample preview'}</h3>
              </div>
            </div>
            
            <button className="close-button" type="button" onClick={() => setIsFullscreen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="overlay-content">
            <img 
              src={activeUrl} 
              alt="Fullscreen detector output" 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>

          <div className="overlay-footer">
            <p>Click anywhere outside or use the close button to return to the dashboard.</p>
          </div>
        </div>
      )}
    </article>
  );
}
