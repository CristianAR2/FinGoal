# Configuración Base de Datos PostgreSQL - FinGoal

## 📋 Tabla de Contenidos

1. [Requisitos](#requisitos)
2. [Instalación de PostgreSQL](#instalación-de-postgresql)
3. [Crear Base de Datos](#crear-base-de-datos)
4. [Ejecutar Schema](#ejecutar-schema)
5. [Configurar SQLAlchemy](#configurar-sqlalchemy)
6. [Pruebas de Conectividad](#pruebas-de-conectividad)
7. [Migraciones con Alembic](#migraciones-con-alembic)

---

## 🖥️ Requisitos

- **PostgreSQL 13+** (se recomienda 15+)
- **Python 3.10+**
- **pip** o **conda**

### Dependencias Python

```bash
pip install sqlalchemy[postgresql]
pip install psycopg2-binary  # Driver de PostgreSQL
pip install alembic          # Migraciones de BD
pip install fastapi
pip install pydantic
pip install python-dotenv    # Variables de entorno
```

---

## 🚀 Instalación de PostgreSQL

### Windows

1. **Descargar instalador:**
   - https://www.postgresql.org/download/windows/

2. **Ejecutar instalador y seguir pasos:**
   ```
   - Aceptar licencia
   - Seleccionar componentes (PostgreSQL Server, pgAdmin, etc.)
   - Elegir directorio de instalación (default: C:\Program Files\PostgreSQL\15)
   - Establecer contraseña para usuario 'postgres'
   - Seleccionar puerto (default: 5432)
   - Locale: Spanish (Spain)
   ```

3. **Verificar instalación:**
   ```bash
   psql --version
   ```

### macOS (Homebrew)

```bash
brew install postgresql@15
brew services start postgresql@15

# Crear usuario postgres
createuser -s postgres
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Verificar servicio
sudo systemctl status postgresql

# Acceder a PostgreSQL
sudo -u postgres psql
```

---

## 🗄️ Crear Base de Datos

### Opción 1: Desde terminal

```bash
# Conectarse como usuario postgres
psql -U postgres

# En el prompt de PostgreSQL:
CREATE DATABASE fingol
    ENCODING 'UTF8'
    LOCALE 'es_ES.UTF-8'
    TEMPLATE template0;

-- Verificar que se creó
\l

-- Conectarse a la BD
\c fingol

-- Ver todas las extensiones instaladas
\dx

-- Salir
\q
```

### Opción 2: Desde .env (FastAPI)

```bash
# .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/fingol
```

---

## 📊 Ejecutar Schema

### Paso 1: Crear tablas y funciones

```bash
# Desde terminal (Windows/Mac)
psql -U postgres -d fingol -f database_schema.sql

# O desde dentro de PostgreSQL
psql -U postgres
\c fingol
\i database_schema.sql
```

### Paso 2: Verificar estructuras creadas

```sql
-- Ver todas las tablas
\dt

-- Ver vistas
\dv

-- Ver funciones
\df

-- Ver índices
\di

-- Ver secuencias
\ds
```

### Paso 3: Insertar roles iniciales

```sql
-- Los roles se creen automáticamente en el schema
-- Verificar que existan:
SELECT * FROM roles;

-- Resultado esperado:
-- | role_id | role_name | description |
-- |---------|-----------|-------------|
-- | 1       | admin     | Administrador del sistema |
-- | 2       | user      | Usuario regular |
-- | 3       | premium   | Usuario con acceso premium |
```

---

## 🔧 Configurar SQLAlchemy

### Paso 1: Crear archivo de configuración

**`database.py`:**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

# URL de conexión
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/fingol"
)

# Motor de SQLAlchemy
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Log de SQL (desactivar en producción)
    pool_size=20,  # Conexiones en pool
    max_overflow=40,  # Conexiones extra permitidas
    pool_pre_ping=True,  # Verificar conexión antes de usarla
    pool_recycle=3600,  # Reciclar conexiones cada hora
)

# Factory de sesiones
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db() -> Session:
    """Dependency para FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Crear tablas (si no existen)
def init_db():
    from models import Base
    Base.metadata.create_all(bind=engine)
```

### Paso 2: Variables de entorno

**`.env`:**

```bash
# Base de datos
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/fingol

# JWT
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]

# Logger
LOG_LEVEL=INFO
```

### Paso 3: Crear conexión desde FastAPI

**`main.py`:**

```python
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import init_db, get_db, engine
from models import Base

# Inicializar FastAPI
app = FastAPI(
    title="FinGoal API",
    description="API para gestión de metas financieras",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear tablas
@app.on_event("startup")
async def startup():
    init_db()
    print("✅ Base de datos inicializada")

@app.get("/")
async def root():
    return {"message": "FinGoal API"}

# Ejemplo de endpoint que usa BD
@app.get("/test-db")
async def test_db(db: Session = Depends(get_db)):
    result = db.execute("SELECT 1").scalar()
    return {"database": "connected", "result": result}
```

---

## 🧪 Pruebas de Conectividad

### Test 1: psql command line

```bash
# Conectarse a la BD
psql -U postgres -d fingol

# Dentro del prompt:
SELECT version();
SELECT current_user;
\dt  # Listar tablas
```

### Test 2: Python

```python
# test_connection.py
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:password@localhost:5432/fingol"

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ Conexión exitosa!")
        print(result.fetchone())
except Exception as e:
    print(f"❌ Error: {e}")
```

Ejecutar:
```bash
python test_connection.py
```

### Test 3: Test de modelo

```python
# test_models.py
from database import SessionLocal
from models import User, Role

db = SessionLocal()

# Ver roles
roles = db.query(Role).all()
print("Roles:")
for role in roles:
    print(f"  - {role.role_name}")

# Crear usuario (test)
from datetime import datetime
new_user = User(
    email="test@example.com",
    username="testuser",
    full_name="Test User",
    password_hash="hashed_password_here"
)
db.add(new_user)
db.commit()
print("✅ Usuario creado exitosamente")

db.close()
```

---

## 🔄 Migraciones con Alembic

### Paso 1: Inicializar Alembic

```bash
alembic init alembic
```

Esto crea:
```
alembic/
├── alembic.ini
├── env.py
├── script.py.mako
└── versions/
```

### Paso 2: Configurar `alembic/env.py`

```python
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
from logging.config import fileConfig
import os
from dotenv import load_dotenv

load_dotenv()

config = context.config
fileConfig(config.config_file_name)

# Importar modelos
from models import Base
target_metadata = Base.metadata

# URL de BD desde .env
config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL"))

def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = os.getenv("DATABASE_URL")

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

run_migrations_online()
```

### Paso 3: Crear primera migración

```bash
alembic revision --autogenerate -m "Initial schema"
```

### Paso 4: Aplicar migraciones

```bash
# Subir todas las migraciones
alembic upgrade head

# Ver historia de migraciones
alembic history

# Revertir última migración
alembic downgrade -1
```

---

## 📝 Procedimiento Completo (Paso a Paso)

### Para configuración inicial:

```bash
# 1. Instalar PostgreSQL (según tu SO)

# 2. Instalar dependencias Python
pip install -r requirements.txt

# 3. Crear archivo .env
cp .env.example .env
# Editar .env con tus credenciales

# 4. Crear BD
createdb fingol  # Si usas línea de comandos

# 5. Ejecutar schema
psql -U postgres -d fingol -f database_schema.sql

# 6. Ejecutar migraciones
alembic upgrade head

# 7. Probar conexión
python test_connection.py

# 8. Iniciar FastAPI
uvicorn main:app --reload
```

---

## 🛡️ Seguridad

### Cambiar contraseña de postgres en producción

```sql
-- Como superusuario postgres
psql -U postgres

ALTER USER postgres WITH PASSWORD 'new_strong_password_here';

-- Crear usuario específico para la aplicación
CREATE USER fingol_user WITH PASSWORD 'app_password_here';

GRANT CONNECT ON DATABASE fingol TO fingol_user;
GRANT USAGE ON SCHEMA public TO fingol_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fingol_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fingol_user;

-- Verificar permisos
\du
\dp
```

### `.env` en producción

✅ Nunca commitear `.env` a Git
```bash
echo ".env" >> .gitignore
```

---

## 🐛 Troubleshooting

### Error: "FATAL: role 'postgres' does not exist"

```bash
# macOS: crear rol postgres
createuser -s postgres
createdb fingol
```

### Error: "Connection refused"

```bash
# Verificar que PostgreSQL está corriendo
# Windows: Comprobar servicios
# macOS: brew services list
# Linux: sudo systemctl status postgresql

# Verificar puerto (default: 5432)
lsof -i :5432
```

### Error: "password authentication failed"

- Verificar credenciales en `.env`
- Resetear contraseña de postgres:
```bash
psql -U postgres
ALTER USER postgres PASSWORD 'new_password';
```

### Error: "database already exists"

```bash
# Eliminar BD y crear nuevamente
dropdb fingol
createdb fingol
psql -U postgres -d fingol -f database_schema.sql
```

---

## 📊 Monitoreo

### Ver conexiones activas

```sql
SELECT 
    pid,
    usename,
    application_name,
    state,
    query
FROM pg_stat_activity
WHERE datname = 'fingol';
```

### Ver tamaño de BD

```sql
SELECT 
    pg_size_pretty(pg_database_size('fingol')) as size;
```

### Backup

```bash
# Crear backup
pg_dump fingol > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql fingol < backup_20240305.sql
```

---

## 📚 Referencias

- [PostgreSQL Oficial](https://www.postgresql.org/docs/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [Alembic Migrations](https://alembic.sqlalchemy.org/)
- [FastAPI + Databases](https://fastapi.tiangolo.com/deployment/concepts/#databases)

---

**¿Necesitas ayuda?** Contacta al equipo de desarrollo.
