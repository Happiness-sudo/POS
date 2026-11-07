import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { CartItem, PaymentMethod, Product, Sale } from '../types';
import { categoryMap, products } from '../data/products';
import TopBar from '../components/TopBar';
import ProductPanel from '../components/ProductPanel';
import CartPanel from '../components/CartPanel';
import PaymentModal from '../components/PaymentModal';
import DiscountModal from '../components/DiscountModal';

interface SalePageProps { onLogout: () => void; onComplete: (sale: Sale) => void }

export default function SalePage({ onLogout, onComplete }: SalePageProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [discount, setDiscount] = useState(0);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [tendered, setTendered] = useState('');
  const [reference, setReference] = useState('');
  const [heldCount, setHeldCount] = useState(2);
  const [toast, setToast] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const received = Number(tendered) || 0;
  const change = Math.max(0, received - total);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const filtered = useMemo(() => products.filter(product => product.active && (category === 'All' || product.categoryId === categoryMap[category]) && `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(search.toLowerCase())), [category, search]);
  const focusSearch = () => requestAnimationFrame(() => searchRef.current?.focus());
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };

  useEffect(() => { focusSearch(); }, []);
  const addProduct = (product?: Product) => {
    if (!product) { notify('No matching product found'); focusSearch(); return; }
    if (product.stock <= 0) notify(`${product.name} is out of stock · sale allowed`);
    setCart(current => { const existing = current.find(item => item.productId === product.id); return existing ? current.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { productId: product.id, name: product.name, unitPrice: product.sellingPrice, quantity: 1 }]; });
    setSelected(product.id); setSearch(''); focusSearch();
  };
  const removeProduct = (id: number) => { setCart(current => current.filter(item => item.productId !== id)); setSelected(null); focusSearch(); };
  const changeQuantity = (id: number, delta: number) => { setCart(current => current.map(item => item.productId === id ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0)); setSelected(id); focusSearch(); };
  const clearSale = () => { setCart([]); setDiscount(0); setSelected(null); setSearch(''); focusSearch(); };
  const holdSale = () => { if (!cart.length) return; setHeldCount(count => count + 1); clearSale(); notify('Sale held'); };
  const startPayment = () => { if (!cart.length) return; setMethod('cash'); setTendered(String(total)); setReference(''); setPaymentOpen(true); };
  const completePayment = () => {
    if (method === 'cash' && received < total) { notify('Amount received is less than the total'); return; }
    if ((method === 'mpesa' || method === 'card') && !reference.trim()) { notify(method === 'mpesa' ? 'Enter the M-Pesa transaction code' : 'Enter the card slip number'); return; }
    const now = new Date();
    const id = now.getTime();
    const sale: Sale = { id, shopId: 1, receiptNo: `R-${now.toISOString().slice(0, 10).replaceAll('-', '')}-${String(id).slice(-4)}`, cashierId: 1,
      items: cart.map((item, index) => ({ id: index + 1, saleId: id, productId: item.productId, name: item.name, unitPrice: item.unitPrice, quantity: item.quantity, lineTotal: item.unitPrice * item.quantity })),
      payments: [{ id: 1, saleId: id, method, amount: method === 'cash' ? received : total, ...(reference ? { reference } : {}) }], subtotal, discount, total,
      amountTendered: method === 'cash' ? received : total, change: method === 'cash' ? change : 0, status: 'completed', createdAt: now.toISOString() };
    setPaymentOpen(false); setCart([]); setDiscount(0); onComplete(sale);
  };
  const handleSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !search.trim()) return;
    event.preventDefault();
    const exact = products.find(product => product.active && (product.barcode?.toLowerCase() === search.trim().toLowerCase() || product.sku?.toLowerCase() === search.trim().toLowerCase()));
    addProduct(exact || filtered[0]);
  };
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'F2') { event.preventDefault(); startPayment(); }
      if (event.key === 'Escape') { if (paymentOpen) setPaymentOpen(false); else if (discountOpen) setDiscountOpen(false); else { setSearch(''); focusSearch(); } }
      if (event.key === 'Delete' && !paymentOpen && !discountOpen && selected !== null) removeProduct(selected);
      if (event.key === 'Enter' && paymentOpen) { event.preventDefault(); completePayment(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paymentOpen, discountOpen, selected, cart, total, method, tendered, reference]);

  return <div className="app-shell"><TopBar heldCount={heldCount} onHeldSales={() => notify('Held sales will appear here')} onLogout={onLogout}/><main className="sale-layout">
    <ProductPanel filtered={filtered} category={category} search={search} selected={selected} searchRef={searchRef} onCategory={value => { setCategory(value); focusSearch(); }} onSearch={setSearch} onSearchKey={handleSearchKey} onAdd={addProduct} onClearSearch={() => { setSearch(''); focusSearch(); }}/>
    <CartPanel cart={cart} selected={selected} subtotal={subtotal} discount={discount} total={total} onSelect={setSelected} onQuantity={changeQuantity} onRemove={removeProduct} onDiscount={() => setDiscountOpen(true)} onHold={holdSale} onClear={clearSale} onPay={startPayment}/>
  </main>{paymentOpen && <PaymentModal total={total} itemCount={itemCount} method={method} tendered={tendered} reference={reference} onMethod={value => { setMethod(value); setTendered(String(total)); }} onTendered={setTendered} onReference={setReference} onClose={() => { setPaymentOpen(false); focusSearch(); }} onConfirm={completePayment} />}{discountOpen && <DiscountModal subtotal={subtotal} currentDiscount={discount} onClose={() => { setDiscountOpen(false); focusSearch(); }} onApply={amount => { setDiscount(amount); setDiscountOpen(false); focusSearch(); }} />}{toast && <div className="toast">{toast}</div>}</div>;
}
