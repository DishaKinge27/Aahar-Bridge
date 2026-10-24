import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';

afterEach(cleanup);

function renderAt(path: string) {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <MemoryRouter initialEntries={[path]}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      </LanguageProvider>
    </ThemeProvider>,
  );
}

describe('App routes', () => {
  it('renders the home hero (no blank page)', () => {
    renderAt('/');
    expect(
      screen.getByRole('heading', { level: 1, name: /Bridging the Gap/i }),
    ).toBeTruthy();
    expect(screen.getAllByText(/Aahar Bridge/i).length).toBeGreaterThan(0);
  });

  it('renders the login page (setup notice while env is stubbed)', () => {
    renderAt('/login');
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeTruthy();
    expect(screen.getByText(/Connect Supabase to go live/)).toBeTruthy();
  });

  it('renders the register page', () => {
    renderAt('/register');
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeTruthy();
    expect(screen.getByText(/Connect Supabase to go live/)).toBeTruthy();
  });

  it('renders the browse page heading', () => {
    renderAt('/browse');
    expect(screen.getByRole('heading', { name: 'Available Surplus Food' })).toBeTruthy();
  });

  it('shows a 404 page for unknown routes', () => {
    renderAt('/definitely-not-a-page');
    expect(screen.getByText('Page not found')).toBeTruthy();
  });

  it('redirects protected routes to login when signed out', () => {
    renderAt('/dashboard');
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeTruthy();
  });
});
