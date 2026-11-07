import { useState } from 'react';
import { X } from 'lucide-react';

interface DiscountModalProps { subtotal: number; currentDiscount: number; onClose: () => void; onApply: (amount: number) => void }

export default function DiscountModal({ subtotal, currentDiscount, onClose, onApply }: DiscountModalProps) {
  const [amount, setAmount] = useState(String(currentDiscount));
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="discount-modal"><div className="modal-head"><div><span className="eyebrow">PRICE ADJUSTMENT</span><h2>Add discount</h2></div><button className="close-button" onClick={onClose} aria-label="Close"><X size={18}/></button></div><p className="muted">Apply a discount to this sale.</p><label className="field-label" htmlFor="discount">Discount amount</label><div className="amount-input"><span>KES</span><input id="discount" value={amount} onChange={event => setAmount(event.target.value)} type="number" min="0" max={subtotal}/></div><div className="discount-quick">{[50, 100, 200].filter(value => value < subtotal || value === 50).map(value => <button key={value} onClick={() => setAmount(String(value))}>−{value}</button>)}</div><button className="primary confirm-button" onClick={() => onApply(Math.min(subtotal, Math.max(0, Number(amount) || 0)))}>Apply discount <span>→</span></button></section></div>;
}
