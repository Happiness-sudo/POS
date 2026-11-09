import { ArrowLeft, LogOut } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Sale } from '../types';

interface Props { sales: Sale[]; onBack: () => void; onLogout: () => void }

export function createSampleSales(): Sale[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const makeSale = (id: number, receiptNo: string, date: Date, time: string, items: { name: string; price: number; quantity: number }[], method: Sale['payments'][number]['method'], status: Sale['status'] = 'completed'): Sale => {
    const [hours, minutes] = time.split(':').map(Number); const created = new Date(date); created.setHours(hours, minutes, 0, 0);
    const lines = items.map((item, index) => ({ id: index + 1, saleId: id, productId: index + 1, name: item.name, unitPrice: item.price, quantity: item.quantity, lineTotal: item.price * item.quantity }));
    const total = lines.reduce((sum, item) => sum + item.lineTotal, 0);
    return { id, shopId: 1, receiptNo, cashierId: 1, items: lines, payments: [{ id: 1, saleId: id, method, amount: total }], subtotal: total, discount: 0, total, amountTendered: total, change: 0, status, createdAt: created.toISOString() };
  };
  return [
    makeSale(-63, '#0063', today, '12:10', [{ name: 'Maize flour', price: 180, quantity: 2 }, { name: 'Milk', price: 90, quantity: 1 }], 'cash'),
    makeSale(-62, '#0062', today, '12:04', [{ name: 'Bread', price: 150, quantity: 1 }], 'mpesa'),
    makeSale(-61, '#0061', today, '11:58', [{ name: 'Sugar', price: 60, quantity: 2 }], 'cash', 'voided'),
    makeSale(-60, '#0060', yesterday, '17:35', [{ name: 'Cooking oil', price: 320, quantity: 1 }], 'cash'),
  ];
}

const paymentLabel: Record<Sale['payments'][number]['method'], string> = { cash: 'Cash', mpesa: 'M-Pesa', card: 'Card', credit: 'Credit' };
const money = (amount: number) => amount.toLocaleString('en-KE');

export default function SalesHistoryPage({ sales, onBack, onLogout }: Props) {
  const [day, setDay] = useState<'today' | 'yesterday'>('today');
  const [query, setQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const visibleSales = useMemo(() => {
    const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (day === 'yesterday') start.setDate(start.getDate() - 1);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    return sales.filter(sale => { const created = new Date(sale.createdAt); return created >= start && created < end && sale.receiptNo.toLowerCase().includes(query.trim().toLowerCase()); }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [sales, day, query]);
  return <div className="held-page history-page">
    <header className="held-page-header"><strong className="held-shop">[SHOP NAME]</strong><span className="held-cashier">Cashier: [NAME] · Shift open</span><div className="held-header-actions"><button className="held-outline" onClick={selectedSale ? () => setSelectedSale(null) : onBack}><ArrowLeft size={15}/>{selectedSale ? 'Back to history' : 'Back to sale'}</button><button className="held-outline" onClick={onLogout}><LogOut size={15}/>Log out</button></div></header>
    <main className="history-content">{selectedSale ? <section className="history-detail"><h1>Sale detail</h1><p className="history-detail-subtitle">Receipt {selectedSale.receiptNo} · {new Date(selectedSale.createdAt).toLocaleString('en-KE')}</p><div className="history-table-wrap"><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>{selectedSale.items.map(item => <tr key={item.id}><td>{item.name}</td><td>{item.quantity}</td><td>{money(item.unitPrice)}</td><td>{money(item.lineTotal)}</td></tr>)}</tbody><tfoot><tr><td colSpan={3}>Total</td><td>{money(selectedSale.total)}</td></tr></tfoot></table><div className="history-payment"><span>Payment</span><strong>{selectedSale.payments.map(payment => paymentLabel[payment.method]).join(', ')}</strong></div></div></section> : <><h1>Sales history</h1><div className="history-filters"><div className="history-day-tabs"><button className={day === 'today' ? 'active' : ''} onClick={() => setDay('today')}>Today</button><button className={day === 'yesterday' ? 'active' : ''} onClick={() => setDay('yesterday')}>Yesterday</button></div><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search receipt number" aria-label="Search receipt number" /></div><div className="history-table-wrap"><table className="history-table"><thead><tr><th>Receipt</th><th>Time</th><th>Items</th><th>Total</th><th>Method</th><th>Status</th><th>Action</th></tr></thead><tbody>{visibleSales.map(sale => <tr key={sale.id}><td>{sale.receiptNo}</td><td>{new Date(sale.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false })}</td><td>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td>{money(sale.total)}</td><td>{sale.payments.map(payment => paymentLabel[payment.method]).join(', ')}</td><td className={sale.status === 'voided' ? 'history-voided' : ''}>{sale.status === 'completed' ? 'Completed' : sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}</td><td><button className="history-view" onClick={() => setSelectedSale(sale)}>View</button></td></tr>)}</tbody></table>{visibleSales.length === 0 && <div className="history-no-results">No sales found for this date.</div>}</div><p className="history-note">Sale detail shows items and payments. Void and refund are shown only to managers and owners.</p></>}</main>
  </div>;
}
