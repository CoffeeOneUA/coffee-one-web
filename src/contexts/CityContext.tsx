import { createContext, useContext, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'coffeeone_selected_city';
const DEFAULT_CITY = 'Тернопіль';

interface CityContextValue {
  city: string;
  setCity: (city: string) => void;
}

const CityContext = createContext<CityContextValue | null>(null);

export function CityProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_CITY);

  function setCity(next: string) {
    setCityState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return <CityContext.Provider value={{ city, setCity }}>{children}</CityContext.Provider>;
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used within CityProvider');
  return ctx;
}
