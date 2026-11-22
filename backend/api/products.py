from flask import Blueprint, jsonify, request

from auth import login_required
from db import get_db
from errors import ApiError

bp = Blueprint("products", __name__)


def _out(row):
    d = dict(row)
    d["low_stock"] = d["stock"] <= d["low_stock_threshold"]
    d["active"] = bool(d["active"])
    return d


def _clean(data, partial=False):
    out = {}
    if "name" in data or not partial:
        name = (data.get("name") or "").strip()
        if not name:
            raise ApiError("Product name is required")
        out["name"] = name
    for key in ("sku", "barcode"):
        if key in data:
            out[key] = (str(data[key]).strip() or None) if data[key] is not None else None
    if "category" in data:
        out["category"] = (data["category"] or "General").strip()
    for key in ("price", "stock", "low_stock_threshold"):
        if key in data or (key == "price" and not partial):
            try:
                val = int(data.get(key))
            except (TypeError, ValueError):
                raise ApiError(f"{key} must be a whole number")
            if val < 0:
                raise ApiError(f"{key} cannot be negative")
            out[key] = val
    if "active" in data:
        out["active"] = 1 if data["active"] else 0
    return out


@bp.get("/")
@login_required()
def list_products():
    q = request.args.get("q", "").strip()
    category = request.args.get("category", "").strip()
    sql, params = "SELECT * FROM products WHERE active = 1", []
    if q:
        sql += " AND (name LIKE ? OR sku LIKE ? OR barcode = ?)"
        params += [f"%{q}%", f"%{q}%", q]
    if category and category != "All":
        sql += " AND category = ?"
        params.append(category)
    rows = get_db().execute(sql + " ORDER BY name", params).fetchall()
    return jsonify([_out(r) for r in rows])


@bp.get("/barcode/<code>")
@login_required()
def by_barcode(code):
    row = get_db().execute(
        "SELECT * FROM products WHERE barcode = ? AND active = 1", (code,)
    ).fetchone()
    if row is None:
        raise ApiError("No product with that barcode", 404)
    return jsonify(_out(row))


@bp.get("/categories")
@login_required()
def categories():
    rows = get_db().execute(
        "SELECT DISTINCT category FROM products WHERE active = 1 ORDER BY category"
    ).fetchall()
    return jsonify([r["category"] for r in rows])


@bp.post("/")
@login_required("admin")
def create_product():
    fields = _clean(request.get_json(silent=True) or {})
    db = get_db()
    try:
        cur = db.execute(
            f"INSERT INTO products ({', '.join(fields)}) VALUES ({', '.join('?' * len(fields))})",
            list(fields.values()),
        )
    except Exception as exc:
        if "UNIQUE" in str(exc):
            raise ApiError("SKU or barcode already exists", 409)
        raise
    row = db.execute("SELECT * FROM products WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(_out(row)), 201


@bp.put("/<int:pid>")
@login_required("admin")
def update_product(pid):
    fields = _clean(request.get_json(silent=True) or {}, partial=True)
    if not fields:
        raise ApiError("Nothing to update")
    db = get_db()
    try:
        cur = db.execute(
            f"UPDATE products SET {', '.join(f'{k} = ?' for k in fields)} WHERE id = ?",
            [*fields.values(), pid],
        )
    except Exception as exc:
        if "UNIQUE" in str(exc):
            raise ApiError("SKU or barcode already exists", 409)
        raise
    if cur.rowcount == 0:
        raise ApiError("Product not found", 404)
    return jsonify(_out(db.execute("SELECT * FROM products WHERE id = ?", (pid,)).fetchone()))


@bp.post("/<int:pid>/stock")
@login_required("admin")
def adjust_stock(pid):
    """Body: {"delta": 10} to receive stock, {"delta": -2} to write off."""
    data = request.get_json(silent=True) or {}
    try:
        delta = int(data.get("delta"))
    except (TypeError, ValueError):
        raise ApiError("delta must be a whole number")
    db = get_db()
    cur = db.execute(
        "UPDATE products SET stock = stock + ? WHERE id = ? AND stock + ? >= 0",
        (delta, pid, delta),
    )
    if cur.rowcount == 0:
        raise ApiError("Product not found or stock would go negative", 409)
    return jsonify(_out(db.execute("SELECT * FROM products WHERE id = ?", (pid,)).fetchone()))


@bp.delete("/<int:pid>")
@login_required("admin")
def delete_product(pid):
    # Soft delete: past sales keep pointing at the product.
    cur = get_db().execute("UPDATE products SET active = 0 WHERE id = ?", (pid,))
    if cur.rowcount == 0:
        raise ApiError("Product not found", 404)
    return "", 204