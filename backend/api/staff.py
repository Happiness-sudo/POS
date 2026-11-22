from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash

from auth import login_required
from db import get_db
from errors import ApiError

bp = Blueprint("staff", __name__)
COLUMNS = "id, name, username, role, active, created_at"


def _out(row):
    d = dict(row)
    d["active"] = bool(d["active"])
    return d


@bp.get("/")
@login_required("admin")
def list_staff():
    rows = get_db().execute(f"SELECT {COLUMNS} FROM staff ORDER BY name").fetchall()
    return jsonify([_out(r) for r in rows])


@bp.post("/")
@login_required("admin")
def create_staff():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role", "cashier")
    if not name or not username:
        raise ApiError("Name and username are required")
    if len(password) < 4:
        raise ApiError("Password must be at least 4 characters")
    if role not in ("cashier", "admin"):
        raise ApiError("Role must be 'cashier' or 'admin'")
    db = get_db()
    try:
        cur = db.execute(
            "INSERT INTO staff (name, username, password_hash, role) VALUES (?,?,?,?)",
            (name, username, generate_password_hash(password), role),
        )
    except Exception as exc:
        if "UNIQUE" in str(exc):
            raise ApiError("Username already taken", 409)
        raise
    return jsonify(_out(db.execute(f"SELECT {COLUMNS} FROM staff WHERE id = ?", (cur.lastrowid,)).fetchone())), 201


@bp.put("/<int:sid>")
@login_required("admin")
def update_staff(sid):
    data = request.get_json(silent=True) or {}
    sets, params = [], []
    if "name" in data:
        sets.append("name = ?"); params.append(data["name"].strip())
    if "role" in data:
        if data["role"] not in ("cashier", "admin"):
            raise ApiError("Role must be 'cashier' or 'admin'")
        sets.append("role = ?"); params.append(data["role"])
    if "active" in data:
        sets.append("active = ?"); params.append(1 if data["active"] else 0)
    if data.get("password"):
        sets.append("password_hash = ?"); params.append(generate_password_hash(data["password"]))
    if not sets:
        raise ApiError("Nothing to update")
    db = get_db()
    cur = db.execute(f"UPDATE staff SET {', '.join(sets)} WHERE id = ?", [*params, sid])
    if cur.rowcount == 0:
        raise ApiError("Staff member not found", 404)
    return jsonify(_out(db.execute(f"SELECT {COLUMNS} FROM staff WHERE id = ?", (sid,)).fetchone()))