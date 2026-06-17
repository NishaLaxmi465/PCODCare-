import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  FileText,
  HeartPulse,
  LogOut,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const iconMap = {
  overview: HeartPulse,
  trackers: Activity,
  analytics: BarChart3,
  ai: Bot,
  reports: FileText,
  reminders: Bell,
};

export default function Layout({ activeTab, tabs, onTabChange, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">PC</div>
          <div>
            <strong>PCODCare</strong>
            <span>Health tracker</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Dashboard sections">
          {tabs.map((tab) => {
            const Icon = iconMap[tab.id] || Activity;
            return (
              <button
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                type="button"
                title={tab.label}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1>{user?.name || 'PCODCare'}</h1>
          </div>
          <div className="topbar-actions">
            <div className="user-chip">
              <UserRound size={18} />
              <span>{user?.email}</span>
            </div>
            <button className="icon-button" type="button" onClick={logout} title="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
