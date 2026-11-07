import { Clock3, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import type { CartItem } from '../types';
import { money } from '../data/products';

interface CartPanelProps {
  cart: CartItem[]; selected: number | null; subtotal: number; discount: number; total: number;
  onSelect: (id: number) => void; onQuantity: (id: number, delta: number) => void;
  onRemove: (id: number) => void; onDiscount: () => void; onHold: () => void;
  onClear: () => void; onPay: () => void;
}

export default function CartPanel({ cart, selected, subtotal, discount, total, onSelect, onQuantity, onRemove, onDiscount, onHold, onClear, onPay }: CartPanelProps) {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  return <aside className="cart-panel"><div className="cart-heading"><div><span className="eyebrow">CURRENT TRANSACTION</span><h2>Current sale <span className="cart-count">{count}</span></h2></div><button className="more-button" aria-label="Options">•••</button></div>
    <div className="cart-lines">{cart.length === 0 ? <div className="empty-cart"><div className="empty-cart-icon"><ShoppingBag size={21}/></div><strong>Your sale is ready</strong><span>Search or select a product<br/>to add it to the cart.</span></div> : cart.map(item => <div key={item.productId} className={`cart-line ${selected === item.productId ? 'line-selected' : ''}`} onClick={() => onSelect(item.productId)}><div className="line-marker">{item.name.slice(0, 1)}</div><div className="line-details"><strong>{item.name}</strong><span>{money(item.unitPrice)} each</span></div><div className="quantity-control"><button onClick={event => { event.stopPropagation(); onQuantity(item.productId, -1); }} aria-label={`Decrease ${item.name}`}><Minus size={13}/></button><span>{item.quantity}</span><button onClick={event => { event.stopPropagation(); onQuantity(item.productId, 1); }} aria-label={`Increase ${item.name}`}><Plus size={13}/></button></div><strong className="line-total">{money(item.unitPrice * item.quantity)}</strong><button className="remove-line" onClick={event => { event.stopPropagation(); onRemove(item.productId); }} aria-label={`Remove ${item.name}`}><Trash2 size={14}/></button></div>)}</div>
    <div className="cart-bottom"><div className="totals"><div className="total-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="total-row discount-row"><span>Discount</span>{discount > 0 ? <button className="discount-value" onClick={onDiscount}>−{money(discount)} <X size={13}/></button> : <button className="add-discount" onClick={onDiscount}>Add discount</button>}</div>{discount > 0 && <div className="total-row savings"><span>You save</span><span>{money(discount)}</span></div>}</div>
      <div className="grand-total"><div><span>Amount due</span><strong>{money(total)}</strong></div><button className="primary pay-button" onClick={onPay} disabled={!cart.length}>Charge customer <span>{money(total)}</span><b>F2</b></button><div className="cart-actions"><button className="secondary" onClick={onHold} disabled={!cart.length}><Clock3 size={15}/> Hold sale</button><button className="secondary" onClick={onClear} disabled={!cart.length}><Trash2 size={15}/> Clear sale</button></div><p className="secure-payment">Secure payment <span>·</span> Receipt issued automatically</p></div>
    </div>
  </aside>;
}
