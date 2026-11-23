import os
from pathlib import Path

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

import db
from errors import ApiError


def create_app():
    app = Flask(__name__)
    app.url_map.strict_slashes = False
    app.config.update(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev-only-change-me"),
        DATABASE=os.environ.get("DATABASE", str(Path(__file__).parent / "soko.db")),
    )
    app.teardown_appcontext(db.close_db)

    from api import auth_routes, held, products, sales, settings, staff
    app.register_blueprint(auth_routes.bp, url_prefix="/api/auth")
    app.register_blueprint(products.bp, url_prefix="/api/products")
    app.register_blueprint(sales.bp, url_prefix="/api/sales")
    app.register_blueprint(held.bp, url_prefix="/api/held-sales")
    app.register_blueprint(staff.bp, url_prefix="/api/staff")
    app.register_blueprint(settings.bp, url_prefix="/api/settings")

    @app.errorhandler(ApiError)
    def handle_api_error(err):
        return jsonify(error=err.message), err.status

    @app.errorhandler(HTTPException)
    def handle_http_error(err):
        return jsonify(error=err.description), err.code

    @app.errorhandler(Exception)
    def handle_unexpected(err):
        app.logger.exception(err)
        return jsonify(error="Something went wrong on the server"), 500

    @app.get("/api/health")
    def health():
        return jsonify(status="ok")

    @app.cli.command("init-db")
    def init_db_command():
        """Create tables."""
        db.init_db()
        print("Database initialised.")

    @app.cli.command("seed")
    def seed_command():
        """Create tables and load sample data."""
        from seed import seed
        db.init_db()
        seed()
        print("Seeded. Logins: admin/admin123, alex/1234")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)