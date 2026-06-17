import { Activity, Droplets, Footprints, HeartPulse, Scale } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, apiErrorMessage } from '../api/client.js';
import AiCarePanel from '../components/AiCarePanel.jsx';
import AnalyticsCharts from '../components/AnalyticsCharts.jsx';
import HealthInsights from '../components/HealthInsights.jsx';
import Layout from '../components/Layout.jsx';
import ProfilePanel from '../components/ProfilePanel.jsx';
import RemindersPanel from '../components/RemindersPanel.jsx';
import ReportsPanel from '../components/ReportsPanel.jsx';
import StatCard from '../components/StatCard.jsx';
import TrackerPanel from '../components/TrackerPanel.jsx';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'trackers', label: 'Trackers' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'ai', label: 'AI Care' },
  { id: 'reports', label: 'Reports' },
  { id: 'reminders', label: 'Reminders' },
];

function Overview({ dashboard, onChanged }) {
  const insights = dashboard?.insights;
  const latest = dashboard?.latest || {};
  const notifications = dashboard?.notifications || [];

  return (
    <div className="overview-stack">
      <div className="stat-grid">
        <StatCard
          label="Risk score"
          value={insights ? `${insights.score}/100` : 'n/a'}
          detail={insights?.category || 'Add logs for score'}
          tone={insights?.category?.toLowerCase() || 'default'}
          icon={HeartPulse}
        />
        <StatCard
          label="BMI"
          value={insights?.bmi || 'n/a'}
          detail={latest.weight ? `${latest.weight.weightKg} kg latest` : 'Log weight'}
          icon={Scale}
        />
        <StatCard
          label="Average steps"
          value={insights?.averages?.steps || 'n/a'}
          detail="30-day average"
          icon={Footprints}
        />
        <StatCard
          label="Water"
          value={latest.water ? `${latest.water.volumeMl} ml` : 'n/a'}
          detail="Latest entry"
          icon={Droplets}
        />
        <StatCard
          label="Exercise"
          value={latest.exercise ? `${latest.exercise.minutes} min` : 'n/a'}
          detail={latest.exercise?.activity || 'Latest activity'}
          icon={Activity}
        />
      </div>

      <div className="overview-grid">
        <HealthInsights insights={insights} />
        <section className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Next up</p>
              <h2>Notifications</h2>
            </div>
          </div>
          <div className="compact-list">
            {notifications.length ? (
              notifications.slice(0, 5).map((item) => (
                <article key={item._id}>
                  <strong>{item.title}</strong>
                  <span>{item.type} - {item.reminderAt ? new Date(item.reminderAt).toLocaleString() : 'No reminder time'}</span>
                </article>
              ))
            ) : (
              <p className="muted-text">No reminders yet.</p>
            )}
          </div>
        </section>
      </div>

      <ProfilePanel onChanged={onChanged} />
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardRes, analyticsRes, reportsRes, suggestionsRes] = await Promise.all([
        api.get('/insights/dashboard'),
        api.get('/insights/analytics?days=90'),
        api.get('/reports'),
        api.get('/ai/suggestions'),
      ]);
      setDashboard(dashboardRes.data);
      setAnalytics(analyticsRes.data);
      setReports(reportsRes.data);
      setSuggestions(suggestionsRes.data);
    } catch (loadError) {
      setError(apiErrorMessage(loadError, 'Could not load dashboard data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const panel = useMemo(() => {
    if (loading) {
      return <div className="card muted-card">Loading your PCODCare dashboard...</div>;
    }

    if (error) {
      return (
        <div className="card error-panel">
          <strong>Dashboard unavailable</strong>
          <p>{error}</p>
          <button className="secondary-button" type="button" onClick={loadData}>Retry</button>
        </div>
      );
    }

    if (activeTab === 'trackers') {
      return <TrackerPanel latest={dashboard?.latest} onChanged={loadData} />;
    }

    if (activeTab === 'analytics') {
      return <AnalyticsCharts analytics={analytics} />;
    }

    if (activeTab === 'ai') {
      return <AiCarePanel suggestions={suggestions} />;
    }

    if (activeTab === 'reports') {
      return <ReportsPanel reports={reports} onChanged={loadData} />;
    }

    if (activeTab === 'reminders') {
      return (
        <RemindersPanel
          notifications={dashboard?.notifications}
          appointments={dashboard?.appointments}
          onChanged={loadData}
        />
      );
    }

    return <Overview dashboard={dashboard} onChanged={loadData} />;
  }, [activeTab, analytics, dashboard, error, loadData, loading, reports, suggestions]);

  return (
    <Layout activeTab={activeTab} tabs={tabs} onTabChange={setActiveTab}>
      {panel}
    </Layout>
  );
}
