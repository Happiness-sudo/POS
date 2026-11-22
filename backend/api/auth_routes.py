from flask import Blueprint, g, jsonify, request
from werkzeug.security import check_password_hash

from auth import login_required, make_token
from db import get_db
from errors import ApiError

bp = Blueprint("auth", __name__)


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""
    user = get_db().execute(
        "SELECT * FROM staff WHERE username = ? AND active = 1", (username,)
    ).fetchone()
    if user is None or not check_password_hash(user["password_hash"], password):
        raise ApiError("Wrong username or password", 401)
    return jsonify(
        token=make_token(user["id"]),
        user={"id": user["id"], "name": user["name"],
              "username": user["username"], "role": user["role"]},
    )


@bp.get("/me")
@login_required()
def me():
    return jsonify(dict(g.user))