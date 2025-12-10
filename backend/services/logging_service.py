from db import SessionLocal
from models.recognition_logs import RecognitionLog

def save_recognition_log(user_id, aircraft_type_id,
                         confidence, processing_ms, source_type):
    db = SessionLocal()
    try:
        log = RecognitionLog(
            UserID=user_id,
            AircraftTypeID=aircraft_type_id,
            Confidence=confidence,
            ProcessingTimeMs=processing_ms,
            SourceType=source_type
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log.LogID
    finally:
        db.close()