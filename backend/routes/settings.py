from flask import Blueprint, jsonify, request
from db import get_db_session
from models.settings import SystemSettings

settings_bp = Blueprint("settings", __name__)

# GET — отримати значення
@settings_bp.get("/realtime")
def get_realtime():
    session = get_db_session()
    row = session.query(SystemSettings).filter_by(SettingKey="allow_realtime").first()

    if not row:
        return jsonify({"allow_realtime": False}), 200

    # row.SettingValue — це рядок "1" або "0"
    return jsonify({"allow_realtime": row.SettingValue == "1"}), 200


# POST — оновити значення
@settings_bp.post("/realtime")
def update_realtime():
    data = request.get_json()
    enabled = data.get("enabled", False)

    session = get_db_session()
    row = session.query(SystemSettings).filter_by(SettingKey="allow_realtime").first()

    if not row:
        row = SystemSettings(SettingKey="allow_realtime", SettingValue="1")
        session.add(row)

    row.SettingValue = "1" if enabled else "0"
    session.commit()

    return jsonify({"status": "ok"}), 200