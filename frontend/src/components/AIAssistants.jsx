import { useEffect, useState } from 'react';
import {
  DEFAULT_IMAGE_DIAGNOSIS_QUESTION,
  FARMING_ASSISTANT_STARTERS,
  IMAGE_ASSISTANT_STARTERS,
} from '../content/assistantPrompts';
import { requestImageDiagnosis, sendFarmingAssistantMessage } from '../services/api';

const initialFarmingAssistantMessage = {
  role: 'assistant',
  content:
    'Ask me about crop care, disease prevention, irrigation, or field planning. I will answer inside the app using Gemini.',
};

function buildHistory(messages) {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map(({ role, content }) => ({ role, content }));
}

function getErrorMessage(error, fallback) {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }

  if (error.code === 'ERR_NETWORK') {
    return 'The frontend could not connect to the backend.';
  }

  return fallback;
}

function MessageBubble({ message }) {
  return (
    <article className={`message-bubble ${message.role}`}>
      <span className="message-role">{message.role === 'assistant' ? 'SporeNet AI' : 'You'}</span>
      <p className="message-text">{message.content}</p>
    </article>
  );
}

export default function AIAssistants({ aiReady, cropType, results, onToast }) {
  const [farmingMessages, setFarmingMessages] = useState([initialFarmingAssistantMessage]);
  const [farmingInput, setFarmingInput] = useState('');
  const [farmingLoading, setFarmingLoading] = useState(false);
  const [diagnosisMessages, setDiagnosisMessages] = useState([]);
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState(null);

  useEffect(() => {
    if (results) {
      setDiagnosisMessages([
        {
          role: 'assistant',
          content:
            'The microscope analysis is ready. Ask for a full diagnosis, frequency interpretation, or prevention plan.',
        },
      ]);
      setDiagnosisResult(null);
      setDiagnosisInput('');
      return;
    }

    setDiagnosisMessages([]);
    setDiagnosisResult(null);
    setDiagnosisInput('');
  }, [results]);

  async function handleFarmingAssistantSend(prefill = '') {
    const message = (prefill || farmingInput).trim();
    if (!message) return;

    if (!aiReady) {
      onToast('error', 'Gemini AI is not available yet. Check the backend status and API key.');
      return;
    }

    const history = buildHistory(farmingMessages);
    setFarmingMessages((current) => [...current, { role: 'user', content: message }]);
    setFarmingInput('');
    setFarmingLoading(true);

    try {
      const data = await sendFarmingAssistantMessage({
        message,
        cropType,
        history,
      });

      setFarmingMessages((current) => [...current, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      onToast('error', `Farming assistant failed. ${getErrorMessage(error, 'Please try again.')}`);
    } finally {
      setFarmingLoading(false);
    }
  }

  async function handleImageDiagnosisSend(prefill = '') {
    if (!results) {
      onToast('error', 'Run the microscope analysis first so the image assistant has real data to use.');
      return;
    }

    if (!aiReady) {
      onToast('error', 'Gemini AI is not available yet. Check the backend status and API key.');
      return;
    }

    const question = (prefill || diagnosisInput).trim() || DEFAULT_IMAGE_DIAGNOSIS_QUESTION;
    const history = buildHistory(diagnosisMessages);

    setDiagnosisMessages((current) => [...current, { role: 'user', content: question }]);
    setDiagnosisInput('');
    setDiagnosisLoading(true);

    try {
      const data = await requestImageDiagnosis({
        analysis: results,
        cropType,
        question,
        history,
      });

      setDiagnosisResult(data.diagnosis);
      setDiagnosisMessages((current) => [...current, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      onToast('error', `Image assistant failed. ${getErrorMessage(error, 'Please try again.')}`);
    } finally {
      setDiagnosisLoading(false);
    }
  }

  return (
    <section className="assistants-section" id="ai-assistants">
      <div className="section-heading">
        <p className="section-kicker">AI Assistants</p>
        <h2>Gemini now works directly inside the application</h2>
        <p>
          The first assistant answers broad farming questions. The second assistant reads the actual YOLO output of the
          current microscope analysis and explains the spore, disease risk, and prevention steps.
        </p>
      </div>

      <div className="assistants-grid">
        <article className="assistant-card">
          <div className="card-header">
            <div>
              <p className="section-kicker">Assistant One</p>
              <h3 className="card-title">General farming support</h3>
            </div>
            <span className={`soft-badge ${aiReady ? '' : 'muted-badge'}`}>
              {aiReady ? 'Gemini live' : 'Gemini unavailable'}
            </span>
          </div>

          <p className="assistant-intro">Farmers can ask normal farming questions here without leaving the app.</p>

          <div className="conversation-panel">
            <div className="message-list">
              {farmingMessages.map((message, index) => (
                <MessageBubble key={`${message.role}-${index}`} message={message} />
              ))}
              {farmingLoading ? (
                <article className="message-bubble assistant">
                  <span className="message-role">SporeNet AI</span>
                  <p className="message-text">Thinking through the farming guidance...</p>
                </article>
              ) : null}
            </div>

            <div className="starter-list">
              {FARMING_ASSISTANT_STARTERS.map((item) => (
                <button
                  className="starter-chip"
                  key={item}
                  type="button"
                  onClick={() => handleFarmingAssistantSend(item)}
                  disabled={farmingLoading}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="assistant-composer">
              <textarea
                className="assistant-input"
                value={farmingInput}
                onChange={(event) => setFarmingInput(event.target.value)}
                placeholder="Ask about disease prevention, irrigation, crop stress, soil health..."
                rows={4}
              />
              <div className="assistant-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => handleFarmingAssistantSend()}
                  disabled={farmingLoading}
                >
                  {farmingLoading ? 'Sending...' : 'Ask farming assistant'}
                </button>
              </div>
            </div>
          </div>
        </article>

        <article className="assistant-card featured">
          <div className="card-header">
            <div>
              <p className="section-kicker">Assistant Two</p>
              <h3 className="card-title">Image diagnosis assistant</h3>
            </div>
            <span className="soft-badge dark-badge">{results ? 'Analysis linked' : 'Waiting for analysis'}</span>
          </div>

          <p className="assistant-intro">
            This assistant uses the current microscope result, including spore count, coverage, and disease signal.
          </p>

          <div className="context-row">
            <span className="context-pill">Crop: {cropType || 'Unknown'}</span>
            <span className="context-pill">Spore: {results?.spore_type || 'Waiting for result'}</span>
            <span className="context-pill">Risk: {results?.risk_level || 'Waiting for result'}</span>
          </div>

          {results ? (
            <>
              <div className="assistant-actions quick-action-row">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => handleImageDiagnosisSend(DEFAULT_IMAGE_DIAGNOSIS_QUESTION)}
                  disabled={diagnosisLoading}
                >
                  {diagnosisLoading ? 'Generating...' : 'Generate full image diagnosis'}
                </button>
              </div>

              <div className="conversation-panel dark-panel">
                <div className="message-list dark-list">
                  {diagnosisMessages.map((message, index) => (
                    <MessageBubble key={`${message.role}-${index}`} message={message} />
                  ))}
                  {diagnosisLoading ? (
                    <article className="message-bubble assistant dark-bubble">
                      <span className="message-role">SporeNet AI</span>
                      <p className="message-text">Reviewing the analyzed image and preparing a diagnosis...</p>
                    </article>
                  ) : null}
                </div>

                <div className="starter-list">
                  {IMAGE_ASSISTANT_STARTERS.map((item) => (
                    <button
                      className="starter-chip"
                      key={item}
                      type="button"
                      onClick={() => handleImageDiagnosisSend(item)}
                      disabled={diagnosisLoading}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="assistant-composer">
                  <textarea
                    className="assistant-input dark-input"
                    value={diagnosisInput}
                    onChange={(event) => setDiagnosisInput(event.target.value)}
                    placeholder="Ask what this spore means, how severe the frequency looks, or what to do next..."
                    rows={4}
                  />
                  <div className="assistant-actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => handleImageDiagnosisSend()}
                      disabled={diagnosisLoading}
                    >
                      {diagnosisLoading ? 'Sending...' : 'Ask image assistant'}
                    </button>
                  </div>
                </div>
              </div>

              {diagnosisResult ? (
                <div className="diagnosis-layout">
                  <article className="diagnosis-hero">
                    <span className="section-kicker diagnosis-kicker">Latest Diagnosis</span>
                    <h3>{diagnosisResult.headline}</h3>
                    <p>{diagnosisResult.farmer_message}</p>
                  </article>

                  <div className="diagnosis-grid">
                    <article className="diagnosis-card">
                      <h4>Spore explanation</h4>
                      <p>{diagnosisResult.spore_explanation}</p>
                    </article>
                    <article className="diagnosis-card">
                      <h4>Frequency interpretation</h4>
                      <p>{diagnosisResult.frequency_interpretation}</p>
                    </article>
                    <article className="diagnosis-card full-diagnosis-card">
                      <h4>Disease outlook</h4>
                      <p>{diagnosisResult.disease_outlook}</p>
                    </article>
                  </div>

                  <div className="diagnosis-grid">
                    <article className="diagnosis-card">
                      <h4>Immediate actions</h4>
                      <ul className="diagnosis-list">
                        {diagnosisResult.immediate_actions.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                    <article className="diagnosis-card">
                      <h4>Next week actions</h4>
                      <ul className="diagnosis-list">
                        {diagnosisResult.next_week_actions.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                    <article className="diagnosis-card">
                      <h4>Monitoring plan</h4>
                      <ul className="diagnosis-list">
                        {diagnosisResult.monitoring_plan.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  </div>

                  {(diagnosisResult.urgent_flags || []).length ? (
                    <article className="diagnosis-card urgent-card">
                      <h4>Urgent flags</h4>
                      <ul className="diagnosis-list">
                        {diagnosisResult.urgent_flags.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <div className="placeholder-state dark-placeholder">
              Analyze one microscope image first. Once the YOLO result is available, this assistant will use the actual
              spore type, count, coverage, and recommendation to generate a crop-aware diagnosis with prevention
              advice.
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
