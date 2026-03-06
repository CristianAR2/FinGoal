"""
Models SQLAlchemy para FinGoal
Base de datos relacional con PostgreSQL
Compatible con FastAPI
"""

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
import uuid as uuid_module

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Date, Numeric,
    ForeignKey, Enum, BigInteger, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


# ============================================================================
# ENUMS
# ============================================================================

class RoleEnum(str, enum.Enum):
    """Enumeración de roles disponibles"""
    ADMIN = "admin"
    USER = "user"
    PREMIUM = "premium"


class CategoryTypeEnum(str, enum.Enum):
    """Tipo de categoría"""
    GOAL = "goal"
    INCOME = "income"
    EXPENSE = "expense"


class GoalStatusEnum(str, enum.Enum):
    """Estado de una meta"""
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PriorityEnum(str, enum.Enum):
    """Prioridad de una meta"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class NotificationTypeEnum(str, enum.Enum):
    """Tipo de notificación"""
    GOAL_DEADLINE_APPROACHING = "goal_deadline_approaching"
    GOAL_COMPLETED = "goal_completed"
    CONTRIBUTION_RECORDED = "contribution_recorded"
    EXPENSE_ALERT = "expense_alert"


class RecurrencePatternEnum(str, enum.Enum):
    """Patrón de recurrencia"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class PaymentMethodEnum(str, enum.Enum):
    """Método de pago"""
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"


class ReportTypeEnum(str, enum.Enum):
    """Tipo de reporte"""
    MONTHLY_SUMMARY = "monthly_summary"
    GOAL_PROGRESS = "goal_progress"
    FINANCIAL_OVERVIEW = "financial_overview"
    CATEGORY_ANALYSIS = "category_analysis"


# ============================================================================
# 1. MODELO: ROLES
# ============================================================================

class Role(Base):
    """Modelo de roles en el sistema"""
    __tablename__ = "roles"

    role_id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    user_roles = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Role {self.role_name}>"


# ============================================================================
# 2. MODELO: USUARIOS
# ============================================================================

class User(Base):
    """Modelo de usuarios"""
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_module.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20))
    date_of_birth = Column(Date)
    is_active = Column(Boolean, default=True, index=True)
    is_email_verified = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime(timezone=True))

    # Relaciones
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    financial_goals = relationship("FinancialGoal", back_populates="user", cascade="all, delete-orphan")
    contributions = relationship("Contribution", back_populates="user", cascade="all, delete-orphan")
    income_records = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

    def __repr__(self):
        return f"<User {self.email}>"

    @property
    def is_premium(self) -> bool:
        """Verificar si el usuario tiene rol premium"""
        return any(ur.role.role_name == RoleEnum.PREMIUM for ur in self.user_roles)

    @property
    def is_admin(self) -> bool:
        """Verificar si el usuario es administrador"""
        return any(ur.role.role_name == RoleEnum.ADMIN for ur in self.user_roles)


# ============================================================================
# 3. MODELO: ASIGNACIÓN DE ROLES A USUARIOS
# ============================================================================

class UserRole(Base):
    """Relación muchos-a-muchos entre usuarios y roles"""
    __tablename__ = "user_roles"

    user_role_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("roles.role_id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relaciones
    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")

    def __repr__(self):
        return f"<UserRole user_id={self.user_id} role_id={self.role_id}>"


# ============================================================================
# 4. MODELO: TOKENS DE RECUPERACIÓN DE CONTRASEÑA
# ============================================================================

class PasswordResetToken(Base):
    """Tokens para recuperación de contraseña"""
    __tablename__ = "password_reset_tokens"

    token_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_module.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    used_at = Column(DateTime(timezone=True))

    # Relaciones
    user = relationship("User", back_populates="password_reset_tokens")

    @property
    def is_valid(self) -> bool:
        """Verificar si el token es válido (no expirado y no usado)"""
        return not self.is_used and self.expires_at > datetime.utcnow()

    def __repr__(self):
        return f"<PasswordResetToken user_id={self.user_id}>"


# ============================================================================
# 5. MODELO: CATEGORÍAS
# ============================================================================

class Category(Base):
    """Categorías para metas, ingresos y gastos"""
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    category_name = Column(String(100), nullable=False)
    category_type = Column(String(20), nullable=False, index=True)  # goal, income, expense
    description = Column(Text)
    color_code = Column(String(7))  # Código hex
    icon_name = Column(String(50))
    is_default = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    user = relationship("User", back_populates="categories")
    financial_goals = relationship("FinancialGoal", back_populates="category")
    income_records = relationship("Income", back_populates="category")
    expenses = relationship("Expense", back_populates="category")

    def __repr__(self):
        return f"<Category {self.category_name}>"


# ============================================================================
# 6. MODELO: METAS DE AHORRO
# ============================================================================

class FinancialGoal(Base):
    """Metas de ahorro de los usuarios"""
    __tablename__ = "financial_goals"

    goal_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_module.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.category_id", ondelete="SET NULL"))
    goal_name = Column(String(255), nullable=False)
    description = Column(Text)
    target_amount = Column(Numeric(12, 2), nullable=False)
    current_amount = Column(Numeric(12, 2), default=0)
    deadline = Column(Date, nullable=False, index=True)
    status = Column(String(20), default=GoalStatusEnum.ACTIVE, index=True)
    priority = Column(String(20), default=PriorityEnum.MEDIUM)
    progress_percentage = Column(Numeric(5, 2), default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True))
    deleted_at = Column(DateTime(timezone=True))

    # Relaciones
    user = relationship("User", back_populates="financial_goals")
    category = relationship("Category", back_populates="financial_goals")
    contributions = relationship("Contribution", back_populates="goal", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="goal", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<FinancialGoal {self.goal_name}>"

    @property
    def is_active(self) -> bool:
        """Verificar si la meta está activa"""
        return self.status == GoalStatusEnum.ACTIVE and self.deleted_at is None

    @property
    def days_remaining(self) -> int:
        """Días restantes para alcanzar la meta"""
        return (self.deadline - date.today()).days

    @property
    def is_deadline_approaching(self) -> bool:
        """Verificar si la meta está a 48 horas o menos de vencer"""
        return 0 <= self.days_remaining <= 2 and self.is_active

    @property
    def is_overdue(self) -> bool:
        """Verificar si la meta está vencida"""
        return self.days_remaining < 0 and self.is_active


# ============================================================================
# 7. MODELO: APORTES/CONTRIBUCIONES
# ============================================================================

class Contribution(Base):
    """Aportes a las metas de ahorro"""
    __tablename__ = "contributions"

    contribution_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_module.uuid4)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("financial_goals.goal_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    contribution_date = Column(Date, nullable=False, index=True)
    description = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime(timezone=True))

    # Relaciones
    goal = relationship("FinancialGoal", back_populates="contributions")
    user = relationship("User", back_populates="contributions")

    def __repr__(self):
        return f"<Contribution goal_id={self.goal_id} amount={self.amount}>"


