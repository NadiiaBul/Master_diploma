from flask import Blueprint, jsonify
from db import SessionLocal
from models.users import User

users_bp = Blueprint("users", __name__)

@users_bp.route("/api/users", methods=["GET"])
def get_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()

        result = []
        for u in users:
            result.append({
                "id": u.UserID,
                "username": u.Username,
                "role": u.role.RoleName,   # <-- ПРАЦЮЄ через relationship
                "createdAt": u.CreatedAt.strftime("%d.%m.%Y %H:%M:%S") if u.CreatedAt else "—",
                "lastLogin": u.LastLogin.strftime("%d.%m.%Y %H:%M:%S") if u.LastLogin else "—"
            })

        return jsonify(result)

    finally:
        db.close()

@users_bp.route("/api/users/delete/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.UserID == user_id).first()

        print(f"USER:{user}")
        if not user:
            return jsonify({"error": "User not found"}), 404

        if user.Username == "admin":
            return jsonify({"error": "Cannot delete admin"}), 400

        db.delete(user)
        db.commit()

        return jsonify({"success": True})
    finally:
        db.close()