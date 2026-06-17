import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function day(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
}

function normalize(rows = []) {
  return rows.map((item) => ({ ...item, day: day(item.date) }));
}

function ChartCard({ title, children }) {
  return (
    <section className="card chart-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Trend</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="chart-box">{children}</div>
    </section>
  );
}

function EmptyChart() {
  return <div className="empty-chart">Add tracker logs to populate this chart.</div>;
}

export default function AnalyticsCharts({ analytics }) {
  const steps = normalize(analytics?.steps);
  const weight = normalize(analytics?.weight);
  const water = normalize(analytics?.water);
  const exercise = normalize(analytics?.exercise);
  const symptoms = normalize(analytics?.symptoms);

  return (
    <div>
      <div className="section-heading page-heading">
        <div>
          <p className="eyebrow">Analytics dashboard</p>
          <h2>Steps, weight, water, symptoms, calories, and BMI</h2>
        </div>
      </div>

      <div className="chart-grid">
        <ChartCard title="Steps and Calories">
          {steps.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={steps}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="steps" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="calories" fill="var(--orange)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Weight and BMI">
          {weight.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weight}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="weightKg" stroke="var(--accent)" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="bmi" stroke="var(--green)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Water Intake">
          {water.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={water}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="volumeMl" stroke="var(--blue)" fill="var(--blue-soft)" strokeWidth={3} />
                <Line type="monotone" dataKey="targetMl" stroke="var(--text-muted)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Symptoms">
          {symptoms.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={symptoms}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="cramps" stroke="var(--orange)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="acne" stroke="var(--pink)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="hairFall" stroke="var(--accent)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="fatigue" stroke="var(--green)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Exercise Calories">
          {exercise.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={exercise}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="minutes" fill="var(--green)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="calories" fill="var(--orange)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
