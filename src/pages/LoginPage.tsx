import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      const redirectTo = (location.state as any)?.from ?? '/';
      navigate(redirectTo);
    } catch (err: any) {
      setError(err.message ?? 'Не вдалося увійти');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto py-10">
      <h1 className="text-2xl font-extrabold text-coffee-dark text-center mb-1">Вхід</h1>
      <p className="text-coffee-muted text-sm text-center mb-6">Той самий акаунт, що й у мобільному застосунку</p>

      <form onSubmit={handleSubmit} className="bg-coffee-surface rounded-2xl p-6 flex flex-col gap-3">
        {error && <div className="text-coffee-red text-sm font-semibold bg-coffee-red-light rounded-lg px-3 py-2">{error}</div>}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border-2 border-coffee-line rounded-xl px-4 py-3 outline-none focus:border-coffee-blue"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="border-2 border-coffee-line rounded-xl px-4 py-3 outline-none focus:border-coffee-blue"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-coffee-blue text-white font-bold rounded-xl py-3 mt-1 hover:bg-coffee-blue-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Входимо…' : 'Увійти'}
        </button>
      </form>

      <p className="text-center text-sm text-coffee-muted mt-4">
        Немає акаунту? <Link to="/register" className="text-coffee-blue font-bold">Зареєструватись</Link>
      </p>
    </div>
  );
}
