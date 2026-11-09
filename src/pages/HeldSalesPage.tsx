import { ArrowLeft, LogOut } from 'lucide-react';
import type { CartItem } from '../types';

export interface HeldSale { id: number; label: string; heldAt: string; items: CartItem[]; discount: number; total: number }

interface Props { sales: HeldSale[]; onBack: () => void; onLogout: () => void; onResume: (sale: HeldSale) => void; onDelete: (id: number) => void }

export default function HeldSalesPage({ sales, onBack, onLogout, onResume, onDelete }: Props) {
  return <div className="held-page">
    <header className="held-page-header"><strong className="held-shop">[SHOP NAME]</strong><span className="held-cashier">Cashier: [NAME] · Shift open</span><div className="held-header-actions"><button className="held-outline" onClick={onBack}><ArrowLeft size={15}/>Back to sale</button><button className="held-outline" onClick={onLogout}><LogOut size={15}/>Log out</button></div></header>
    <main className="held-content"><h1>Held sales ({sales.length})</h1><p>Held sales do not change stock until they are completed. They clear at end of day.</p>
      {sales.length ? <div className="held-list">{sales.map(sale => <article className="held-sale-card" key={sale.id}><div className="held-sale-meta"><strong>{sale.label || '[LABEL]'}</strong><span>Held {sale.heldAt} · {sale.items.reduce((n, item) => n + item.quantity, 0)} items</span></div><strong className="held-total">KES {sale.total.toLocaleString('en-KE')}</strong><div className="held-card-actions"><button className="held-resume" onClick={() => onResume(sale)}>Resume</button><button className="held-outline" onClick={() => onDelete(sale.id)}>Delete</button></div></article>)}</div> : <div className="held-empty">No held sales</div>}
    </main>
  </div>;
}
