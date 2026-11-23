from werkzeug.security import generate_password_hash

from db import get_db

STAFF = [
    ("Admin", "admin", "admin123", "admin"),
    ("Alex Kimani", "alex", "1234", "cashier"),
]

PRODUCTS = [
    # name, sku, barcode, category, price, stock
    ("Milk 500ml", "M5", "6001000000011", "Drinks", 60, 24),
    ("Bread", "B", "6001000000028", "Bakery", 60, 8),
    ("Sugar 1kg", "S1", "6001000000035", "Grocery", 150, 40),
    ("Soda 300ml", "S3", "6001000000042", "Drinks", 50, 2),
    ("Cooking oil 1L", "Co", "6001000000059", "Household", 320, 15),
    ("Maize flour 2kg", "Mf", "6001000000066", "Grocery", 190, 30),
    ("Biscuits", "Bi", "6001000000073", "Snacks", 40, 50),
]


def seed():
    db = get_db()
    for name, username, password, role in STAFF:
        db.execute(
            "INSERT OR IGNORE INTO staff (name, username, password_hash, role) VALUES (?,?,?,?)",
            (name, username, generate_password_hash(password), role),
        )
    for row in PRODUCTS:
        db.execute(
            "INSERT OR IGNORE INTO products (name, sku, barcode, category, price, stock) "
            "VALUES (?,?,?,?,?,?)", row
        )