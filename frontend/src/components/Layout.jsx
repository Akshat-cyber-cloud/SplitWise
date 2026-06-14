import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserTour from './UserTour';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navCls = ({ isActive }) =>
    `block px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive 
        ? 'bg-teal-50 text-teal-800' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-2 shrink-0">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-teal-800 tracking-tight">SharedSplit</h2>
          <Link to="/profile" className="mt-4 flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center font-bold border border-teal-100 group-hover:bg-teal-100 transition-colors">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-slate-900 truncate group-hover:text-teal-800 transition-colors">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </Link>
        </div>
        
        <nav className="flex flex-col gap-1">
          <NavLink to="/groups" className={navCls}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Groups
            </div>
          </NavLink>
          
          <NavLink to="/profile" className={navCls}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </div>
          </NavLink>

          <button 
            onClick={() => {
              if (user?.id) {
                localStorage.removeItem(`sharedsplit_tour_completed_${user.id}`);
              }
              localStorage.removeItem('sharedsplit_tour_completed');
              window.location.reload();
            }}
            className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all duration-150"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Restart Tour
            </div>
          </button>
        </nav>
        
        <div className="flex-1" />
        
        <button 
          className="btn btn-ghost w-full justify-start text-sm text-slate-500 hover:text-slate-900"
          onClick={handleLogout}
        >
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
      <UserTour />
    </div>
  );
}
