from flask import Blueprint, jsonify, request

from auth import login_required
from db import get_db
from errors import ApiError

bp = Blueprint("settings", __name__)
ALLOWED = {"shop_name", "currency", "receipt_footer"}


def _all():
    return {r["key"]: r["value"] for r in get_db().execute("SELECT key, value FROM settings")}


@bp.get("/")
@login_required()
def get_settings():
    return jsonify(_all())


@bp.put("/")
@login_required("admin")
def update_settings():
    data = request.get_json(silent=True) or {}
    unknown = set(data) - ALLOWED
    if unknown:
        raise ApiError("Unknown setting(s): " + ", ".join(sorted(unknown)))
    db = get_db()
    for key, value in data.items():
        db.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value", (key, str(value))
        )
    return jsonify(_all())