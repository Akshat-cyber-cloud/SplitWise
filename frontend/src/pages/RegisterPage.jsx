import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function RegisterPage() {
  const [form, setForm]   = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      navigate('/groups');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
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
            COIЗON
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Create account</h1>
          <p className="text-slate-500 text-sm">Start tracking shared expenses</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-700 text-sm font-semibold border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {['name', 'email', 'password'].map((field) => (
            <div className="flex flex-col gap-1.5" key={field}>
              <label className="text-sm font-bold text-slate-700">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                id={field} 
                name={field} 
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                value={form[field]} 
                onChange={handleChange} 
                required
                className="w-full rounded-xl border-2 border-slate-900 bg-white px-4 py-2.5 text-slate-900 font-medium transition-colors focus:border-teal-800 focus:outline-none focus:ring-0"
              />
            </div>
          ))}
          <button 
            id="register-btn" 
            type="submit" 
            className="w-full mt-2 py-3.5 rounded-xl border-2 border-slate-900 bg-teal-800 hover:bg-teal-700 text-white font-extrabold text-base shadow-[4px_4px_0px_#0f172a] hover:shadow-[1px_1px_0px_#0f172a] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:pointer-events-none" 
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          Have an account? <Link to="/login" className="font-extrabold text-teal-800 hover:text-teal-950 transition-colors underline decoration-2 underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
