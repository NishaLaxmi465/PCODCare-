import { Bot, ChefHat, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api, apiErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function FoodList({ title, items, mode }) {
  if (!items?.length) return null;

  return (
    <div className="food-list">
      <h3>{title}</h3>
      {items.map((item, index) => (
        <article key={`${title}-${index}`} className="food-item">
          <strong>{item.food || item.name || item}</strong>
          {item.examples ? <span>{Array.isArray(item.examples) ? item.examples.join(', ') : item.examples}</span> : null}
          <p>{item.benefits || item.reason || item.description || (mode === 'avoid' ? 'Limit when possible.' : '')}</p>
        </article>
      ))}
    </div>
  );
}

function SampleDay({ sampleDay }) {
  if (!sampleDay) return null;

  return (
    <div className="sample-day">
      <h3>Sample day</h3>
      {Object.entries(sampleDay).map(([meal, value]) => (
        <p key={meal}>
          <strong>{meal}</strong>
          <span>{value}</span>
        </p>
      ))}
    </div>
  );
}

export default function AiCarePanel({ suggestions = [] }) {
  const { user } = useAuth();
  const [dietForm, setDietForm] = useState({
    goal: 'Improve insulin sensitivity and energy',
    dietaryPreference: user?.profile?.dietaryPreference || 'balanced',
    allergies: (user?.profile?.allergies || []).join(', '),
  });
  const [dietPlan, setDietPlan] = useState(null);
  const [dietStatus, setDietStatus] = useState('');
  const [message, setMessage] = useState('');
  const [historyId, setHistoryId] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const updateDiet = (key, value) => setDietForm((current) => ({ ...current, [key]: value }));

  const generateDiet = async (event) => {
    event.preventDefault();
    setDietStatus('Generating plan...');
    try {
      const payload = {
        ...dietForm,
        allergies: dietForm.allergies
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      };
      const { data } = await api.post('/ai/diet-plan', payload);
      setDietPlan(data);
      setDietStatus(data.source === 'fallback' ? 'Plan generated from built-in guidance' : 'Plan generated');
    } catch (error) {
      setDietStatus(apiErrorMessage(error, 'Could not generate diet plan'));
    }
  };

  const sendMessage = async (question = message) => {
    const clean = question.trim();
    if (!clean) return;

    setChatStatus('Thinking...');
    setMessage('');
    setChatMessages((current) => [...current, { role: 'user', content: clean }]);
    try {
      const { data } = await api.post('/ai/chat', { message: clean, historyId: historyId || undefined });
      setHistoryId(data.historyId);
      setChatMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.answer || data.text || 'I saved your question, but no answer was returned.',
          followUps: data.followUps || [],
        },
      ]);
      setChatStatus(data.source === 'fallback' ? 'Answered with built-in guidance' : 'Answered');
    } catch (error) {
      setChatStatus(apiErrorMessage(error, 'Could not send message'));
    }
  };

  return (
    <div>
      <div className="section-heading page-heading">
        <div>
          <p className="eyebrow">AI care</p>
          <h2>Diet plan and chatbot</h2>
        </div>
      </div>

      <div className="two-column">
        <section className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Nutrition</p>
              <h2>AI diet plan</h2>
            </div>
            <ChefHat size={20} />
          </div>
          <form className="compact-form" onSubmit={generateDiet}>
            <label className="full-span">
              Goal
              <input value={dietForm.goal} onChange={(event) => updateDiet('goal', event.target.value)} />
            </label>
            <label>
              Preference
              <select value={dietForm.dietaryPreference} onChange={(event) => updateDiet('dietaryPreference', event.target.value)}>
                <option value="balanced">Balanced</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="non-vegetarian">Non-vegetarian</option>
              </select>
            </label>
            <label>
              Allergies
              <input value={dietForm.allergies} onChange={(event) => updateDiet('allergies', event.target.value)} />
            </label>
            <button className="primary-button full-span" type="submit">
              <Sparkles size={16} />
              Generate diet plan
            </button>
            {dietStatus ? <span className="form-status full-span">{dietStatus}</span> : null}
          </form>

          {dietPlan ? (
            <div className="diet-plan">
              <p>{dietPlan.summary || dietPlan.text}</p>
              <FoodList title="What to eat" items={dietPlan.eat} />
              <FoodList title="What to avoid" items={dietPlan.avoid} mode="avoid" />
              <SampleDay sampleDay={dietPlan.sampleDay} />
              {dietPlan.cautions?.length ? (
                <div className="notice-list">
                  {dietPlan.cautions.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="card chat-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Assistant</p>
              <h2>PCOS chatbot</h2>
            </div>
            <Bot size={20} />
          </div>

          <div className="quick-questions">
            {(suggestions || []).map((item) => (
              <button key={item} type="button" onClick={() => sendMessage(item)}>
                {item}
              </button>
            ))}
          </div>

          <div className="chat-window">
            {chatMessages.length ? (
              chatMessages.map((item, index) => (
                <div className={`chat-bubble ${item.role}`} key={`${item.role}-${index}`}>
                  <p>{item.content}</p>
                  {item.followUps?.length ? (
                    <div className="follow-ups">
                      {item.followUps.map((followUp) => (
                        <button key={followUp} type="button" onClick={() => sendMessage(followUp)}>
                          {followUp}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="empty-chat">Ask about trends, nutrition, reminders, or appointment prep.</div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form
            className="chat-input"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask PCODCare..." />
            <button className="icon-button accent" type="submit" title="Send">
              <Send size={18} />
            </button>
          </form>
          {chatStatus ? <span className="form-status">{chatStatus}</span> : null}
        </section>
      </div>
    </div>
  );
}
