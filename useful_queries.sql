-- ============================================================================
-- CONSULTAS SQL ÚTILES PARA FINGOL
-- Queries frecuentes para FastAPI + SQLAlchemy
-- ============================================================================

-- ============================================================================
-- 1. QUERIES DE USUARIOS
-- ============================================================================

-- 1.1 Obtener usuario con sus roles
SELECT 
    u.user_id,
    u.email,
    u.full_name,
    u.is_active,
    json_agg(r.role_name) as roles
FROM users u
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.role_id
WHERE u.email = 'usuario@example.com'
GROUP BY u.user_id, u.email, u.full_name, u.is_active;


-- 1.2 Verificar si email existe y está activo
SELECT EXISTS(
    SELECT 1 FROM users 
    WHERE email = 'usuario@example.com' 
    AND is_active = TRUE 
    AND deleted_at IS NULL
) as email_exists;


-- 1.3 Usuario más reciente
SELECT user_id, email, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;


-- 1.4 Actualizar último login
UPDATE users 
SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
RETURNING user_id, email, last_login;


-- 1.5 Contar usuarios activos
SELECT COUNT(*) as active_users 
FROM users 
WHERE is_active = TRUE AND deleted_at IS NULL;


-- 1.6 Usuarios por rol
SELECT 
    r.role_name,
    COUNT(DISTINCT u.user_id) as user_count
FROM users u
INNER JOIN user_roles ur ON u.user_id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.role_id
WHERE u.deleted_at IS NULL
GROUP BY r.role_name
ORDER BY user_count DESC;


-- ============================================================================
-- 2. QUERIES DE METAS FINANCIERAS
-- ============================================================================

-- 2.1 Todas las metas activas de un usuario
SELECT 
    goal_id,
    goal_name,
    target_amount,
    current_amount,
    progress_percentage,
    deadline,
    priority,
    CASE 
        WHEN (deadline - CURRENT_DATE) < 0 THEN 'Vencida'
        WHEN (deadline - CURRENT_DATE) BETWEEN 0 AND 2 THEN 'Próxima'
        ELSE 'En tiempo'
    END as status_time,
    (deadline - CURRENT_DATE) as days_remaining
FROM financial_goals
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND status = 'active'
  AND deleted_at IS NULL
ORDER BY deadline ASC;


-- 2.2 Progreso detallado de una meta
SELECT 
    fg.goal_id,
    fg.goal_name,
    fg.target_amount,
    fg.current_amount,
    fg.progress_percentage,
    COUNT(c.contribution_id) as total_contributions,
    MIN(c.contribution_date) as first_contribution,
    MAX(c.contribution_date) as last_contribution,
    ROUND(AVG(c.amount), 2) as avg_contribution,
    SUM(c.amount) as total_contributed
FROM financial_goals fg
LEFT JOIN contributions c ON fg.goal_id = c.goal_id AND c.deleted_at IS NULL
WHERE fg.goal_id = '550e8400-e29b-41d4-a716-446655440000'
  AND fg.deleted_at IS NULL
GROUP BY fg.goal_id, fg.goal_name, fg.target_amount, fg.current_amount, fg.progress_percentage;


-- 2.3 Metas completadas vs activas
SELECT 
    user_id,
    status,
    COUNT(*) as count,
    SUM(target_amount) as total_target,
    ROUND(AVG(progress_percentage), 2) as avg_progress
FROM financial_goals
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND deleted_at IS NULL
GROUP BY user_id, status
ORDER BY status;


-- 2.4 Top 5 metas con más aportes
SELECT 
    fg.goal_id,
    fg.goal_name,
    COUNT(c.contribution_id) as contribution_count,
    SUM(c.amount) as total_amount,
    ROUND(AVG(c.amount), 2) as avg_amount
FROM financial_goals fg
LEFT JOIN contributions c ON fg.goal_id = c.goal_id AND c.deleted_at IS NULL
WHERE fg.user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND fg.deleted_at IS NULL
GROUP BY fg.goal_id, fg.goal_name
ORDER BY contribution_count DESC
LIMIT 5;


-- 2.5 Metas próximas a vencer (48 horas)
SELECT 
    goal_id,
    user_id,
    goal_name,
    deadline,
    target_amount,
    current_amount,
    progress_percentage,
    (deadline - CURRENT_DATE) as days_until_deadline
FROM financial_goals
WHERE status = 'active'
  AND deleted_at IS NULL
  AND deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '2 days'
ORDER BY deadline ASC;


-- 2.6 Metas vencidas sin completar
SELECT 
    goal_id,
    user_id,
    goal_name,
    deadline,
    target_amount,
    current_amount,
    progress_percentage,
    CURRENT_DATE - deadline as days_overdue
