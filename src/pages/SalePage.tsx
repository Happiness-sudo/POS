import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { CartItem, PaymentMethod, Product, Sale } from '../types';
import { categoryMap } from '../data/products';
import { createSale, listProducts, listSales } from '../api';
import TopBar from '../components/TopBar';
import ProductPanel from '../components/ProductPanel';
import CartPanel from '../components/CartPanel';
import PaymentModal from '../components/PaymentModal';
import DiscountModal from '../components/DiscountModal';
import HeldSalesPage, { type HeldSale } from './HeldSalesPage';
import SalesHistoryPage from './SalesHistoryPage';
import AdminPage from './AdminPage';

interface SalePageProps { onLogout: () => void; onComplete: (sale: Sale) => void }

export default function SalePage({ onLogout, onComplete }: SalePageProps) {
  const [search, setSearch] = useState('');
  const [inventory, setInventory] = useState<Product[]>([]);
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [discount, setDiscount] = useState(0);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [tendered, setTendered] = useState('');
  const [reference, setReference] = useState('');
  const [scanMode, setScanMode] = useState(false);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([
    { id: -1, label: '[LABEL: Lady in red]', heldAt: '10:42', items: [{ productId: 1, name: 'Sample item', unitPrice: 160, quantity: 4 }], discount: 0, total: 640 },
    { id: -2, label: '[LABEL]', heldAt: '11:05', items: [{ productId: 2, name: 'Sample item', unitPrice: 105, quantity: 2 }], discount: 0, total: 210 },
  ]);
  const [showHeldSales, setShowHeldSales] = useState(false);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [toast, setToast] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const received = Number(tendered) || 0;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const filtered = useMemo(() => inventory.filter(product => product.active && (category === 'All' || product.categoryId === categoryMap[category]) && `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(search.toLowerCase())), [inventory, category, search]);
  const focusSearch = () => requestAnimationFrame(() => searchRef.current?.focus());
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };

  useEffect(() => { focusSearch(); }, []);
  const refreshInventory = () => { listProducts().then(setInventory).catch(error => notify(error instanceof Error ? error.message : 'Could not load products')); };
  const refreshSales = () => { listSales().then(setSales).catch(error => notify(error instanceof Error ? error.message : 'Could not load sales history')); };
  useEffect(() => { refreshInventory(); refreshSales(); }, []);
  const submittingRef = useRef(false);
  const addProduct = (product?: Product) => {
    if (!product) { notify('No matching product found'); focusSearch(); return; }
    if (product.stock <= 0) notify(`${product.name} is out of stock · sale allowed`);
    setCart(current => { const existing = current.find(item => item.productId === product.id); return existing ? current.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { productId: product.id, name: product.name, unitPrice: product.sellingPrice, quantity: 1 }]; });
    setSelected(product.id); setSearch(''); focusSearch();
  };
  const removeProduct = (id: number) => { setCart(current => current.filter(item => item.productId !== id)); setSelected(null); focusSearch(); };
  const changeQuantity = (id: number, delta: number) => { setCart(current => current.map(item => item.productId === id ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0)); setSelected(id); focusSearch(); };
  const clearSale = () => { setCart([]); setDiscount(0); setSelected(null); setSearch(''); focusSearch(); };
  const holdSale = () => { if (!cart.length) return; const now = new Date(); setHeldSales(current => [{ id: now.getTime(), label: '', heldAt: now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false }), items: cart, discount, total }, ...current]); clearSale(); notify('Sale held'); };
  const resumeHeldSale = (sale: HeldSale) => { setCart(sale.items); setDiscount(sale.discount); setHeldSales(current => current.filter(item => item.id !== sale.id)); setShowHeldSales(false); };
  const startPayment = () => { if (!cart.length) return; setMethod('cash'); setTendered(String(total)); setReference(''); setPaymentOpen(true); };
  const completePayment = async () => {
    if (method === 'cash' && received < total) { notify('Amount received is less than the total'); return; }
    if ((method === 'mpesa' || method === 'card') && !reference.trim()) { notify(method === 'mpesa' ? 'Enter the M-Pesa transaction code' : 'Enter the card slip number'); return; }
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const sale = await createSale({ items: cart, discount, method, received, reference });
      setSales(current => [sale, ...current]);
      refreshInventory();
      setPaymentOpen(false); setCart([]); setDiscount(0); onComplete(sale);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not complete the sale');
    } finally {
      submittingRef.current = false;
    }
  };
  const handleSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !search.trim()) return;
    event.preventDefault();
    const exact = inventory.find(product => product.active && (product.barcode?.toLowerCase() === search.trim().toLowerCase() || product.sku?.toLowerCase() === search.trim().toLowerCase()));
    if (scanMode) {
      setScanMode(false);
      if (!exact) { setSearch(''); notify('No product matches this barcode'); focusSearch(); return; }
      addProduct(exact); return;
    }
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

  if (showHeldSales) return <HeldSalesPage sales={heldSales} onBack={() => setShowHeldSales(false)} onLogout={onLogout} onResume={resumeHeldSale} onDelete={id => setHeldSales(current => current.filter(sale => sale.id !== id))}/>;
  if (showSalesHistory) return <SalesHistoryPage sales={sales} onBack={() => setShowSalesHistory(false)} onLogout={onLogout}/>;
  if (showAdmin) return <AdminPage onBack={() => { refreshInventory(); setShowAdmin(false); }} onLogout={onLogout}/>;
  return <div className="app-shell"><TopBar heldCount={heldSales.length} onHeldSales={() => setShowHeldSales(true)} onSalesHistory={() => setShowSalesHistory(true)} onAdmin={() => setShowAdmin(true)} onLogout={onLogout}/><main className="sale-layout">
    <ProductPanel filtered={filtered} category={category} search={search} selected={selected} searchRef={searchRef} onCategory={value => { setCategory(value); focusSearch(); }} onSearch={setSearch} onSearchKey={handleSearchKey} onAdd={addProduct} onClearSearch={() => { setSearch(''); focusSearch(); setScanMode(false); }} onScanBarcode={() => { setScanMode(true); setSearch(''); focusSearch(); notify('Ready to scan barcode'); }}/>
    <CartPanel cart={cart} selected={selected} subtotal={subtotal} discount={discount} total={total} onSelect={setSelected} onQuantity={changeQuantity} onRemove={removeProduct} onDiscount={() => setDiscountOpen(true)} onHold={holdSale} onClear={clearSale} onPay={startPayment}/>
  </main>{paymentOpen && <PaymentModal total={total} itemCount={itemCount} method={method} tendered={tendered} reference={reference} onMethod={value => { setMethod(value); setTendered(String(total)); }} onTendered={setTendered} onReference={setReference} onClose={() => { setPaymentOpen(false); focusSearch(); }} onConfirm={completePayment} />}{discountOpen && <DiscountModal subtotal={subtotal} currentDiscount={discount} onClose={() => { setDiscountOpen(false); focusSearch(); }} onApply={amount => { setDiscount(amount); setDiscountOpen(false); focusSearch(); }} />}{toast && <div className="toast">{toast}</div>}</div>;
}
