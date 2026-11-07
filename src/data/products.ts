import type { Product } from '../types';

export const products: Product[] = [
  { id: 1, shopId: 1, categoryId: 1, name: 'Milk 500ml', sku: 'MILK-500', barcode: '616110010101', buyingPrice: 45, sellingPrice: 60, stock: 24, reorderLevel: 5, active: true },
  { id: 2, shopId: 1, categoryId: 2, name: 'Bread', sku: 'BRD-001', barcode: '616110010102', buyingPrice: 42, sellingPrice: 60, stock: 8, reorderLevel: 5, active: true },
  { id: 3, shopId: 1, categoryId: 3, name: 'Sugar 1kg', sku: 'SUG-1KG', barcode: '616110010103', buyingPrice: 130, sellingPrice: 150, stock: 40, reorderLevel: 8, active: true },
  { id: 4, shopId: 1, categoryId: 1, name: 'Soda 300ml', sku: 'SOD-300', barcode: '616110010104', buyingPrice: 35, sellingPrice: 50, stock: 2, reorderLevel: 5, active: true },
  { id: 5, shopId: 1, categoryId: 4, name: 'Cooking oil 1L', sku: 'OIL-1L', barcode: '616110010105', buyingPrice: 280, sellingPrice: 320, stock: 15, reorderLevel: 4, active: true },
  { id: 6, shopId: 1, categoryId: 3, name: 'Maize flour 2kg', sku: 'FLO-2KG', barcode: '616110010106', buyingPrice: 165, sellingPrice: 190, stock: 30, reorderLevel: 6, active: true },
  { id: 7, shopId: 1, categoryId: 4, name: 'Soap bar', sku: 'SOAP-01', barcode: '616110010107', buyingPrice: 60, sellingPrice: 80, stock: 52, reorderLevel: 6, active: true },
];

export const categories = ['All', 'Drinks', 'Snacks', 'Household', 'Bakery'];
export const categoryMap: Record<string, number> = { Drinks: 1, Snacks: 3, Household: 4, Bakery: 2 };
export const money = (value: number) => `KES ${value.toLocaleString('en-KE')}`;
