CREATE TABLE IF NOT EXISTS staff (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('cashier', 'admin')),
    active        INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS products (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT NOT NULL,
    sku                 TEXT UNIQUE,
    barcode             TEXT UNIQUE,
    category            TEXT NOT NULL DEFAULT 'General',
    price               INTEGER NOT NULL CHECK (price >= 0),
    stock               INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    active              INTEGER NOT NULL DEFAULT 1,
    created_at          TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS sales (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_no      TEXT UNIQUE,
    cashier_id      INTEGER NOT NULL REFERENCES staff(id),
    subtotal        INTEGER NOT NULL,
    discount        INTEGER NOT NULL DEFAULT 0,
    total           INTEGER NOT NULL,
    payment_method  TEXT NOT NULL CHECK (payment_method IN ('cash', 'mpesa', 'card', 'credit')),
    amount_tendered INTEGER,
    change_due      INTEGER,
    customer_name   TEXT,
    mpesa_code      TEXT,
    status          TEXT NOT NULL DEFAULT 'completed',
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS sale_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id    INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    name       TEXT NOT NULL,
    unit_price INTEGER NOT NULL,
    qty        INTEGER NOT NULL CHECK (qty > 0),
    line_total INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS held_sales (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    cashier_id INTEGER NOT NULL REFERENCES staff(id),
    label      TEXT,
    cart_json  TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);

INSERT OR IGNORE INTO settings (key, value) VALUES
    ('shop_name', 'Karibu Mart'),
    ('currency', 'KES'),
    ('receipt_footer', 'Thank you for shopping with us!');