"""
Ejemplo de implementación de FastAPI con SQLAlchemy
Endpoints CRUD para FinGoal
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from uuid import UUID
from decimal import Decimal
import os
from dotenv import load_dotenv

# Importar modelos y database
from database import SessionLocal, engine, get_db
from models import (
    Base, User, Role, FinancialGoal, Contribution, 
    Category, Income, Expense, Notification
)

# Cargar variables de entorno
load_dotenv()

# Inicializar FastAPI
app = FastAPI(
    title="FinGoal API",
    description="API REST para gestión de metas financieras",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# EVENTOS DE STARTUP/SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Crear tablas al iniciar la aplicación"""
    Base.metadata.create_all(bind=engine)
    print("✅ Base de datos inicializada")

@app.on_event("shutdown")
async def shutdown_event():
    """Cerrar conexión al apagar la aplicación"""
    print("❌ Aplicación shutdown")

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Verificar que la API y BD están funcionando"""
    try:
        # Test de BD
        result = db.query(User).count()
        return {
            "status": "healthy",
            "database": "connected",
            "users_count": result,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "error",
            "error": str(e)
        }

# ============================================================================
# SCHEMA PYDANTIC (para validación)
# ============================================================================

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class CategoryResponse(BaseModel):
    category_id: int
    category_name: str
    category_type: str
    color_code: Optional[str]

    class Config:
        from_attributes = True

class GoalResponse(BaseModel):
    goal_id: UUID
    goal_name: str
    target_amount: Decimal
    current_amount: Decimal
    progress_percentage: Decimal
    deadline: str
    status: str
    priority: str

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    user_id: UUID
    email: str
    full_name: str
    username: str
    is_email_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class GoalCreate(BaseModel):
    goal_name: str = Field(..., min_length=1, max_length=255)
    target_amount: Decimal = Field(..., gt=0)
    deadline: str  # Formato: "YYYY-MM-DD"
    description: Optional[str] = None
    category_id: Optional[int] = None
    priority: str = "medium"

class ContributionCreate(BaseModel):
    amount: Decimal = Field(..., gt=0)
    contribution_date: str  # Formato: "YYYY-MM-DD"
    description: Optional[str] = None

# ============================================================================
# ENDPOINTS: USUARIOS
# ============================================================================

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID, db: Session = Depends(get_db)):
    """Obtener información del usuario"""
    user = db.query(User).filter(
        User.user_id == user_id,
        User.deleted_at.is_(None)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return user

@app.get("/api/users/{user_id}/roles")
async def get_user_roles(user_id: UUID, db: Session = Depends(get_db)):
    """Obtener roles del usuario"""
    from sqlalchemy import text
    
    result = db.execute(
        text("""
            SELECT r.role_name
            FROM user_roles ur
            INNER JOIN roles r ON ur.role_id = r.role_id
            WHERE ur.user_id = :user_id
        """),
        {"user_id": str(user_id)}
    ).fetchall()
    
    return {"roles": [row[0] for row in result]}

# ============================================================================
# ENDPOINTS: METAS FINANCIERAS
# ============================================================================

@app.get("/api/users/{user_id}/goals", response_model=List[GoalResponse])
async def get_user_goals(
    user_id: UUID,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Obtener todas las metas del usuario (paginado)"""
    goals = db.query(FinancialGoal).filter(
        FinancialGoal.user_id == user_id,
        FinancialGoal.deleted_at.is_(None)
    ).offset(skip).limit(limit).all()
    
    return goals

@app.get("/api/users/{user_id}/goals/active")
async def get_active_goals(user_id: UUID, db: Session = Depends(get_db)):
    """Obtener solo metas activas"""
    goals = db.query(FinancialGoal).filter(
        FinancialGoal.user_id == user_id,
        FinancialGoal.status == "active",
        FinancialGoal.deleted_at.is_(None)
    ).order_by(FinancialGoal.deadline).all()
    
    return {
        "count": len(goals),
        "goals": [
            {
                "goal_id": g.goal_id,
                "goal_name": g.goal_name,
                "target_amount": float(g.target_amount),
                "current_amount": float(g.current_amount),
                "progress_percentage": float(g.progress_percentage),
                "days_remaining": (g.deadline - datetime.today().date()).days,
                "is_deadline_approaching": g.is_deadline_approaching
            }
            for g in goals
        ]
    }

