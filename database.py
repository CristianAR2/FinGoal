"""
Configuración de Base de Datos para FinGoal
FastAPI + SQLAlchemy + PostgreSQL
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/fingol"
)

# ============================================================================
# CREACIÓN DEL ENGINE
# ============================================================================

engine = create_engine(
    DATABASE_URL,
    echo=True,
    pool_size=20,
    max_overflow=40,
    pool_recycle=3600,
    pool_pre_ping=True,
)

# ============================================================================
# SESSION FACTORY
# ============================================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

# ============================================================================
# DEPENDENCY INJECTION PARA FASTAPI
# ============================================================================

def get_db() -> Session:
    """
    Dependency Injection para FastAPI
    
    Uso en endpoints:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        print(f"Database error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


# ============================================================================
# INICIALIZACIÓN DE BD
# ============================================================================

def init_db():
    """
    Crear todas las tablas basadas en los modelos
    """
    from models import Base
    
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Error creating database tables: {str(e)}")
        raise


# ============================================================================
# VERIFICACIÓN DE CONECTIVIDAD
# ============================================================================

def verify_connection() -> bool:
    """
    Verificar que la conexión a la BD funciona
    """
    try:
        with engine.connect() as connection:
            result = connection.execute("SELECT 1")
            print("✅ Database connection verified")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False
