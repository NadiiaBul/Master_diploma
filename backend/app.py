from flask import Flask, request, jsonify, g
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import librosa
import os
import tempfile
from werkzeug.utils import secure_filename
from pydub import AudioSegment
import logging
from db import Base, engine
import models
import time
from routes.system import system_bp, register_request, register_request_time
from services.files_service import save_uploaded_file
from services.logging_service import save_recognition_log
from db import SessionLocal  # припускаю, що db.SessionLocal доступний
from models.users import User
from models.audio_files import AudioFile
from models.recognition_logs import RecognitionLog
from models.realtime_sessions import RealtimeSession
from models.models import Model
from models.aircraft_types import AircraftType
from datetime import datetime

# ======================== DB INIT ==========================
def create_db():
    Base.metadata.create_all(bind=engine)

create_db()

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)


from db import SessionLocal
from sqlalchemy import text

@app.route("/test_db")
def test_db():
    try:
        session = SessionLocal()
        result = session.execute(text("SELECT 1")).fetchone()
        session.close()
        return {"db_status": "ok", "result": result[0]}
    except Exception as e:
        return {"db_status": "failed", "error": str(e)}

from auth import auth_bp
app.register_blueprint(auth_bp)
from routes.settings import settings_bp
app.register_blueprint(settings_bp, url_prefix="/api/settings")
from routes.system import system_bp
app.register_blueprint(system_bp, url_prefix="/api/system")
from api.logs import logs_bp
app.register_blueprint(logs_bp)
from api.users import users_bp
app.register_blueprint(users_bp)
from api.stats import stats_bp
app.register_blueprint(stats_bp, url_prefix="/api")


def get_current_user_from_header():
    from db import SessionLocal
    from models.users import User

    user_id = request.headers.get("X-User-ID")
    if not user_id:
        return None

    db = SessionLocal()
    try:
        return db.query(User).filter(User.UserID == int(user_id)).first()
    finally:
        db.close()

# ======================== PATHS ==========================
BASE_DIR = os.path.dirname(__file__)
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ----- MODEL PATHS -----
MODEL_FILES = {
    "4": "model.h5",
    "6": "yamnet.h5",
    "5": "crnn.h5",
}

loaded_models = {}  # Cache storage

# ================== MODEL LOADING =========================
def get_model(model_key: str):
    """Load model dynamically and cache it."""
    if model_key not in MODEL_FILES:
        raise ValueError(f"Unknown model key: {model_key}")

    if model_key in loaded_models:
        return loaded_models[model_key]

    model_path = os.path.join(BASE_DIR, MODEL_FILES[model_key])
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")

    logging.info(f"Loading model: {model_path}")
    model = tf.keras.models.load_model(model_path)
    loaded_models[model_key] = model
    logging.info(f"Model '{model_key}' loaded successfully.")

    return model

# ================== CLASS LABELS ==========================
CLASS_LABELS = ["drone", "airplane", "helicopter"]

# ================== FEATURE EXTRACTION =====================
def extract_features(audio_file_path, sr=22050, n_mfcc=40, duration=5.0):
    try:
        y, sr = librosa.load(audio_file_path, sr=sr, duration=duration, mono=True)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
        mfccs_mean = np.mean(mfccs, axis=1)
        return np.expand_dims(mfccs_mean, axis=(0, -1))
    except Exception:
        logging.exception("Feature extraction error:")
        return None

# ================== CONVERT TO WAV =========================
def convert_to_wav(in_path):
    wav_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    wav_tmp.close()
    wav_path = wav_tmp.name
    try:
        sound = AudioSegment.from_file(in_path)
        sound.export(wav_path, format="wav")
        return wav_path
    except Exception:
        logging.exception("Conversion to WAV failed:")
        if os.path.exists(wav_path):
            os.remove(wav_path)
        return None


# ======================= /analyze ==========================
@app.route("/analyze", methods=["POST"])
def analyze_audio():
    if "file" not in request.files:
        return jsonify({"error": "Не знайдено файл"}), 400

    # Read selected model (frontend sends: formData.append("model", selectedModel))
    model_key = request.form.get("model", "custom")
    print(f"Model: {model_key}")

    try:
        model = get_model(model_key)
    except Exception as e:
        return jsonify({"error": f"Помилка завантаження моделі: {str(e)}"}), 500

    file = request.files["file"]
    filename = secure_filename(file.filename)
    tmp_in = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1] or ".wav")

    try:
        file.save(tmp_in.name)
        tmp_in.close()

        ext = os.path.splitext(filename)[1].lower()
        if ext != ".wav":
            wav_path = convert_to_wav(tmp_in.name)
            os.remove(tmp_in.name)
            if not wav_path:
                return jsonify({"error": "Не вдалося конвертувати аудіо"}), 500
            target_path = wav_path
        else:
            target_path = tmp_in.name

        features = extract_features(target_path)

        if os.path.exists(target_path):
            os.remove(target_path)

        if features is None:
            return jsonify({"error": "Помилка при обробці аудіо"}), 500

        preds = model.predict(features)
        idx = int(np.argmax(preds))
        confidence = float(np.max(preds))
        label = CLASS_LABELS[idx]
        aircraft = label

        db = SessionLocal()
        aircraft_obj = db.query(AircraftType).filter(AircraftType.AircraftName == aircraft.lower()).first()
        aircraft_id = aircraft_obj.AircraftTypeID
        print(aircraft_id)

        db.close()

        return jsonify({
            "model": model_key,
            "result": label,
            "confidence": round(confidence * 100, 2),
            "aircraftTypeID": aircraft_id
        })

    except Exception as e:
        logging.exception("Analyze error:")
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            if os.path.exists(tmp_in.name):
                os.remove(tmp_in.name)
        except:
            pass


