from flask import Blueprint, jsonify, request
from db import SessionLocal
from models.recognition_logs import RecognitionLog
from models.aircraft_types import AircraftType  # якщо така модель є

logs_bp = Blueprint("logs", __name__)

@logs_bp.route("/api/logs", methods=["GET"])
def get_user_logs():
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    db = SessionLocal()
    try:
        logs = (
            db.query(RecognitionLog)
            .filter(RecognitionLog.UserID == user_id)
            .order_by(RecognitionLog.CreatedAt.desc())
            .all()
        )

        result = []
        for log in logs:
            # маппінг ID → текст
            type_map = {
                1: "Дрон",
                2: "Вертоліт",
                3: "Літак"
            }

            result.append({
                "id": log.LogID,
                "type": type_map.get(log.AircraftTypeID, "Невідомо"),
                "time": log.CreatedAt.strftime("%d.%m.%Y %H:%M:%S"),
                "confidence": log.Confidence,
                "accuracy": log.Confidence,  
                "duration": log.ProcessingTimeMs,
                "source": "файл" if log.SourceType == "file" else "реальний час"
            })

        return jsonify(result)
    finally:
        db.close()