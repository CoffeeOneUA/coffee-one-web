import type { ReactNode } from 'react';
import { Header } from './Header';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-coffee-bg">
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      <footer className="text-center text-xs text-coffee-muted py-8">Coffee One · coffeeone.com.ua</footer>
    </div>
  );
}
