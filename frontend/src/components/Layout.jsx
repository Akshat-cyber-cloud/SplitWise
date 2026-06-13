import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navCls = ({ isActive }) =>
    `sidebar-link${isActive ? ' active' : ''}`;

  return (
    <div className="page-wrapper">
      <aside className="sidebar">
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: 'var(--color-primary)', letterSpacing: '-0.5px' }}>SharedSplit</h2>
          <p className="text-muted" style={{ marginTop: 4 }}>{user?.name}</p>
        </div>
        <NavLink to="/groups" className={navCls}>📂 Groups</NavLink>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
      <style>{`
        .sidebar-link {
          display: block; padding: 10px 12px; border-radius: 8px;
          color: var(--color-muted); font-size: 0.9rem; font-weight: 500;
          transition: all 0.15s;
        }
        .sidebar-link:hover { background: var(--color-surface2); color: var(--color-text); }
        .sidebar-link.active { background: rgba(108,99,255,.15); color: var(--color-primary); }
      `}</style>
    </div>
  );
}