@app.post("/api/users/{user_id}/goals", response_model=GoalResponse)
async def create_goal(
    user_id: UUID,
    goal_data: GoalCreate,
    db: Session = Depends(get_db)
):
    """Crear nueva meta"""
    # Validar que el usuario existe
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Convertir deadline de string a date
    try:
        deadline = datetime.strptime(goal_data.deadline, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido (YYYY-MM-DD)")
    
    # Crear meta
    new_goal = FinancialGoal(
        user_id=user_id,
        category_id=goal_data.category_id,
        goal_name=goal_data.goal_name,
        target_amount=goal_data.target_amount,
        deadline=deadline,
        description=goal_data.description,
        priority=goal_data.priority
    )
    
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    
    return new_goal

@app.get("/api/goals/{goal_id}")
async def get_goal_detail(goal_id: UUID, db: Session = Depends(get_db)):
    """Obtener detalle completo de una meta"""
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.goal_id == goal_id,
        FinancialGoal.deleted_at.is_(None)
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    
    # Contar contribuciones
    contribution_count = db.query(Contribution).filter(
        Contribution.goal_id == goal_id,
        Contribution.deleted_at.is_(None)
    ).count()
    
    return {
        "goal_id": goal.goal_id,
        "goal_name": goal.goal_name,
        "target_amount": float(goal.target_amount),
        "current_amount": float(goal.current_amount),
        "progress_percentage": float(goal.progress_percentage),
        "deadline": goal.deadline.isoformat(),
        "status": goal.status,
        "priority": goal.priority,
        "days_remaining": goal.days_remaining,
        "is_deadline_approaching": goal.is_deadline_approaching,
        "contribution_count": contribution_count,
        "created_at": goal.created_at.isoformat(),
        "category": goal.category.category_name if goal.category else None
    }

# ============================================================================
# ENDPOINTS: APORTES/CONTRIBUCIONES
# ============================================================================

@app.post("/api/goals/{goal_id}/contributions")
async def add_contribution(
    goal_id: UUID,
    contribution_data: ContributionCreate,
    db: Session = Depends(get_db)
):
    """Registrar aporte a una meta"""
    # Validar que la meta existe
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.goal_id == goal_id,
        FinancialGoal.deleted_at.is_(None)
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    
    # Convertir fecha
    try:
        contribution_date = datetime.strptime(
            contribution_data.contribution_date, 
            "%Y-%m-%d"
        ).date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido")
    
    # Crear contribución
    contribution = Contribution(
        goal_id=goal_id,
        user_id=goal.user_id,
        amount=contribution_data.amount,
        contribution_date=contribution_date,
        description=contribution_data.description
    )
    
    db.add(contribution)
    db.commit()
    
    # El trigger actualizará automáticamente el progreso de la meta
    db.refresh(goal)
    
    return {
        "contribution_id": contribution.contribution_id,
        "amount": float(contribution.amount),
        "goal_progress": float(goal.progress_percentage),
        "goal_current_amount": float(goal.current_amount),
        "goal_status": goal.status,
        "message": "Aporte registrado exitosamente"
    }

@app.get("/api/goals/{goal_id}/contributions")
async def get_goal_contributions(
    goal_id: UUID,
    db: Session = Depends(get_db)
):
    """Obtener historial de aportes de una meta"""
    contributions = db.query(Contribution).filter(
        Contribution.goal_id == goal_id,
        Contribution.deleted_at.is_(None)
    ).order_by(Contribution.contribution_date.desc()).all()
    
    return {
        "count": len(contributions),
        "contributions": [
            {
                "contribution_id": c.contribution_id,
                "amount": float(c.amount),
                "date": c.contribution_date.isoformat(),
                "description": c.description,
                "created_at": c.created_at.isoformat()
            }
            for c in contributions
        ]
    }

# ============================================================================
# ENDPOINTS: DASHBOARD
# ============================================================================

@app.get("/api/users/{user_id}/dashboard")
async def get_dashboard(user_id: UUID, db: Session = Depends(get_db)):
    """Dashboard con resumen financiero del usuario"""
    
    # Resumen de metas
    goals_summary = db.query(
        func.count(FinancialGoal.goal_id).label('total'),
        func.count(
            case([(FinancialGoal.status == 'completed', 1)])
        ).label('completed'),
        func.sum(FinancialGoal.target_amount).label('total_target'),
        func.sum(FinancialGoal.current_amount).label('total_saved')
    ).filter(
        FinancialGoal.user_id == user_id,
        FinancialGoal.deleted_at.is_(None)
    ).first()
    
    # Resumen financiero mensual
    from sqlalchemy import case
    
    # Mes actual
    current_month_start = datetime.utcnow().replace(day=1).date()
    
    monthly_income = db.query(
        func.sum(Income.amount).label('total')
    ).filter(
        Income.user_id == user_id,
        Income.income_date >= current_month_start,
        Income.deleted_at.is_(None)
    ).scalar() or 0
    
    monthly_expenses = db.query(
        func.sum(Expense.amount).label('total')
    ).filter(
        Expense.user_id == user_id,
        Expense.expense_date >= current_month_start,
        Expense.deleted_at.is_(None)
    ).scalar() or 0
    
    return {
        "goals": {
            "total": goals_summary.total or 0,
            "completed": goals_summary.completed or 0,
            "active": (goals_summary.total or 0) - (goals_summary.completed or 0),
            "total_target": float(goals_summary.total_target or 0),
            "total_saved": float(goals_summary.total_saved or 0),
            "average_progress": float(
                (goals_summary.total_saved / goals_summary.total_target * 100)
                if goals_summary.total_target and goals_summary.total_target > 0
                else 0
            )
        },
        "monthly": {
            "income": float(monthly_income),
            "expenses": float(monthly_expenses),
            "net": float(monthly_income) - float(monthly_expenses)
        },
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# ENDPOINTS: NOTIFICACIONES
# ============================================================================

@app.get("/api/users/{user_id}/notifications/unread")
async def get_unread_notifications(user_id: UUID, db: Session = Depends(get_db)):
    """Obtener notificaciones no leídas"""
    notifications = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False,
        Notification.deleted_at.is_(None)
    ).order_by(Notification.created_at.desc()).all()
    
    return {
        "count": len(notifications),
        "notifications": [
            {
                "notification_id": n.notification_id,
                "title": n.title,
                "message": n.message,
                "type": n.notification_type,
                "created_at": n.created_at.isoformat()
            }
            for n in notifications
        ]
    }

@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db)
):
    """Marcar notificación como leída"""
    notification = db.query(Notification).filter(
        Notification.notification_id == notification_id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return {"status": "marked as read"}

# ============================================================================
# ENDPOINTS: UTILIDADES
# ============================================================================

@app.get("/api/categories")
async def get_categories(
    category_type: str = None,
    db: Session = Depends(get_db)
):
    """Obtener categorías predefinidas"""
    query = db.query(Category).filter(Category.is_default == True)
    
    if category_type:
        query = query.filter(Category.category_type == category_type)
    
    categories = query.all()
    
    return {
        "count": len(categories),
        "categories": [
            {
                "category_id": c.category_id,
                "category_name": c.category_name,
                "category_type": c.category_type,
                "color_code": c.color_code,
                "icon_name": c.icon_name
            }
            for c in categories
        ]
    }

# ============================================================================
# MANEJO DE ERRORES
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "error": exc.detail,
        "status_code": exc.status_code
    }

# ============================================================================
# EJECUCIÓN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True
    )

"""
Ejecutar con:
    uvicorn main:app --reload

Documentación interactiva:
    http://localhost:8000/api/docs

Ejemplos de uso:

1. Obtener metas activas:
   GET /api/users/{user_id}/goals/active

2. Crear nueva meta:
   POST /api/users/{user_id}/goals
   {
       "goal_name": "Vacaciones",
       "target_amount": 5000,
       "deadline": "2024-12-31",
       "description": "Viaje a Europa",
       "priority": "high"
   }

3. Registrar aporte:
   POST /api/goals/{goal_id}/contributions
   {
       "amount": 500,
       "contribution_date": "2024-03-05",
       "description": "Pago mensual"
   }

4. Obtener dashboard:
   GET /api/users/{user_id}/dashboard

5. Obtener notificaciones no leídas:
   GET /api/users/{user_id}/notifications/unread
"""
