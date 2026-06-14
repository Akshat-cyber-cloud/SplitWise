import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserTour from './UserTour';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navCls = ({ isActive }) =>
    `block px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-150 ${
      isActive 
        ? 'bg-teal-100 text-slate-900 border-slate-900 shadow-[3px_3px_0px_#0f172a]' 
        : 'text-slate-500 border-transparent hover:bg-slate-100 hover:border-slate-200 hover:text-slate-900'
    }`;

  return (
    <div className="relative flex min-h-screen bg-slate-50 overflow-x-hidden font-sans">
      {/* Mesh Gradient Background Blobs matching Landing Page */}
      <div className="absolute inset-0 overflow-hidden -z-10 select-none pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-amber-200/20 blur-[100px] md:blur-[140px]" />
        <div className="absolute top-[20%] right-[-10%] w-[55%] h-[55%] rounded-full bg-blue-100/20 blur-[130px] md:blur-[170px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[45%] h-[45%] rounded-full bg-pink-100/20 blur-[100px] md:blur-[140px]" />
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r-2 border-slate-900 p-6 flex flex-col gap-2 shrink-0 z-20 shadow-[4px_0_0_0_rgba(15,23,42,0.02)]">
        <div className="mb-8">
          <Link to="/" className="text-2xl font-black text-slate-900 tracking-wider font-mono hover:opacity-85 transition-opacity block mb-6">
            CLAR<span className="text-teal-700">i</span><span className="text-slate-400">°</span>
          </Link>
          
          <Link to="/profile" className="mt-4 flex items-center gap-3 p-3 rounded-xl border-2 border-slate-900 bg-white shadow-[3px_3px_0px_#0f172a] hover:bg-slate-50 transition-all group">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-slate-900 flex items-center justify-center font-black border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a] group-hover:bg-teal-200 transition-colors">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-black text-slate-900 truncate group-hover:text-teal-800 transition-colors">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </Link>
        </div>
        
        <nav className="flex flex-col gap-2">
          <NavLink to="/groups" className={navCls}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Groups
            </div>
          </NavLink>
          
          <NavLink to="/profile" className={navCls}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
            className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 border-2 border-transparent hover:border-slate-900 hover:bg-slate-100 hover:text-slate-900 transition-all duration-150"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Restart Tour
            </div>
          </button>
        </nav>
        
        <div className="flex-1" />
        
        <button 
          className="w-full flex items-center justify-start gap-2 px-4 py-3 rounded-xl text-sm font-extrabold text-slate-600 border-2 border-transparent hover:border-slate-900 hover:text-slate-900 transition-all duration-150"
          onClick={handleLogout}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto max-w-5xl mx-auto w-full z-10">
        <Outlet />
      </main>
      <UserTour />
    </div>
  );
}
