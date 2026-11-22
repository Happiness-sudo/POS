import json

from flask import Blueprint, g, jsonify, request

from auth import login_required
from db import get_db
from errors import ApiError

bp = Blueprint("held", __name__)


def _out(row):
    return {"id": row["id"], "label": row["label"], "cashier_id": row["cashier_id"],
            "created_at": row["created_at"], "cart": json.loads(row["cart_json"])}


@bp.get("/")
@login_required()
def list_held():
    rows = get_db().execute("SELECT * FROM held_sales ORDER BY id DESC").fetchall()
    return jsonify([_out(r) for r in rows])


@bp.post("/")
@login_required()
def hold():
    """Body: {"label": "Customer in red", "cart": {...whatever the frontend needs...}}"""
    data = request.get_json(silent=True) or {}
    if not data.get("cart"):
        raise ApiError("Nothing to hold")
    db = get_db()
    cur = db.execute(
        "INSERT INTO held_sales (cashier_id, label, cart_json) VALUES (?,?,?)",
        (g.user["id"], (data.get("label") or "").strip() or None, json.dumps(data["cart"])),
    )
    row = db.execute("SELECT * FROM held_sales WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(_out(row)), 201


@bp.delete("/<int:hid>")
@login_required()
def discard(hid):
    """Call this when a held sale is resumed or discarded."""
    cur = get_db().execute("DELETE FROM held_sales WHERE id = ?", (hid,))
    if cur.rowcount == 0:
        raise ApiError("Held sale not found", 404)
    return "", 204