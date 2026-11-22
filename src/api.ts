import type { CartItem, PaymentMethod, Product, Sale, User } from './types';

const BASE = '/api';
const TOKEN_KEY = 'pos-token';

// Backend category names -> the numeric ids the UI already filters on.
const CATEGORY_IDS: Record<string, number> = { Drinks: 1, Bakery: 2, Grocery: 3, Snacks: 3, Household: 4 };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export const hasToken = () => sessionStorage.getItem(TOKEN_KEY) !== null;
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) { clearToken(); window.dispatchEvent(new Event('pos:unauthorized')); }
    throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

// ---- Backend shapes ----
interface ApiUser { id: number; name: string; username: string; role: 'admin' | 'cashier' }
interface ApiProduct { id: number; name: string; sku: string | null; barcode: string | null; category: string; price: number; stock: number; low_stock_threshold: number; active: boolean }
interface ApiSaleItem { product_id: number; name: string; unit_price: number; qty: number; line_total: number }
interface ApiSale { id: number; receipt_no: string; cashier_id: number; subtotal: number; discount: number; total: number; payment_method: PaymentMethod; amount_tendered: number | null; change_due: number | null; mpesa_code: string | null; status: string; created_at: string; items: ApiSaleItem[] }

// ---- Mappers to the frontend types ----
const toUser = (u: ApiUser): User => ({ id: u.id, shopId: 1, name: u.name, role: u.role === 'admin' ? 'owner' : 'cashier', active: true });

const toProduct = (p: ApiProduct): Product => ({
  id: p.id, shopId: 1, categoryId: CATEGORY_IDS[p.category] ?? null, name: p.name,
  ...(p.sku ? { sku: p.sku } : {}), ...(p.barcode ? { barcode: p.barcode } : {}),
  buyingPrice: 0, sellingPrice: p.price, stock: p.stock, reorderLevel: p.low_stock_threshold, active: p.active,
});

const toSale = (s: ApiSale): Sale => ({
  id: s.id, shopId: 1, receiptNo: s.receipt_no, cashierId: s.cashier_id,
  items: s.items.map((item, index) => ({ id: index + 1, saleId: s.id, productId: item.product_id, name: item.name, unitPrice: item.unit_price, quantity: item.qty, lineTotal: item.line_total })),
  payments: [{ id: 1, saleId: s.id, method: s.payment_method, amount: s.payment_method === 'cash' ? (s.amount_tendered ?? s.total) : s.total, ...(s.mpesa_code ? { reference: s.mpesa_code } : {}) }],
  subtotal: s.subtotal, discount: s.discount, total: s.total,
  amountTendered: s.amount_tendered ?? s.total, change: s.change_due ?? 0,
  status: s.status as Sale['status'],
  createdAt: s.created_at.replace(' ', 'T'),
});

// ---- Calls ----
export async function login(username: string, password: string): Promise<User> {
  const data = await request<{ token: string; user: ApiUser }>('/auth/login', { method: 'POST', body: { username, password } });
  sessionStorage.setItem(TOKEN_KEY, data.token);
  return toUser(data.user);
}

export const getMe = async (): Promise<User> => toUser(await request<ApiUser>('/auth/me'));

export const listProducts = async (): Promise<Product[]> => (await request<ApiProduct[]>('/products')).map(toProduct);

export const listSales = async (): Promise<Sale[]> => (await request<ApiSale[]>('/sales?limit=200')).map(toSale);

interface CheckoutInput { items: CartItem[]; discount: number; method: PaymentMethod; received: number; reference: string }

export async function createSale({ items, discount, method, received, reference }: CheckoutInput): Promise<Sale> {
  const ref = reference.trim();
  const body = {
    items: items.map(item => ({ product_id: item.productId, qty: item.quantity })),
    payment_method: method,
    ...(discount > 0 ? { discount: { type: 'amount', value: discount } } : {}),
    ...(method === 'cash' ? { amount_tendered: received } : {}),
    ...(ref ? (method === 'credit' ? { customer_name: ref } : { reference: ref }) : {}),
  };
  return toSale(await request<ApiSale>('/sales', { method: 'POST', body }));
}