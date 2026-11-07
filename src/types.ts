export type Role = 'owner' | 'manager' | 'cashier';
export type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'credit';
export type SaleStatus = 'completed' | 'voided' | 'refunded' | 'held';
export type StockReason = 'sale' | 'restock' | 'adjustment' | 'void';
export interface Shop { id: number; name: string; address?: string; phone?: string; receiptFooter?: string; currency: string }
export interface User { id: number; shopId: number; name: string; phone?: string; role: Role; active: boolean }
export interface Category { id: number; shopId: number; name: string }
export interface Product { id: number; shopId: number; categoryId: number | null; name: string; sku?: string; barcode?: string; buyingPrice: number; sellingPrice: number; stock: number; reorderLevel: number; active: boolean }
export interface CartItem { productId: number; name: string; unitPrice: number; quantity: number }
export interface SaleItem { id: number; saleId: number; productId: number; name: string; unitPrice: number; quantity: number; lineTotal: number }
export interface Payment { id: number; saleId: number; method: PaymentMethod; amount: number; reference?: string }
export interface Sale { id: number; shopId: number; receiptNo: string; cashierId: number; items: SaleItem[]; payments: Payment[]; subtotal: number; discount: number; total: number; amountTendered?: number; change?: number; status: SaleStatus; createdAt: string }
export interface StockMovement { id: number; productId: number; quantityChange: number; reason: StockReason; note?: string; createdBy: number; createdAt: string }
