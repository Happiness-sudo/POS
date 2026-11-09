import { Barcode, CircleHelp, Plus, Search, ShoppingBag, X } from 'lucide-react';
import type { KeyboardEvent, RefObject } from 'react';
import type { Product } from '../types';
import { categories, money } from '../data/products';

interface ProductPanelProps {
  filtered: Product[]; category: string; search: string; selected: number | null;
  searchRef: RefObject<HTMLInputElement | null>; onCategory: (category: string) => void;
  onSearch: (value: string) => void; onSearchKey: (event: KeyboardEvent<HTMLInputElement>) => void;
  onAdd: (product: Product) => void; onClearSearch: () => void; onScanBarcode: () => void;
}

export default function ProductPanel({ filtered, category, search, selected, searchRef, onCategory, onSearch, onSearchKey, onAdd, onClearSearch, onScanBarcode }: ProductPanelProps) {
  return <section className="product-panel"><div className="catalog-heading"><div><span className="eyebrow">POINT OF SALE</span><h1>New sale <span className="kbd">F2</span></h1></div><button className="help-button" title="Help"><CircleHelp size={18}/></button></div>
    <div className="search-wrap"><Search size={19}/><input ref={searchRef} value={search} onChange={event => onSearch(event.target.value)} onKeyDown={onSearchKey} placeholder="Search products or scan barcode…" aria-label="Search products or scan barcode"/><button type="button" className="scan-hint" onClick={onScanBarcode} aria-label="Activate barcode scanner" title="Focus this field for a connected barcode scanner"><Barcode size={17}/> Scan barcode</button>{search && <button className="clear-search" onClick={onClearSearch} aria-label="Clear search"><X size={16}/></button>}</div>
    <div className="catalog-toolbar"><div className="category-tabs">{categories.map((item, index) => <button key={item} className={`category-tab ${category === item ? 'active' : ''}`} onClick={() => onCategory(item)}>{index === 0 && <ShoppingBag size={15}/>} {item}</button>)}</div><div className="product-count">{filtered.length} products</div></div>
    <div className="product-grid">{filtered.map(product => <button key={product.id} className={`product-card ${selected === product.id ? 'selected' : ''}`} onClick={() => onAdd(product)}><div className={`product-art art-${product.id}`}><span>{product.name.split(' ').map(word => word[0]).join('').slice(0, 2)}</span><i>{product.categoryId === 1 ? 'DRINKS' : product.categoryId === 2 ? 'BAKERY' : product.categoryId === 4 ? 'HOME' : 'GROCERY'}</i></div><div className="product-info"><div className="product-name">{product.name}</div><div className="product-bottom"><strong>{money(product.sellingPrice)}</strong>{product.stock <= product.reorderLevel ? <span className="stock-warning">Low stock <b>{product.stock}</b></span> : <span className="stock-count">{product.stock} in stock</span>}</div></div><span className="quick-add"><Plus size={16}/></span></button>)}</div>
    {filtered.length === 0 && <div className="empty-products"><Search size={22}/><strong>No products found</strong><span>Try another name, SKU, or barcode.</span></div>}<div className="catalog-foot"><span><kbd>Enter</kbd> add first result</span><span><kbd>Esc</kbd> clear search</span><span><kbd>Del</kbd> remove selected</span></div>
  </section>;
}
