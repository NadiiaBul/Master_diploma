from flask import request
from db import SessionLocal
from models.users import User

def get_current_user():
    user_id = request.headers.get("X-User-ID")
    if not user_id:
        return None

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.UserID == int(user_id)).first()
        return user
    finally:
        db.close()