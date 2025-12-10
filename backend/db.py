import os
from urllib.parse import quote_plus
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

# -------------------------
# Конфігурація сервера
# -------------------------
DB_SERVER = r"DESKTOP-7N0DQQ2"   # твій сервер
DB_NAME = "AcousticRecognitionDB"

# Windows Authentication + TrustServerCertificate
odbc_str = (
    r"DRIVER={ODBC Driver 17 for SQL Server};"
    f"SERVER={DB_SERVER};"
    f"DATABASE={DB_NAME};"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
)

# Конвертуємо рядок ODBC у формат для SQLAlchemy
odbc_conn_url = "mssql+pyodbc:///?odbc_connect={}".format(quote_plus(odbc_str))

# Створюємо SQLAlchemy engine
engine = create_engine(odbc_conn_url, echo=True, fast_executemany=True)

# Створюємо сесію
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовий клас для моделей
Base = declarative_base()

# ---- Функція тесту підключення ----
def test_connection():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("DB connection OK:", result.fetchone())
    except Exception as e:
        print("DB connection FAILED:", e)

def get_db_session():
    return SessionLocal()

# Запуск тесту при запуску файлу напряму
if __name__ == "__main__":
    test_connection()
