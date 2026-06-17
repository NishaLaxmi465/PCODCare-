export default function StatCard({ label, value, detail, tone = 'default', icon: Icon }) {
  return (
    <article className={`stat-card ${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {detail ? <small>{detail}</small> : null}
      </div>
      {Icon ? (
        <div className="stat-icon">
          <Icon size={20} />
        </div>
      ) : null}
    </article>
  );
}
