import { useEffect, useState } from 'react';
import LoginPage from './pages/LoginPage';
import SalePage from './pages/SalePage';
import ReceiptPage from './pages/ReceiptPage';
import { clearToken, getMe, hasToken } from './api';
import type { Sale, User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(hasToken());
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Keep the session across page refreshes.
  useEffect(() => {
    if (!hasToken()) return;
    getMe().then(setUser).catch(clearToken).finally(() => setRestoring(false));
  }, []);

  // api.ts fires this when the server says the token is no longer valid.
  useEffect(() => {
    const onExpired = () => { setUser(null); setCompletedSale(null); };
    window.addEventListener('pos:unauthorized', onExpired);
    return () => window.removeEventListener('pos:unauthorized', onExpired);
  }, []);

  const signOut = () => { clearToken(); setUser(null); setCompletedSale(null); };

  if (restoring) return null;
  if (!user) return <LoginPage onSignIn={setUser} />;
  if (completedSale) return <ReceiptPage sale={completedSale} onNewSale={() => setCompletedSale(null)} />;
  return <SalePage onLogout={signOut} onComplete={setCompletedSale} />;
}