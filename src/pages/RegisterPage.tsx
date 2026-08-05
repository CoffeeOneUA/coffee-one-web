import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, fullName, phone);
      navigate('/');
    } catch (err: any) {
      setError(err.message ?? 'Не вдалося зареєструватись');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto py-10">
      <h1 className="text-2xl font-extrabold text-coffee-dark text-center mb-1">Реєстрація</h1>
      <p className="text-coffee-muted text-sm text-center mb-6">Один акаунт для мобільного застосунку й сайту</p>

      <form onSubmit={handleSubmit} className="bg-coffee-surface rounded-2xl p-6 flex flex-col gap-3">
        {error && <div className="text-coffee-red text-sm font-semibold bg-coffee-red-light rounded-lg px-3 py-2">{error}</div>}
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ім'я"
          className="border-2 border-coffee-line rounded-xl px-4 py-3 outline-none focus:border-coffee-blue"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон"
          className="border-2 border-coffee-line rounded-xl px-4 py-3 outline-none focus:border-coffee-blue"
        />
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
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль (мінімум 6 символів)"
          className="border-2 border-coffee-line rounded-xl px-4 py-3 outline-none focus:border-coffee-blue"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-coffee-blue text-white font-bold rounded-xl py-3 mt-1 hover:bg-coffee-blue-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Реєструємо…' : 'Зареєструватись'}
        </button>
      </form>

      <p className="text-center text-sm text-coffee-muted mt-4">
        Вже є акаунт? <Link to="/login" className="text-coffee-blue font-bold">Увійти</Link>
      </p>
    </div>
  );
}
