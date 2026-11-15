# Soko POS

A browser-based point-of-sale app for a small shop. The frontend is built with React, TypeScript, and Vite.

## Requirements

- Node.js with npm

## Run locally

```bash
npm install
npm run dev
```

Vite prints the local development URL after startup.

## Build and preview

```bash
npm run build
npm run preview
```

## Features

- Staff sign-in screen and cashier sales workspace
- Product search, barcode entry, categories, cart quantity controls, discounts, and checkout
- Cash, M-Pesa, card, and customer-credit payment methods
- Held sales and sales history with receipt details
- Admin workspace with dashboard, product and stock management, reports, end-of-day summary, staff management, and shop settings
- Receipt view with print support

## Current data and integrations

The app currently uses sample product, staff, and sales data. Product inventory, staff records, shop settings, and sales history are stored in the browser's `localStorage` under `pos-products`, `pos-staff`, `pos-settings`, and `pos-sales-history`.

The M-Pesa screen is frontend-only. It provides the prompt and payment-message UI plus manual transaction-code entry; sending STK prompts and checking payment status require a backend integration that is not included yet.

## Project layout

```text
src/
  components/   Reusable cashier UI, including checkout and cart components
  data/         Sample product catalog
  pages/        Cashier, admin, reports, history, held-sale, login, and receipt screens
  App.tsx       App-level sign-in and sale flow
  styles.css    Application styles
```
