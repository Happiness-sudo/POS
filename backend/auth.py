from functools import wraps

from flask import current_app, g, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from db import get_db
from errors import ApiError

TOKEN_MAX_AGE = 60 * 60 * 12  # 12 hours (one shift)


def _serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="soko-auth")


def make_token(staff_id):
    return _serializer().dumps({"id": staff_id})


def login_required(role=None):
    """Require a valid Bearer token. role='admin' restricts to admins."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            header = request.headers.get("Authorization", "")
            if not header.startswith("Bearer "):
                raise ApiError("Authentication required", 401)
            try:
                data = _serializer().loads(header[7:], max_age=TOKEN_MAX_AGE)
            except SignatureExpired:
                raise ApiError("Session expired, please sign in again", 401)
            except BadSignature:
                raise ApiError("Invalid token", 401)

            user = get_db().execute(
                "SELECT id, name, username, role FROM staff WHERE id = ? AND active = 1",
                (data["id"],),
            ).fetchone()
            if user is None:
                raise ApiError("Account not found or disabled", 401)
            if role == "admin" and user["role"] != "admin":
                raise ApiError("Admin access required", 403)

            g.user = user
            return fn(*args, **kwargs)
        return wrapper
    return decorator