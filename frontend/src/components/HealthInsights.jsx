import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';

function categoryIcon(category) {
  if (category === 'High') return ShieldAlert;
  if (category === 'Moderate') return AlertTriangle;
  return CheckCircle2;
}

export default function HealthInsights({ insights }) {
  if (!insights) {
    return <div className="card muted-card">Log weight, symptoms, and steps to unlock health insights.</div>;
  }

  const Icon = categoryIcon(insights.category);
  const ringStyle = {
    background: `conic-gradient(var(--accent) ${insights.score * 3.6}deg, var(--border) 0deg)`,
  };

  return (
    <section className="card insights-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Health insights</p>
          <h2>Risk score</h2>
        </div>
        <span className={`status-pill ${insights.category.toLowerCase()}`}>
          <Icon size={16} />
          {insights.category}
        </span>
      </div>

      <div className="insight-grid">
        <div className="score-ring" style={ringStyle}>
          <div>
            <strong>{insights.score}</strong>
            <span>/100</span>
          </div>
        </div>

        <div className="insight-details">
          <div className="mini-metrics">
            <span>BMI <strong>{insights.bmi || 'n/a'}</strong></span>
            <span>Cycle <strong>{insights.cycleAnalysis?.status || 'n/a'}</strong></span>
            <span>Steps <strong>{insights.averages?.steps || 'n/a'}</strong></span>
          </div>
          <p>{insights.cycleAnalysis?.message}</p>
        </div>
      </div>

      <div className="contributor-list">
        {insights.contributors?.map((item) => (
          <div className="contributor" key={item.label}>
            <Info size={15} />
            <span>{item.label}</span>
            <strong>{item.points} pts</strong>
            <small>{item.detail}</small>
          </div>
        ))}
      </div>

      <div className="recommendations">
        {insights.recommendations?.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </section>
  );
}
