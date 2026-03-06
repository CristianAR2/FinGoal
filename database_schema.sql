-- ============================================================================
-- FINGOAL - Base de Datos Relacional
-- Sistema: FastAPI + PostgreSQL + SQLAlchemy
-- Normalización: 3NF (Tercera Forma Normal)
-- ============================================================================

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLA: ROLES (Catálogo de roles)
-- ============================================================================
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles iniciales
INSERT INTO roles (role_name, description) VALUES
    ('admin', 'Administrador del sistema'),
    ('user', 'Usuario regular'),
    ('premium', 'Usuario con acceso premium');

-- ============================================================================
-- 2. TABLA: USUARIOS
-- ============================================================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para usuarios
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- 3. TABLA: ASIGNACIÓN DE ROLES A USUARIOS
-- ============================================================================
CREATE TABLE user_roles (
    user_role_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Índices para relación usuario-rol
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- ============================================================================
-- 4. TABLA: TOKENS DE RECUPERACIÓN DE CONTRASEÑA
-- ============================================================================
CREATE TABLE password_reset_tokens (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Índices para tokens de recuperación
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- ============================================================================
-- 5. TABLA: CATEGORÍAS
-- Catálogo para metas, ingresos y gastos
-- ============================================================================
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL,
    category_type VARCHAR(20) NOT NULL, -- 'goal', 'income', 'expense'
    description TEXT,
    color_code VARCHAR(7), -- Código hex para UI
    icon_name VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_name, category_type)
);

-- Índices para categorías
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(category_type);
CREATE INDEX idx_categories_is_default ON categories(is_default);

