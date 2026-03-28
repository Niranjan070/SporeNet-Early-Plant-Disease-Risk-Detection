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
    <article className="farmer-advice-card">
      <div className="farmer-advice-header">
        <span className="section-kicker">Farmer-friendly answer</span>
        <h4>{advice.headline || 'Farming guidance'}</h4>
      </div>

      <div className="farmer-advice-summary">
        <div className="farmer-advice-block primary">
          <span className="advice-label">Simple answer</span>
          <p>{advice.simple_answer || advice.farmer_message}</p>
        </div>
        <div className="farmer-advice-block">
          <span className="advice-label">Why this may happen</span>
          <p>{advice.why_it_happens || 'The assistant did not add extra cause details for this answer.'}</p>
        </div>
      </div>

      <div className="farmer-advice-grid">
        <article className="farmer-advice-panel">
          <h5>What to do now</h5>
          {renderList(advice.do_now, 'No immediate action list was provided.')}
        </article>

        <article className="farmer-advice-panel">
          <h5>How to prevent it</h5>
          {renderList(advice.prevent_next_time, 'No prevention list was provided.')}
        </article>
      </div>

      <div className="farmer-advice-grid">
        <article className="farmer-advice-panel">
          <h5>Warning signs to watch</h5>
          {renderList(advice.warning_signs, 'No warning signs were listed for this answer.')}
        </article>

        <article className="farmer-advice-panel">
          <h5>When to get expert help</h5>
          <p>{advice.when_to_get_help || 'Get expert help if symptoms spread quickly or the crop damage becomes unclear.'}</p>
        </article>
      </div>
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

      setFarmingMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.reply,
          advice: data.advice,
        },
      ]);
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

          <div className="helper-note">
            Better answers come when the question includes the crop, visible symptom, weather, and how long the problem
            has been happening.
          </div>

          <div className="conversation-panel">
            <div className="message-list">
              {farmingMessages.map((message, index) => (
                <div className="message-stack" key={`${message.role}-${index}`}>
                  <MessageBubble message={message} />
                  {message.role === 'assistant' && message.advice ? <FarmingAdviceCard advice={message.advice} /> : null}
                </div>
              ))}
              {farmingLoading ? (
                <article className="message-bubble assistant">
                  <span className="message-role">SporeNet AI</span>
                  <p className="message-text">Preparing a simple answer with action steps...</p>
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
                      <p className="message-text">Reviewing the image and turning the result into simple field advice...</p>
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

                  <div className="diagnosis-overview-grid">
                    <article className="diagnosis-card emphasis-card">
                      <h4>What was found</h4>
                      <p>{diagnosisResult.spore_explanation}</p>
                    </article>
                    <article className="diagnosis-card emphasis-card">
                      <h4>What the frequency means</h4>
                      <p>{diagnosisResult.frequency_interpretation}</p>
                    </article>
                    <article className="diagnosis-card overview-wide-card">
                      <h4>What this means for the crop</h4>
                      <p>{diagnosisResult.disease_outlook}</p>
                    </article>
                  </div>

                  <div className="diagnosis-action-stack">
                    <article className="diagnosis-card action-card">
                      <h4>Do now</h4>
                      {renderList(diagnosisResult.immediate_actions, 'No immediate steps were listed.')}
                    </article>

                    <article className="diagnosis-card action-card">
                      <h4>Next 7 days</h4>
                      {renderList(diagnosisResult.next_week_actions, 'No next-week steps were listed.')}
                    </article>

                    <article className="diagnosis-card action-card">
                      <h4>Keep watching in the field</h4>
                      {renderList(diagnosisResult.monitoring_plan, 'No monitoring plan was listed.')}
                    </article>

                    {(diagnosisResult.urgent_flags || []).length ? (
                      <article className="diagnosis-card urgent-card">
                        <h4>Get expert help if</h4>
                        {renderList(diagnosisResult.urgent_flags)}
                      </article>
                    ) : null}
                  </div>
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