# ============================================================================
# 8. MODELO: INGRESOS
# ============================================================================

class Income(Base):
    """Ingresos de los usuarios"""
    __tablename__ = "income"

    income_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_module.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.category_id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    income_date = Column(Date, nullable=False, index=True)
    description = Column(String(255))
    source = Column(String(100))
    is_recurring = Column(Boolean, default=False, index=True)
    recurrence_pattern = Column(String(20))  # daily, weekly, monthly, yearly
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime(timezone=True))

    # Relaciones
    user = relationship("User", back_populates="income_records")
    category = relationship("Category", back_populates="income_records")

    def __repr__(self):
        return f"<Income user_id={self.user_id} amount={self.amount}>"


# ============================================================================
# 9. MODELO: GASTOS
# ============================================================================

class Expense(Base):
    """Gastos de los usuarios"""
    __tablename__ = "expenses"

    expense_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_module.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.category_id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    expense_date = Column(Date, nullable=False, index=True)
    description = Column(String(255))
    payment_method = Column(String(50))  # cash, credit_card, debit_card, bank_transfer
    is_recurring = Column(Boolean, default=False, index=True)
    recurrence_pattern = Column(String(20))  # daily, weekly, monthly, yearly
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime(timezone=True))

    # Relaciones
    user = relationship("User", back_populates="expenses")
    category = relationship("Category", back_populates="expenses")

    def __repr__(self):
        return f"<Expense user_id={self.user_id} amount={self.amount}>"


# ============================================================================
# 10. MODELO: NOTIFICACIONES
# ============================================================================

class Notification(Base):
    """Notificaciones del sistema"""
    __tablename__ = "notifications"

    notification_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_module.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("financial_goals.goal_id", ondelete="CASCADE"))
    notification_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    deleted_at = Column(DateTime(timezone=True))

    # Relaciones
    user = relationship("User", back_populates="notifications")
    goal = relationship("FinancialGoal", back_populates="notifications")

    def __repr__(self):
        return f"<Notification user_id={self.user_id} type={self.notification_type}>"


# ============================================================================
# 11. MODELO: REPORTES
# ============================================================================

class Report(Base):
    """Reportes generados para usuarios"""
    __tablename__ = "reports"

    report_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_module.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    report_type = Column(String(50), nullable=False, index=True)
    report_name = Column(String(255), nullable=False)
    file_path = Column(String(500))
    file_size = Column(Integer)
    period_start = Column(Date, index=True)
    period_end = Column(Date)
    total_goals = Column(Integer)
    total_completed_goals = Column(Integer)
    total_income = Column(Numeric(12, 2))
    total_expenses = Column(Numeric(12, 2))
    net_saved = Column(Numeric(12, 2))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    deleted_at = Column(DateTime(timezone=True))

    # Relaciones
    user = relationship("User", back_populates="reports")

    def __repr__(self):
        return f"<Report {self.report_name}>"


# ============================================================================
# 12. MODELO: LOGS DE AUDITORÍA
# ============================================================================

class AuditLog(Base):
    """Registro de auditoría de cambios"""
    __tablename__ = "audit_logs"

    log_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"))
    action = Column(String(100), nullable=False)
    table_name = Column(String(50))
    record_id = Column(String(100))
    old_values = Column(JSONB)
    new_values = Column(JSONB)
    ip_address = Column(INET)
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    # Relaciones
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog action={self.action}>"