# ======================= /analyze_stream ==========================
@app.route("/analyze_stream", methods=["POST"])
def analyze_stream():
    if "audio" not in request.files:
        return jsonify({"error": "Не знайдено аудіо"}), 400

    model_key = request.form.get("model", "custom")

    try:
        model = get_model(model_key)
    except Exception as e:
        return jsonify({"error": f"Помилка завантаження моделі: {str(e)}"}), 500

    audio_file = request.files["audio"]

    # Ми тепер очікуємо WAV, тому зберігаємо як .wav без конвертації
    tmp_in = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    audio_file.save(tmp_in.name)
    tmp_in.close()

    try:
        # WAV приходить уже коректний — одразу читаємо його
        features = extract_features(tmp_in.name)

        if features is None:
            return jsonify({"error": "Помилка екстракції ознак"}), 500

        preds = model.predict(features)
        idx = int(np.argmax(preds))
        confidence = float(np.max(preds))
        label = CLASS_LABELS[idx]

        return jsonify({
            "model": model_key,
            "result": label,
            "confidence": round(confidence * 100, 2)
        })

    except Exception:
        logging.exception("Stream processing error:")
        return jsonify({"error": "Помилка обробки"}), 500

    finally:
        if os.path.exists(tmp_in.name):
            os.remove(tmp_in.name)

@app.before_request
def before():
    g.start_time = time.time()
    g.content_length = request.content_length
    register_request()


@app.after_request
def after(response):
    duration_ms = (time.time() - g.start_time) * 1000
    register_request_time(duration_ms, response)
    return response

from services.logging_service import save_recognition_log
from services.files_service import save_uploaded_file   # якщо є
from services.users_service import get_current_user     # твоя авторизація
"""
@app.route("/analyze", methods=["POST"])
def analyze_file():
    from services.files_service import save_uploaded_file
    from services.logging_service import save_recognition_log
    from models.models import Model
    from models.aircraft_types import AircraftType

    user = get_current_user_from_header()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    file = request.files["file"]
    selected_model = request.form.get("model", "custom")

    # --- 1. Зберегти файл ---
    file_id = save_uploaded_file(user.UserID, file)

    # --- 2. Запустити твою нейронну мережу ---
    # Замініть це на твій реальний інференс
    result = run_model_inference(file, selected_model)

    aircraft = result["result"]
    confidence = result["confidence"]
    processing_ms = result["processing_time"]

    # --- 3. Знайти ModelID ---
    db = SessionLocal()
    model_obj = db.query(Model).filter(Model.ModelName == selected_model).first()
    model_id = model_obj.ModelID

    # --- 4. Знайти AircraftTypeID ---
    aircraft_obj = db.query(AircraftType).filter(AircraftType.AircraftName == aircraft.lower()).first()
    aircraft_id = aircraft_obj.AircraftTypeID
    print(aircraft_id)

    db.close()

    # --- 5. Зберегти лог ---
    log_id = save_recognition_log(
        user_id=user.UserID,
        aircraft_type_id=aircraft_id,
        confidence=confidence,
        processing_ms=processing_ms,
        source_type="file"
    )

    return jsonify({
        "result": aircraft,
        "confidence": confidence,
        "processing_time": processing_ms,
        "log_id": log_id
    })
"""
from flask import request, jsonify
from models import RecognitionLog
from db import SessionLocal

@app.route("/api/log", methods=["POST"])
def create_log():
    session = SessionLocal()
    try:
        data = request.json
        print(f"DATA:{data}")
        log = RecognitionLog(
            UserID=data["UserID"],
            AircraftTypeID=data["AircraftTypeID"],
            Confidence=data["Confidence"],
            SourceType=data["SourceType"],
            ProcessingTimeMs=data["ProcessingTimeMs"]
        )
        print(f"USERID:{data["UserID"]}")
        session.add(log)
        session.commit()
        return jsonify({"success": True, "LogID": log.LogID})
    except Exception as e:
        session.rollback()
        return jsonify({"success": False, "error": str(e)})
    finally:
        session.close()

@app.route("/api/models/active", methods=["GET"])
def get_active_models():
    session = SessionLocal()
    try:
        models = session.query(Model).filter(Model.IsActive == 1).all()

        return jsonify([
            {
                "id": m.ModelID,
                "name": m.ModelName,
                "description": m.Description
            }
            for m in models
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# ============= TOGGLE MODEL (приховати/показати) =================
@app.route("/api/models/toggle/<int:model_id>", methods=["PUT"])
def toggle_model(model_id):
    session = SessionLocal()
    try:
        model = session.query(Model).filter(Model.ModelID == model_id).first()
        if not model:
            return jsonify({"error": "Model not found"}), 404

        # Змінити IsActive 1 → 0 або 0 → 1
        model.IsActive = 0 if model.IsActive == 1 else 1
        session.commit()

        return jsonify({
            "success": True,
            "id": model.ModelID,
            "isActive": model.IsActive
        })
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@app.route("/api/models", methods=["GET"])
def get_all_models():
    session = SessionLocal()
    try:
        models = session.query(Model).all()
        return jsonify([
            {
                "id": m.ModelID,
                "name": m.ModelName,
                "description": m.Description,
                "isActive": m.IsActive
            }
            for m in models
        ])
    finally:
        session.close()

# ======================= MAIN ==========================
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)