import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import SalePage from './pages/SalePage';
import ReceiptPage from './pages/ReceiptPage';
import type { Sale } from './types';

export default function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  if (!signedIn) return <LoginPage onSignIn={() => setSignedIn(true)} />;
  if (completedSale) return <ReceiptPage sale={completedSale} onNewSale={() => setCompletedSale(null)} />;
  return <SalePage onLogout={() => setSignedIn(false)} onComplete={setCompletedSale} />;
}
