import { Check } from 'lucide-react';
import type { Sale } from '../types';
import { money } from '../data/products';

interface ReceiptPageProps { sale: Sale; onNewSale: () => void }

export default function ReceiptPage({ sale, onNewSale }: ReceiptPageProps) {
  const payment = sale.payments[0];
  return <div className="complete-page"><div className="complete-wrap"><section className="receipt-paper">
    <div className="receipt-brand">KARIBU MART</div><div className="receipt-meta">Nairobi, Kenya · 0712 345 678<br/>RECEIPT {sale.receiptNo}<br/>{new Date(sale.createdAt).toLocaleString('en-KE')}<br/>Cashier: Alex Kimani</div>
    <div className="receipt-rule"/>{sale.items.map(item => <div className="receipt-line" key={item.id}><span>{item.quantity} × {item.name}</span><span>{item.lineTotal.toLocaleString('en-KE')}</span></div>)}<div className="receipt-rule"/>
    {sale.discount > 0 && <div className="receipt-line"><span>Discount</span><span>-{sale.discount}</span></div>}<div className="receipt-line"><b>TOTAL</b><b>{money(sale.total)}</b></div><div className="receipt-line"><span>{payment.method.toUpperCase()}</span><span>{sale.amountTendered}</span></div>{sale.change ? <div className="receipt-line"><span>Change</span><span>{sale.change}</span></div> : null}<div className="receipt-rule"/><div className="receipt-thanks">Thank you for shopping with us!</div>
  </section><section className="complete-actions"><div className="success-icon"><Check size={25}/></div><span className="eyebrow">PAYMENT SUCCESSFUL</span><h1>Sale complete</h1><p className="muted">{sale.receiptNo} · {new Date(sale.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</p><div className="complete-total">{money(sale.total)}</div>
    <button className="secondary action-btn" onClick={() => window.print()}>Print receipt <span>⌘ P</span></button><button className="secondary action-btn" onClick={() => { navigator.clipboard?.writeText(`${location.origin}/receipt/${sale.receiptNo}`); }}>Share receipt link <span>↗</span></button><button className="primary new-sale-btn" onClick={onNewSale}>Start new sale <span>→</span></button>
  </section></div></div>;
}
