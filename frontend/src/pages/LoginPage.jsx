import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/groups');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans overflow-hidden">
      {/* Mesh Gradient Background Blobs matching Landing Page */}
      <div className="absolute inset-0 overflow-hidden -z-10 select-none pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-amber-200/40 blur-[100px] md:blur-[140px]" />
        <div className="absolute top-[20%] right-[-10%] w-[55%] h-[55%] rounded-full bg-blue-100/40 blur-[130px] md:blur-[170px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[45%] h-[45%] rounded-full bg-pink-100/30 blur-[100px] md:blur-[140px]" />
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl border-2 border-slate-900 p-8 sm:p-10 shadow-[6px_6px_0px_#0f172a] relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block text-2xl font-black text-slate-900 tracking-wider font-mono mb-3 hover:opacity-85 transition-opacity">
            CLAR<span className="text-teal-700">i</span><span className="text-slate-400">°</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Sign in</h1>
          <p className="text-slate-500 text-sm">Welcome back to Clario</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-700 text-sm font-semibold border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">Email</label>
            <input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full rounded-xl border-2 border-slate-900 bg-white px-4 py-2.5 text-slate-900 font-medium transition-colors focus:border-teal-800 focus:outline-none focus:ring-0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">Password</label>
            <input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full rounded-xl border-2 border-slate-900 bg-white px-4 py-2.5 text-slate-900 font-medium transition-colors focus:border-teal-800 focus:outline-none focus:ring-0"
            />
          </div>
          <button 
            id="login-btn" 
            type="submit" 
            className="w-full mt-2 py-3.5 rounded-xl border-2 border-slate-900 bg-teal-800 hover:bg-teal-700 text-white font-extrabold text-base shadow-[4px_4px_0px_#0f172a] hover:shadow-[1px_1px_0px_#0f172a] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:pointer-events-none" 
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          Don't have an account? <Link to="/register" className="font-extrabold text-teal-800 hover:text-teal-950 transition-colors underline decoration-2 underline-offset-2">Register</Link>
        </p>
      </div>
    </div>
  );
}
