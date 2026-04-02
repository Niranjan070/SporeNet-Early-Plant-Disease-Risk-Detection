import { useEffect, useRef, useState } from 'react';
import { Bot, Code, Info, Link, Mic, Paperclip, Send, X } from 'lucide-react';
import { sendFarmingAssistantMessage } from '../services/api';
import './FloatingFarmingAssistant.css';

const initialFarmingAssistantMessage = {
  role: 'assistant',
  content:
    'Greetings. I am your early-detection field assistant. Ask me about crop care, disease prevention, or treatment for the analyzed microscope sample.',
};

function buildHistory(messages) {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map(({ role, content }) => ({ role, content }));
}

function renderList(items = [], emptyLabel = 'No additional items yet.') {
  if (!items.length) {
    return <p className="empty-list-note">{emptyLabel}</p>;
  }

  return (
    <ul className="diagnosis-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function MessageBubble({ message }) {
  return (
    <article className={`message-bubble ${message.role}`}>
      <span className="message-role">{message.role === 'assistant' ? 'SporeNet AI' : 'You'}</span>
      <p className="message-text">{message.content}</p>
    </article>
  );
}

function FarmingAdviceCard({ advice }) {
  if (!advice) return null;

  return (
    <article className="farmer-advice-card floating-advice">
      <div className="farmer-advice-header">
        <span className="section-kicker">Field Advice</span>
        <h4>{advice.headline || 'Action guidance'}</h4>
      </div>

      <div className="farmer-advice-summary">
        <div className="farmer-advice-block primary">
          <span className="advice-label">Simple answer</span>
          <p>{advice.simple_answer || advice.farmer_message}</p>
        </div>
      </div>

      <div className="farmer-advice-grid">
        <article className="farmer-advice-panel">
          <h5>Do now</h5>
          {renderList(advice.do_now, 'No immediate actions.')}
        </article>
        <article className="farmer-advice-panel">
          <h5>Next steps</h5>
          {renderList(advice.prevent_next_time, 'No next steps.')}
        </article>
      </div>
    </article>
  );
}

export default function FloatingFarmingAssistant({ aiReady, cropType, onToast }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [farmingMessages, setFarmingMessages] = useState([initialFarmingAssistantMessage]);
  const [farmingInput, setFarmingInput] = useState('');
  const [farmingLoading, setFarmingLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const maxChars = 2000;
  const chatRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setFarmingInput(value);
      setCharCount(value.length);
    }
  };

  async function handleSend(prefill = '') {
    const message = (prefill || farmingInput).trim();
    if (!message) return;

    if (!aiReady) {
      onToast('error', 'Gemini AI is not available yet. Check the backend status.');
      return;
    }

    const history = buildHistory(farmingMessages);
    setFarmingMessages((current) => [...current, { role: 'user', content: message }]);
    setFarmingInput('');
    setCharCount(0);
    setFarmingLoading(true);

    try {
      const data = await sendFarmingAssistantMessage({
        message,
        cropType,
        history,
      });

      setFarmingMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.reply,
          advice: data.advice,
        },
      ]);
    } catch (error) {
      onToast('error', `Assistant failed. ${error.message || 'Please try again.'}`);
    } finally {
      setFarmingLoading(false);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        if (!event.target.closest('.floating-ai-button')) {
          setIsChatOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="floating-assistant-host">
      {/* Floating 3D Glowing AI Logo - Brand Adaped */}
      <button 
        className={`floating-ai-button relative transition-all duration-500 transform ${
          isChatOpen ? 'rotate-90 open' : 'rotate-0'
        }`}
        onClick={() => setIsChatOpen(!isChatOpen)}
        title={isChatOpen ? "Close Assistant" : "Ask Field Assistant"}
      >
        <div className="button-orb-base"></div>
        <div className="button-orb-3d"></div>
        <div className="button-orb-glow"></div>
        
        <div className="relative z-10 icon-layer">
          { isChatOpen ? <X size={28} /> : <Bot size={32} className="text-white" />}
        </div>
        
        <div className="absolute inset-0 rounded-full animate-pulse-glimmer opacity-40"></div>
      </button>

      {/* Chat Interface */}
      {isChatOpen && (
        <div 
          ref={chatRef}
          className="floating-chat-container"
        >
          <div className="floating-chat-glass shadow-2xl backdrop-blur-3xl overflow-hidden">
            
            {/* Header */}
            <div className="chat-header">
              <div className="header-status">
                <div className="presence-dot animate-pulse"></div>
                <span className="text-xs font-semibold">SporeNet Field Intelligence</span>
              </div>
              <div className="header-badges">
                <span className="status-badge">
                  {aiReady ? 'Gemini Live' : 'Processing Offline'}
                </span>
                <span className="pro-badge">
                  AI+
                </span>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="chat-close-header"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Conversation Window */}
            <div className="floating-message-viewport">
              <div className="message-stack-inner">
                {farmingMessages.map((msg, index) => (
                  <div className="message-wrapper" key={`${msg.role}-${index}`}>
                    <MessageBubble message={msg} />
                    {msg.role === 'assistant' && msg.advice ? <FarmingAdviceCard advice={msg.advice} /> : null}
                  </div>
                ))}
                {farmingLoading ? (
                  <div className="message-wrapper">
                    <article className="message-bubble assistant thinking">
                      <span className="message-role">SporeNet AI</span>
                      <div className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </article>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Input Section */}
            <div className="chat-composer-section">
              <textarea
                value={farmingInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={3}
                className="chat-input scrollbar-none"
                placeholder={aiReady ? "Ask about irrigation, symptoms, or yield optimization..." : "Assistant is offline"}
                disabled={!aiReady || farmingLoading}
              />
              <div className="composer-gradient-fade"></div>
            </div>

            {/* Controls Section */}
            <div className="chat-controls-footer">
              <div className="controls-row">
                <div className="attachment-group">
                  <button className="tool-btn" title="Add location context">
                    <Paperclip size={16} />
                  </button>
                  <button className="tool-btn" title="Web search">
                    <Link size={16} />
                  </button>
                  <button className="tool-btn" title="Field data history">
                    <Code size={16} />
                  </button>
                  <button className="tool-btn" title="Voice report">
                    <Mic size={16} />
                  </button>
                </div>

                <div className="right-controls">
                  <div className="char-meter">
                    <span>{charCount}</span>/<span className="muted">{maxChars}</span>
                  </div>

                  <button 
                    onClick={() => handleSend()}
                    disabled={!aiReady || farmingLoading || !farmingInput.trim()}
                    className="chat-send-btn group"
                  >
                    <Send size={20} className={farmingLoading ? 'opacity-0' : ''} />
                    {farmingLoading && <div className="spinner sm"></div>}
                  </button>
                </div>
              </div>

              {/* Bottom Help Text */}
              <div className="chat-bottom-meta">
                <div className="meta-hint">
                  <Info size={12} />
                  <span>
                    <kbd>Shift + Enter</kbd> for new line
                  </span>
                </div>

                <div className="meta-system">
                  <div className="status-indicator"></div>
                  <span>Operational</span>
                </div>
              </div>
            </div>

            <div className="glass-depth-overlay"></div>
          </div>
        </div>
      )}
    </div>
  );
}