FROM financial_goals
WHERE status = 'active'
  AND deleted_at IS NULL
  AND deadline < CURRENT_DATE
ORDER BY deadline DESC;


-- ============================================================================
-- 3. QUERIES DE APORTES/CONTRIBUCIONES
-- ============================================================================

-- 3.1 Historial de aportes de una meta
SELECT 
    contribution_id,
    amount,
    contribution_date,
    description,
    created_at,
    CAST(
        (SELECT SUM(amount) 
         FROM contributions c2 
         WHERE c2.goal_id = c1.goal_id 
         AND c2.contribution_date <= c1.contribution_date 
         AND c2.deleted_at IS NULL) 
        AS NUMERIC(12,2)) as cumulative_amount
FROM contributions c1
WHERE goal_id = '550e8400-e29b-41d4-a716-446655440000'
  AND deleted_at IS NULL
ORDER BY contribution_date ASC;


-- 3.2 Últimos 10 aportes del usuario
SELECT 
    c.contribution_id,
    c.amount,
    c.contribution_date,
    fg.goal_name,
    c.description
FROM contributions c
INNER JOIN financial_goals fg ON c.goal_id = fg.goal_id
WHERE c.user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND c.deleted_at IS NULL
ORDER BY c.created_at DESC
LIMIT 10;


-- 3.3 Total de aportes por mes
SELECT 
    DATE_TRUNC('month', contribution_date)::DATE as month,
    COUNT(*) as contribution_count,
    SUM(amount) as total_amount,
    ROUND(AVG(amount), 2) as avg_amount
FROM contributions
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND deleted_at IS NULL
GROUP BY DATE_TRUNC('month', contribution_date)
ORDER BY month DESC;


-- ============================================================================
-- 4. QUERIES DE INGRESOS Y GASTOS
-- ============================================================================

-- 4.1 Resumen financiero mensual
SELECT 
    DATE_TRUNC('month', 
        COALESCE(i.income_date, e.expense_date, CURRENT_DATE)
    )::DATE as month,
    COALESCE(SUM(CASE WHEN i.income_id IS NOT NULL THEN i.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN e.expense_id IS NOT NULL THEN e.amount ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN i.income_id IS NOT NULL THEN i.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN e.expense_id IS NOT NULL THEN e.amount ELSE 0 END), 0) as net_saved
FROM income i
FULL OUTER JOIN expenses e ON DATE_TRUNC('month', i.income_date) = DATE_TRUNC('month', e.expense_date)
WHERE i.user_id = '550e8400-e29b-41d4-a716-446655440000'
  OR e.user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND (i.deleted_at IS NULL OR e.deleted_at IS NULL)
GROUP BY month
ORDER BY month DESC;


-- 4.2 Gastos por categoría (mes actual)
SELECT 
    c.category_name,
    COUNT(e.expense_id) as expense_count,
    SUM(e.amount) as total_amount,
    ROUND(SUM(e.amount) * 100.0 / 
        (SELECT SUM(amount) FROM expenses 
         WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
         AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)
         AND deleted_at IS NULL), 2) as percentage
FROM expenses e
INNER JOIN categories c ON e.category_id = c.category_id
WHERE e.user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND DATE_TRUNC('month', e.expense_date) = DATE_TRUNC('month', CURRENT_DATE)
  AND e.deleted_at IS NULL
GROUP BY c.category_name
ORDER BY total_amount DESC;


-- 4.3 Ingresos recurrentes activos
SELECT 
    income_id,
    source,
    amount,
    recurrence_pattern,
    income_date,
    CASE 
        WHEN recurrence_pattern = 'daily' THEN amount * 365
        WHEN recurrence_pattern = 'weekly' THEN amount * 52
        WHEN recurrence_pattern = 'monthly' THEN amount * 12
        WHEN recurrence_pattern = 'yearly' THEN amount
        ELSE 0
    END as annual_equivalent
FROM income
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND is_recurring = TRUE
  AND deleted_at IS NULL
ORDER BY annual_equivalent DESC;


-- 4.4 Gastos recurrentes activos
SELECT 
    expense_id,
    description,
    amount,
    payment_method,
    recurrence_pattern,
    expense_date,
    CASE 
        WHEN recurrence_pattern = 'daily' THEN amount * 365
        WHEN recurrence_pattern = 'weekly' THEN amount * 52
        WHEN recurrence_pattern = 'monthly' THEN amount * 12
        WHEN recurrence_pattern = 'yearly' THEN amount
        ELSE 0
    END as annual_equivalent
FROM expenses
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND is_recurring = TRUE
  AND deleted_at IS NULL
ORDER BY annual_equivalent DESC;


