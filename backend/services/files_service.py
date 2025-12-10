import os
from werkzeug.utils import secure_filename
from db import SessionLocal
from models.audio_files import AudioFile
from datetime import datetime

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_uploaded_file(user_id: int, uploaded_file) -> int:
    """
    Зберігає файл на диск і створює запис у таблиці Audio_Files.
    Повертає file_id (індекс у Audio_Files).
    """
    filename = secure_filename(uploaded_file.filename)
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    saved_name = f"{user_id}_{timestamp}_{filename}"
    saved_path = os.path.join(UPLOAD_DIR, saved_name)
    uploaded_file.save(saved_path)

    db = SessionLocal()
    try:
        af = AudioFile(
            UserID=user_id,
            FilePath=saved_path,
            OriginalName=filename
        )
        db.add(af)
        db.commit()
        db.refresh(af)
        return af.FileID
    finally:
        db.close()
