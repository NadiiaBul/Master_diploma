from flask import Blueprint, request, jsonify
from db import SessionLocal
from werkzeug.security import generate_password_hash, check_password_hash
from models.users import User
from sqlalchemy import text
from datetime import datetime

auth_bp = Blueprint("auth", __name__)

# -------------------------
# LOGIN
# -------------------------
@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"success": False, "error": "missing_data"}), 400

    session = SessionLocal()

    user = session.query(User).filter(User.Username == username).first()
    if not user:
        return jsonify({"success": False, "error": "user_not_found"}), 200

    if not check_password_hash(user.PasswordHash, password):
        return jsonify({"success": False, "error": "wrong_password"}), 200

    # update last login timestamp
    user.LastLogin = datetime.now()
    session.commit()

    return jsonify({
        "success": True,
        "UserID": user.UserID,  # <-- ДОДАНО !!!
        "username": user.Username,
        "role": "admin" if user.RoleID == 1 else "user"
    }), 200

# -------------------------
# REGISTER
# -------------------------
@auth_bp.post("/api/register")
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    session = SessionLocal()

    # Чи зайнятий логін?
    exists = session.query(User).filter(User.Username == username).first()
    if exists:
        return jsonify({"success": False, "error": "username_taken"}), 409

    # Особливий випадок: admin/admin → роль admin
    role_id = 1 if (username == "admin" and password == "admin") else 2

    hashed = generate_password_hash(password)

    new_user = User(
        Username=username,
        PasswordHash=hashed,
        RoleID=role_id
    )

    session.add(new_user)
    session.commit()

    return jsonify({
    "success": True,
    "UserID": new_user.UserID
    })

@auth_bp.route("/api/change_password", methods=["POST"])
def change_password():
    session = SessionLocal()

    data = request.json
    user_id = data.get("user_id")
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not user_id or not old_password or not new_password:
        return jsonify({"error": "Missing data"}), 400

    user = session.query(User).filter(User.UserID == user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Перевірка старого пароля
    if not check_password_hash(user.PasswordHash, old_password):
        return jsonify({"error": "Wrong old password"}), 401

    # Хешування нового пароля
    user.PasswordHash = generate_password_hash(new_password)

    session.commit()
    session.close()

    return jsonify({"success": True})

@auth_bp.route("/api/delete_account", methods=["DELETE"])
def delete_account():
    session = SessionLocal()

    data = request.json
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    user = session.query(User).filter(User.UserID == user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Видаляємо юзера
    session.delete(user)
    session.commit()
    session.close()

    return jsonify({"success": True})
