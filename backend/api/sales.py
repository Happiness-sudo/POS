from datetime import date, datetime

from flask import Blueprint, g, jsonify, request

from auth import login_required
from db import get_db, transaction
from errors import ApiError

bp = Blueprint("sales", __name__)
PAYMENT_METHODS = {"cash", "mpesa", "card", "credit"}


def _int(value, label):
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ApiError(f"{label} must be a whole number")


def _discount(subtotal, spec):
    if not spec:
        return 0
    kind = spec.get("type")
    try:
        value = float(spec.get("value", 0))
    except (TypeError, ValueError):
        raise ApiError("Invalid discount value")
    if value < 0:
        raise ApiError("Discount cannot be negative")
    if kind == "percent":
        if value > 100:
            raise ApiError("Discount cannot exceed 100%")
        amount = round(subtotal * value / 100)
    elif kind == "amount":
        amount = round(value)
    else:
        raise ApiError("Discount type must be 'percent' or 'amount'")
    return min(int(amount), subtotal)


def fetch_sale(db, sale_id):
    sale = db.execute(
        "SELECT s.*, st.name AS cashier_name FROM sales s "
        "JOIN staff st ON st.id = s.cashier_id WHERE s.id = ?", (sale_id,)
    ).fetchone()
    if sale is None:
        return None
    items = db.execute(
        "SELECT product_id, name, unit_price, qty, line_total FROM sale_items WHERE sale_id = ?",
        (sale_id,),
    ).fetchall()
    return {**dict(sale), "items": [dict(i) for i in items]}


@bp.post("/")
@login_required()
def create_sale():
    data = request.get_json(silent=True) or {}
    method = data.get("payment_method")
    if method not in PAYMENT_METHODS:
        raise ApiError("payment_method must be one of: " + ", ".join(sorted(PAYMENT_METHODS)))

    # Merge duplicate lines so a split cart can't bypass the stock check.
    wanted = {}
    for item in data.get("items") or []:
        pid, qty = _int(item.get("product_id"), "product_id"), _int(item.get("qty"), "qty")
        if qty <= 0:
            raise ApiError("Quantity must be at least 1")
        wanted[pid] = wanted.get(pid, 0) + qty
    if not wanted:
        raise ApiError("Cart is empty")

    with transaction() as db:
        lines, subtotal = [], 0
        for pid, qty in wanted.items():
            p = db.execute("SELECT * FROM products WHERE id = ? AND active = 1", (pid,)).fetchone()
            if p is None:
                raise ApiError(f"Product {pid} not found", 404)
            if p["stock"] < qty:
                raise ApiError(f"Only {p['stock']} of {p['name']} in stock", 409)
            line_total = p["price"] * qty
            subtotal += line_total
            lines.append((p["id"], p["name"], p["price"], qty, line_total))
            db.execute("UPDATE products SET stock = stock - ? WHERE id = ?", (qty, pid))

        discount = _discount(subtotal, data.get("discount"))
        total = subtotal - discount

        tendered = change = None
        customer = (data.get("customer_name") or "").strip() or None
        mpesa_code = (data.get("mpesa_code") or "").strip().upper() or None
        if method == "cash":
            tendered = _int(data.get("amount_tendered", total), "amount_tendered")
            if tendered < total:
                raise ApiError("Cash tendered is less than the amount due")
            change = tendered - total
        elif method == "mpesa" and not mpesa_code:
            raise ApiError("M-Pesa transaction code is required")
        elif method == "credit" and not customer:
            raise ApiError("Customer name is required for credit sales")

        cur = db.execute(
            "INSERT INTO sales (cashier_id, subtotal, discount, total, payment_method, "
            "amount_tendered, change_due, customer_name, mpesa_code) VALUES (?,?,?,?,?,?,?,?,?)",
            (g.user["id"], subtotal, discount, total, method, tendered, change, customer, mpesa_code),
        )
        sale_id = cur.lastrowid
        db.execute(
            "UPDATE sales SET receipt_no = ? WHERE id = ?",
            (f"R{datetime.now():%y%m%d}-{sale_id:05d}", sale_id),
        )
        db.executemany(
            "INSERT INTO sale_items (sale_id, product_id, name, unit_price, qty, line_total) "
            "VALUES (?,?,?,?,?,?)",
            [(sale_id, *line) for line in lines],
        )

    return jsonify(fetch_sale(get_db(), sale_id)), 201


@bp.get("/")
@login_required()
def list_sales():
    """Admins see every sale; cashiers see their own. ?date=YYYY-MM-DD&limit=50"""
    sql, params = "SELECT id FROM sales WHERE 1=1", []
    if g.user["role"] != "admin":
        sql += " AND cashier_id = ?"
        params.append(g.user["id"])
    if request.args.get("date"):
        sql += " AND date(created_at) = ?"
        params.append(request.args["date"])
    limit = min(_int(request.args.get("limit", 50), "limit"), 500)
    db = get_db()
    ids = db.execute(sql + " ORDER BY id DESC LIMIT ?", [*params, limit]).fetchall()
    return jsonify([fetch_sale(db, r["id"]) for r in ids])


@bp.get("/summary")
@login_required("admin")
def summary():
    """End-of-day totals, grouped by payment method."""
    day = request.args.get("date") or date.today().isoformat()
    db = get_db()
    rows = db.execute(
        "SELECT payment_method, COUNT(*) AS count, SUM(total) AS total FROM sales "
        "WHERE status = 'completed' AND date(created_at) = ? GROUP BY payment_method", (day,)
    ).fetchall()
    return jsonify(
        date=day,
        by_method={r["payment_method"]: {"count": r["count"], "total": r["total"]} for r in rows},
        sales_count=sum(r["count"] for r in rows),
        total=sum(r["total"] for r in rows),
    )


@bp.get("/<int:sale_id>")
@login_required()
def get_sale(sale_id):
    sale = fetch_sale(get_db(), sale_id)
    if sale is None or (g.user["role"] != "admin" and sale["cashier_id"] != g.user["id"]):
        raise ApiError("Sale not found", 404)
    return jsonify(sale)