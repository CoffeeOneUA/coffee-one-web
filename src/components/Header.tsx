import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConversations } from '../hooks/useConversations';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useCity } from '../contexts/CityContext';
import { CityPickerModal } from './CityPickerModal';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
    isActive ? 'bg-coffee-blue-light text-coffee-blue' : 'text-coffee-muted hover:text-coffee-dark hover:bg-coffee-chip'
  }`;

export function Header() {
  const { isAuthenticated, signOut } = useAuth();
  const { unreadTotal } = useConversations();
  const { site_name, logo_url } = useSiteSettings();
  const { city } = useCity();
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-coffee-surface/95 backdrop-blur border-b border-coffee-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            {logo_url ? (
              <img src={logo_url} alt={site_name} className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <span className="w-9 h-9 rounded-xl bg-coffee-blue text-white flex items-center justify-center text-lg">☕</span>
            )}
            <span className="font-extrabold text-coffee-dark text-lg tracking-tight hidden xs:inline">{site_name}</span>
          </Link>
          <button
            onClick={() => setCityPickerOpen(true)}
            className="ml-1 px-3 py-1.5 rounded-full bg-coffee-chip text-coffee-dark text-xs font-bold hover:bg-coffee-line transition-colors"
          >
            📍 {city}
          </button>
        </div>

        <nav className="flex flex-wrap items-center justify-end gap-1.5">
          <NavLink to="/" end className={navLinkClass}>
            Маркетплейс
          </NavLink>
          {isAuthenticated && (
            <>
              <Link
                to="/add-listing"
                className="px-3 sm:px-4 py-2 rounded-lg text-sm font-bold text-white bg-coffee-blue hover:bg-coffee-blue-dark transition-colors"
              >
                +<span className="hidden sm:inline"> Додати оголошення</span>
              </Link>
              <NavLink to="/favorites" className={navLinkClass}>
                Обране
              </NavLink>
              <NavLink to="/chats" className={navLinkClass}>
                <span className="relative">
                  Чат
                  {unreadTotal > 0 && (
                    <span className="absolute -top-2 -right-3 min-w-[16px] h-4 px-1 rounded-full bg-coffee-red text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadTotal}
                    </span>
                  )}
                </span>
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                Профіль
              </NavLink>
              <button
                onClick={() => signOut()}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-coffee-muted hover:text-coffee-red hover:bg-coffee-red-light transition-colors"
              >
                Вийти
              </button>
            </>
          )}
          {!isAuthenticated && (
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-coffee-blue hover:bg-coffee-blue-dark transition-colors"
            >
              Увійти
            </Link>
          )}
        </nav>
      </div>

      {cityPickerOpen && <CityPickerModal onClose={() => setCityPickerOpen(false)} />}
    </header>
  );
}