-- 4.5 Top 5 categorías de gasto
SELECT 
    c.category_name,
    COUNT(e.expense_id) as transaction_count,
    SUM(e.amount) as total_amount,
    ROUND(AVG(e.amount), 2) as avg_amount,
    MAX(e.expense_date) as last_transaction
FROM expenses e
INNER JOIN categories c ON e.category_id = c.category_id
WHERE e.user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND e.deleted_at IS NULL
GROUP BY c.category_name
ORDER BY total_amount DESC
LIMIT 5;


-- 4.6 Comparativa ingresos vs gastos (últimos 6 meses)
WITH monthly_data AS (
    SELECT 
        DATE_TRUNC('month', income_date)::DATE as month,
        SUM(amount) as income_total
    FROM income
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
      AND deleted_at IS NULL
    GROUP BY DATE_TRUNC('month', income_date)
    
    UNION ALL
    
    SELECT 
        DATE_TRUNC('month', expense_date)::DATE as month,
        -SUM(amount) as income_total
    FROM expenses
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
      AND deleted_at IS NULL
    GROUP BY DATE_TRUNC('month', expense_date)
)
SELECT 
    month,
    SUM(CASE WHEN income_total > 0 THEN income_total ELSE 0 END) as income,
    SUM(CASE WHEN income_total < 0 THEN -income_total ELSE 0 END) as expenses,
    SUM(income_total) as net
FROM monthly_data
WHERE month >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY month
ORDER BY month DESC;


-- ============================================================================
-- 5. QUERIES DE NOTIFICACIONES
-- ============================================================================

-- 5.1 Notificaciones no leídas del usuario
SELECT 
    notification_id,
    title,
    message,
    notification_type,
    created_at
FROM notifications
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND is_read = FALSE
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;


-- 5.2 Marcar notificaciones como leídas
UPDATE notifications
SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND is_read = FALSE
  AND deleted_at IS NULL
RETURNING notification_id, read_at;


-- 5.3 Contar notificaciones no leídas
SELECT COUNT(*) as unread_count
FROM notifications
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND is_read = FALSE
  AND deleted_at IS NULL;


-- 5.4 Historial de notificaciones paginado
SELECT 
    notification_id,
    title,
    message,
    notification_type,
    is_read,
    created_at
FROM notifications
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;


-- ============================================================================
-- 6. QUERIES DE REPORTES Y ANÁLISIS
-- ============================================================================

-- 6.1 Dashboard general del usuario
WITH goal_summary AS (
    SELECT 
        COUNT(*) as total_goals,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_goals,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_goals,
        SUM(target_amount) as total_target,
        SUM(current_amount) as total_saved,
        ROUND(AVG(progress_percentage), 2) as avg_progress
    FROM financial_goals
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
      AND deleted_at IS NULL
),
financial_summary AS (
    SELECT 
        COALESCE(SUM(CASE WHEN i.income_id IS NOT NULL THEN i.amount ELSE 0 END), 0) as ytd_income,
        COALESCE(SUM(CASE WHEN e.expense_id IS NOT NULL THEN e.amount ELSE 0 END), 0) as ytd_expenses
    FROM income i
    FULL OUTER JOIN expenses e ON 1=1
    WHERE (i.user_id = '550e8400-e29b-41d4-a716-446655440000' OR e.user_id = '550e8400-e29b-41d4-a716-446655440000')
      AND (i.deleted_at IS NULL OR e.deleted_at IS NULL)
      AND EXTRACT(YEAR FROM COALESCE(i.income_date, e.expense_date)) = EXTRACT(YEAR FROM CURRENT_DATE)
)
SELECT 
    gs.total_goals,
    gs.completed_goals,
    gs.active_goals,
    gs.total_target,
    gs.total_saved,
    gs.avg_progress,
    fs.ytd_income,
    fs.ytd_expenses,
    (fs.ytd_income - fs.ytd_expenses) as ytd_net
FROM goal_summary gs, financial_summary fs;


-- 6.2 Análisis de categorías de metas
SELECT 
    c.category_name,
    COUNT(fg.goal_id) as goal_count,
    SUM(fg.target_amount) as total_target,
    SUM(fg.current_amount) as total_saved,
    ROUND(AVG(fg.progress_percentage), 2) as avg_progress
FROM categories c
LEFT JOIN financial_goals fg ON c.category_id = fg.category_id 
    AND fg.user_id = '550e8400-e29b-41d4-a716-446655440000'
    AND fg.deleted_at IS NULL
WHERE c.user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND c.category_type = 'goal'
GROUP BY c.category_name
ORDER BY goal_count DESC;


