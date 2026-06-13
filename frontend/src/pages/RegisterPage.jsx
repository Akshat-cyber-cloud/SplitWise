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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-800 tracking-tight mb-2">Create account</h1>
          <p className="text-slate-500">Start tracking shared expenses</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {['name', 'email', 'password'].map((field) => (
            <div className="flex flex-col gap-1.5" key={field}>
              <label className="text-sm font-medium text-slate-600">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                id={field} 
                name={field} 
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                value={form[field]} 
                onChange={handleChange} 
                required
                className="form-input"
              />
            </div>
          ))}
          <button 
            id="register-btn" 
            type="submit" 
            className="btn btn-primary mt-2 w-full text-base py-3" 
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-slate-500">
          Have an account? <Link to="/login" className="font-medium text-teal-700 hover:text-teal-800 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
