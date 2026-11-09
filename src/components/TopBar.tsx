import { Clock3, LogOut, ReceiptText, Settings2 } from 'lucide-react';

interface TopBarProps { heldCount: number; onHeldSales: () => void; onSalesHistory: () => void; onAdmin: () => void; onLogout: () => void }

export default function TopBar({ heldCount, onHeldSales, onSalesHistory, onAdmin, onLogout }: TopBarProps) {
  return <header className="topbar"><div className="top-brand"><div className="brandmark small">K</div><strong>Karibu Mart</strong></div><div className="shift-status"><span className="status-dot"/> Shift open <span className="status-divider">·</span> <span>{new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div><div className="top-actions"><button className="held-btn admin-nav-btn" onClick={onAdmin}><Settings2 size={15}/> Admin</button><button className="held-btn history-nav-btn" onClick={onSalesHistory}><ReceiptText size={15}/> Sales history</button><button className="held-btn" onClick={onHeldSales}><Clock3 size={15}/> Held sales <b>{heldCount}</b></button><div className="user-chip"><div className="avatar">AK</div><div><strong>Alex Kimani</strong><small>Cashier</small></div><button className="icon-button" aria-label="Log out" onClick={onLogout}><LogOut size={16}/></button></div></div></header>;
}