-- 6.3 Reporte mensual de metas
SELECT 
    DATE_TRUNC('month', c.contribution_date)::DATE as month,
    COUNT(c.contribution_id) as contribution_count,
    SUM(c.amount) as total_contributed,
    COUNT(DISTINCT c.goal_id) as goals_contributed
FROM contributions c
WHERE c.user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND c.deleted_at IS NULL
  AND c.contribution_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', c.contribution_date)
ORDER BY month DESC;


-- ============================================================================
-- 7. QUERIES DE AUDITORÍA
-- ============================================================================

-- 7.1 Últimos cambios del usuario
SELECT 
    log_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    created_at
FROM audit_logs
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC
LIMIT 50;


-- 7.2 Historial de inicios de sesión
SELECT 
    created_at,
    ip_address,
    user_agent
FROM audit_logs
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND action = 'LOGIN'
ORDER BY created_at DESC
LIMIT 20;


-- 7.3 Cambios en tabla específica
SELECT 
    log_id,
    action,
    record_id,
    old_values,
    new_values,
    created_at
FROM audit_logs
WHERE table_name = 'financial_goals'
  AND user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC;


-- ============================================================================
-- 8. QUERIES DE MANTENIMIENTO
-- ============================================================================

-- 8.1 Limpiar registros borrados (soft deletes) de más de 1 año
DELETE FROM contributions 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND deleted_at IS NOT NULL 
  AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '1 year'
  AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '30 days';


-- 8.2 Actualizar estadísticas de tabla
ANALYZE financial_goals;
ANALYZE contributions;
ANALYZE income;
ANALYZE expenses;


-- 8.3 Ver tamaño de tablas
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;


-- 8.4 Verificar índices no usados
SELECT 
    idx.relname as index_name,
    tbl.relname as table_name,
    idx.idx_scan,
    idx.idx_tup_read,
    idx.idx_tup_fetch
FROM pg_index i
INNER JOIN pg_class idx ON i.indexrelid = idx.oid
INNER JOIN pg_class tbl ON i.indrelid = tbl.oid
INNER JOIN pg_stat_user_indexes idx_stat ON idx.oid = idx_stat.indexrelid
WHERE idx.idx_scan = 0
  AND tbl.relname NOT LIKE 'pg_temp%'
ORDER BY pg_relation_size(idx.oid) DESC;


-- 8.5 Slow queries (simulado - requiere log de PostgreSQL habilitado)
-- Habilitar primero en postgresql.conf:
-- log_min_duration_statement = 1000  (registra queries > 1 segundo)


-- ============================================================================
-- 9. EJEMPLOS PARA FASTAPI (SQLAlchemy)
-- ============================================================================

/*
# Ejemplo 1: Obtener usuario con roles
from sqlalchemy import text

result = session.execute(
    text("""
        SELECT u.user_id, u.email, u.full_name, 
               array_agg(r.role_name) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.user_id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.role_id
        WHERE u.email = :email
        AND u.deleted_at IS NULL
        GROUP BY u.user_id, u.email, u.full_name
    """),
    {"email": email}
).fetchone()


# Ejemplo 2: Dashboard con ORM
from sqlalchemy import func

goals = session.query(
    func.count(FinancialGoal.goal_id).label('total_goals'),
    func.count(case([(FinancialGoal.status == 'completed', 1)])).label('completed'),
    func.sum(FinancialGoal.target_amount).label('total_target'),
    func.sum(FinancialGoal.current_amount).label('total_saved')
).filter(
    FinancialGoal.user_id == user_id,
    FinancialGoal.deleted_at.is_(None)
).first()


# Ejemplo 3: Paginación
goals = session.query(FinancialGoal).filter(
    FinancialGoal.user_id == user_id,
    FinancialGoal.deleted_at.is_(None)
).order_by(
    FinancialGoal.deadline.asc()
).offset(0).limit(20).all()


# Ejemplo 4: Transaction con auditoría
from datetime import datetime

try:
    # Actualizar meta
    goal = session.query(FinancialGoal).get(goal_id)
    old_values = {
        'current_amount': float(goal.current_amount),
        'progress_percentage': float(goal.progress_percentage)
    }
    
    goal.current_amount = new_amount
    goal.progress_percentage = (new_amount / goal.target_amount * 100)
    
    # Registrar en auditoría
    log = AuditLog(
        user_id=user_id,
        action='UPDATE',
        table_name='financial_goals',
        record_id=str(goal_id),
        old_values=old_values,
        new_values={
            'current_amount': float(new_amount),
            'progress_percentage': float(goal.progress_percentage)
        }
    )
    
    session.add(log)
    session.commit()
except Exception as e:
    session.rollback()
    raise

*/

-- ============================================================================
-- Fin de consultas SQL útiles para FinGoal
-- ============================================================================
