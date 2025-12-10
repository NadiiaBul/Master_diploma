from flask import Blueprint, jsonify
from db import SessionLocal
from models.users import User
from models.recognition_logs import RecognitionLog
from sqlalchemy import func
from models.recognition_logs import RecognitionLog
from models.aircraft_types import AircraftType

stats_bp = Blueprint("stats", __name__)

@stats_bp.route("/stats", methods=["GET"])
def get_stats():
    session = SessionLocal()
    try:
        total_detections = session.query(func.count(RecognitionLog.LogID)).scalar()
        active_users = session.query(func.count(User.UserID)).scalar()
        avg_processing_time = session.query(func.avg(RecognitionLog.ProcessingTimeMs)).scalar() or 0

        # Топ-5 користувачів
        top_users_query = (
            session.query(
                User.Username.label("username"),
                func.count(RecognitionLog.LogID).label("detectionsCount")
            )
            .join(RecognitionLog, RecognitionLog.UserID == User.UserID)
            .group_by(User.UserID, User.Username)  # <-- додали Username
            .order_by(func.count(RecognitionLog.LogID).desc())
            .limit(5)
            .all()
        )
        top_users = [{"username": u.username, "detectionsCount": u.detectionsCount} for u in top_users_query]

        res = jsonify({
            "totalDetections": total_detections,
            "activeUsers": active_users,
            "avgProcessingTime": avg_processing_time,
            "topUsers": top_users
        })

        print(f"RESULT:{res}")

        return res
    finally:
        session.close()

@stats_bp.route("/statistics", methods=["GET"])
def get_statistics():
    session = SessionLocal()
    try:
        # --- Статистика по типах апаратів ---
        aircraft_counts = (
            session.query(AircraftType.AircraftName, func.count(RecognitionLog.LogID))
            .join(RecognitionLog, RecognitionLog.AircraftTypeID == AircraftType.AircraftTypeID)
            .group_by(AircraftType.AircraftName)
            .all()
        )
        aircraft_type_data = []
        for name, count in aircraft_counts:
            # Можна додати кольори за типом
            color = "#8884d8"  # базовий
            if name.lower() == "дрон": color = "#ef4444"
            elif name.lower() == "літак": color = "#3b82f6"
            elif name.lower() == "вертоліт": color = "#22c55e"
            else: color = "#94a3b8"
            aircraft_type_data.append({"name": name, "value": count, "color": color})

        # --- Статистика по джерелах ---
        source_counts = (
            session.query(RecognitionLog.SourceType, func.count(RecognitionLog.LogID))
            .group_by(RecognitionLog.SourceType)
            .all()
        )
        source_data = [{"name": src, "value": count} for src, count in source_counts]

        return jsonify({
            "aircraftTypeData": aircraft_type_data,
            "sourceData": source_data
        })
    finally:
        session.close()