-- ============================================================================
-- 6. TABLA: METAS DE AHORRO
-- ============================================================================
CREATE TABLE financial_goals (
    goal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    goal_name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(12, 2) DEFAULT 0 CHECK (current_amount >= 0),
    deadline DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para metas
CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX idx_financial_goals_category_id ON financial_goals(category_id);
CREATE INDEX idx_financial_goals_status ON financial_goals(status);
CREATE INDEX idx_financial_goals_deadline ON financial_goals(deadline);
CREATE INDEX idx_financial_goals_created_at ON financial_goals(created_at DESC);

-- ============================================================================
-- 7. TABLA: APORTES/CONTRIBUCIONES A METAS
-- ============================================================================
CREATE TABLE contributions (
    contribution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES financial_goals(goal_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    contribution_date DATE NOT NULL,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para aportes
CREATE INDEX idx_contributions_goal_id ON contributions(goal_id);
CREATE INDEX idx_contributions_user_id ON contributions(user_id);
CREATE INDEX idx_contributions_contribution_date ON contributions(contribution_date);
CREATE INDEX idx_contributions_created_at ON contributions(created_at DESC);

-- ============================================================================
-- 8. TABLA: INGRESOS
-- ============================================================================
CREATE TABLE income (
    income_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    income_date DATE NOT NULL,
    description VARCHAR(255),
    source VARCHAR(100),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'yearly'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para ingresos
CREATE INDEX idx_income_user_id ON income(user_id);
CREATE INDEX idx_income_category_id ON income(category_id);
CREATE INDEX idx_income_income_date ON income(income_date);
CREATE INDEX idx_income_is_recurring ON income(is_recurring);
CREATE INDEX idx_income_created_at ON income(created_at DESC);

-- ============================================================================
-- 9. TABLA: GASTOS
-- ============================================================================
CREATE TABLE expenses (
    expense_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    description VARCHAR(255),
    payment_method VARCHAR(50), -- 'cash', 'credit_card', 'debit_card', 'bank_transfer'
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'yearly'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para gastos
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_is_recurring ON expenses(is_recurring);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);

-- ============================================================================
-- 10. TABLA: NOTIFICACIONES
-- ============================================================================
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    goal_id UUID REFERENCES financial_goals(goal_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'goal_deadline_approaching', 'goal_completed', 'contribution_recorded'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para notificaciones
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_goal_id ON notifications(goal_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- 11. TABLA: REPORTES GENERADOS
-- ============================================================================
CREATE TABLE reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- 'monthly_summary', 'goal_progress', 'financial_overview'
    report_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    period_start DATE,
    period_end DATE,
    total_goals INTEGER,
    total_completed_goals INTEGER,
    total_income DECIMAL(12, 2),
    total_expenses DECIMAL(12, 2),
    net_saved DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para reportes
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_report_type ON reports(report_type);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_period_start ON reports(period_start);

-- ============================================================================
-- 12. TABLA: LOGS DE AUDITORÍA
-- ============================================================================
CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para logs de auditoría
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista: Resumen de metas por usuario
CREATE OR REPLACE VIEW vw_goals_summary AS
SELECT 
    u.user_id,
    u.full_name,
    COUNT(fg.goal_id) as total_goals,
    COUNT(CASE WHEN fg.status = 'completed' THEN 1 END) as completed_goals,
    COUNT(CASE WHEN fg.status = 'active' THEN 1 END) as active_goals,
    SUM(fg.target_amount) as total_target_amount,
    SUM(fg.current_amount) as total_current_amount,
    ROUND(AVG(fg.progress_percentage), 2) as avg_progress
FROM users u
LEFT JOIN financial_goals fg ON u.user_id = fg.user_id AND fg.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.user_id, u.full_name;

-- Vista: Resumen financiero por usuario (mes actual)
CREATE OR REPLACE VIEW vw_monthly_financial_summary AS
SELECT 
    u.user_id,
    u.full_name,
    DATE_TRUNC('month', CURRENT_DATE)::DATE as month,
    COALESCE(SUM(CASE WHEN i.income_date >= DATE_TRUNC('month', CURRENT_DATE)::DATE 
                       THEN i.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN e.expense_date >= DATE_TRUNC('month', CURRENT_DATE)::DATE 
                       THEN e.amount ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN c.created_at >= DATE_TRUNC('month', CURRENT_DATE)::DATE 
                       THEN c.amount ELSE 0 END), 0) as total_contributions
FROM users u
LEFT JOIN income i ON u.user_id = i.user_id AND i.deleted_at IS NULL
LEFT JOIN expenses e ON u.user_id = e.user_id AND e.deleted_at IS NULL
LEFT JOIN contributions c ON u.user_id = c.user_id AND c.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.user_id, u.full_name;

-- Vista: Metas próximas a vencer (próximos 48hs)
CREATE OR REPLACE VIEW vw_goals_deadline_approaching AS
SELECT 
    goal_id,
    user_id,
    goal_name,
    deadline,
    target_amount,
    current_amount,
    progress_percentage,
    CURRENT_DATE - deadline as days_until_deadline
FROM financial_goals
WHERE status = 'active'
  AND deleted_at IS NULL
  AND deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '2 days'
ORDER BY deadline ASC;

-- ============================================================================
-- FUNCIÓN: Actualizar progreso de meta
-- ============================================================================
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE financial_goals
    SET 
        current_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM contributions
            WHERE goal_id = NEW.goal_id AND deleted_at IS NULL
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE goal_id = NEW.goal_id;
    
    -- Recalcular porcentaje
    UPDATE financial_goals
    SET progress_percentage = CASE
        WHEN target_amount > 0 THEN ROUND((current_amount / target_amount) * 100, 2)
        ELSE 0
    END,
    status = CASE
        WHEN current_amount >= target_amount THEN 'completed'
        WHEN status = 'completed' THEN 'completed'
        ELSE 'active'
    END,
    completed_at = CASE
        WHEN current_amount >= target_amount AND status != 'completed' THEN CURRENT_TIMESTAMP
        ELSE completed_at
    END
    WHERE goal_id = NEW.goal_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar progreso al registrar aporte
CREATE TRIGGER trg_update_goal_progress_on_contribution
AFTER INSERT OR UPDATE ON contributions
FOR EACH ROW
EXECUTE FUNCTION update_goal_progress();

-- ============================================================================
-- FUNCIÓN: Generar notificaciones de metas próximas a vencer
-- ============================================================================
CREATE OR REPLACE FUNCTION check_upcoming_goal_deadlines()
RETURNS TABLE(user_id UUID, goal_id UUID, goal_name VARCHAR, days_remaining INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fg.user_id,
        fg.goal_id,
        fg.goal_name,
        (deadline - CURRENT_DATE)::INTEGER as days_remaining
    FROM financial_goals fg
    WHERE fg.status = 'active'
      AND fg.deleted_at IS NULL
      AND (fg.deadline - CURRENT_DATE) BETWEEN 0 AND 2
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.goal_id = fg.goal_id
          AND n.notification_type = 'goal_deadline_approaching'
          AND n.created_at::DATE = CURRENT_DATE
      );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTARIOS SOBRE TABLAS
-- ============================================================================
COMMENT ON TABLE users IS 'Tabla principal de usuarios del sistema';
COMMENT ON TABLE financial_goals IS 'Metas de ahorro de los usuarios';
COMMENT ON TABLE contributions IS 'Aportes/contribuciones a las metas';
COMMENT ON TABLE income IS 'Ingresos registrados por los usuarios';
COMMENT ON TABLE expenses IS 'Gastos registrados por los usuarios';
COMMENT ON TABLE categories IS 'Categorías para metas, ingresos y gastos';
COMMENT ON TABLE notifications IS 'Notificaciones del sistema para usuarios';
COMMENT ON TABLE audit_logs IS 'Registro de auditoría de cambios en el sistema';
COMMENT ON COLUMN users.password_hash IS 'Hash de contraseña (nunca almacenar en texto plano)';
COMMENT ON COLUMN financial_goals.progress_percentage IS 'Calculado automáticamente (current_amount / target_amount * 100)';
COMMENT ON COLUMN contributions.goal_id IS 'Aporte está vinculado a una meta específica';
