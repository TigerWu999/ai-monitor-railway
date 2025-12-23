/**
 * PostgreSQL 資料庫連接層
 * Database Connection Layer
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// 建立連接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
  idleTimeoutMillis: 30000,
});

// 測試連接
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

/**
 * 執行查詢
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Query executed', { text, duration, rows: result.rowCount });
    }

    return result;
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
}

/**
 * 獲取連接客戶端（用於事務）
 */
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

/**
 * 執行事務
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 關閉連接池（通常不需要，除非應用程序關閉）
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

// ========== 租戶相關查詢 ==========

/**
 * 獲取所有租戶
 */
export async function getTenants() {
  const result = await query(
    'SELECT * FROM tenants WHERE status = $1 ORDER BY created_at DESC',
    ['active']
  );
  return result.rows;
}

/**
 * 根據 domain 獲取租戶
 */
export async function getTenantByDomain(domain: string) {
  const result = await query(
    'SELECT * FROM tenants WHERE domain = $1 AND status = $2',
    [domain, 'active']
  );
  return result.rows[0] || null;
}

/**
 * 根據 ID 獲取租戶
 */
export async function getTenantById(tenantId: number) {
  const result = await query(
    'SELECT * FROM tenants WHERE id = $1',
    [tenantId]
  );
  return result.rows[0] || null;
}

// ========== 攝影機相關查詢 ==========

/**
 * 獲取所有攝影機
 */
export async function getAllCameras() {
  const result = await query(
    'SELECT * FROM cameras ORDER BY id ASC'
  );
  return result.rows;
}

/**
 * 根據租戶 ID 獲取被授權的攝影機
 */
export async function getCamerasByTenant(tenantId: number) {
  const result = await query(`
    SELECT
      c.*,
      ca.permissions,
      ca.expires_at,
      ca.authorized_at
    FROM cameras c
    JOIN camera_authorizations ca ON c.id = ca.camera_id
    WHERE ca.tenant_id = $1
      AND (ca.expires_at IS NULL OR ca.expires_at > NOW())
    ORDER BY c.id ASC
  `, [tenantId]);

  return result.rows;
}

/**
 * 根據 XCMS 攝影機 ID 獲取攝影機
 */
export async function getCameraByXcmsId(xcmsCameraId: number) {
  const result = await query(
    'SELECT * FROM cameras WHERE xcms_camera_id = $1',
    [xcmsCameraId]
  );
  return result.rows[0] || null;
}

/**
 * 創建或更新攝影機
 */
export async function upsertCamera(data: {
  xcmsCameraId: number;
  name: string;
  location?: string;
  status?: string;
  metadata?: any;
}) {
  const result = await query(`
    INSERT INTO cameras (xcms_camera_id, name, location, status, metadata)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (xcms_camera_id)
    DO UPDATE SET
      name = EXCLUDED.name,
      location = EXCLUDED.location,
      status = EXCLUDED.status,
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
    RETURNING *
  `, [
    data.xcmsCameraId,
    data.name,
    data.location || null,
    data.status || 'online',
    data.metadata || {}
  ]);

  return result.rows[0];
}

// ========== 授權相關查詢 ==========

/**
 * 創建攝影機授權
 */
export async function createAuthorization(data: {
  cameraId: number;
  tenantId: number;
  permissions?: string[];
  expiresAt?: Date | null;
}) {
  const result = await query(`
    INSERT INTO camera_authorizations (camera_id, tenant_id, permissions, expires_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (camera_id, tenant_id)
    DO UPDATE SET
      permissions = EXCLUDED.permissions,
      expires_at = EXCLUDED.expires_at
    RETURNING *
  `, [
    data.cameraId,
    data.tenantId,
    JSON.stringify(data.permissions || ['view']),
    data.expiresAt || null
  ]);

  return result.rows[0];
}

/**
 * 刪除授權
 */
export async function deleteAuthorization(cameraId: number, tenantId: number) {
  const result = await query(
    'DELETE FROM camera_authorizations WHERE camera_id = $1 AND tenant_id = $2 RETURNING *',
    [cameraId, tenantId]
  );
  return result.rows[0] || null;
}

/**
 * 獲取租戶的所有授權
 */
export async function getAuthorizationsByTenant(tenantId: number) {
  const result = await query(`
    SELECT
      ca.*,
      c.name AS camera_name,
      c.xcms_camera_id,
      c.location,
      c.status
    FROM camera_authorizations ca
    JOIN cameras c ON ca.camera_id = c.id
    WHERE ca.tenant_id = $1
    ORDER BY ca.authorized_at DESC
  `, [tenantId]);

  return result.rows;
}

/**
 * 檢查租戶是否有權限訪問特定攝影機
 */
export async function checkCameraAccess(
  tenantId: number,
  xcmsCameraId: number,
  requiredPermission: string = 'view'
): Promise<boolean> {
  const result = await query(`
    SELECT 1
    FROM camera_authorizations ca
    JOIN cameras c ON ca.camera_id = c.id
    WHERE ca.tenant_id = $1
      AND c.xcms_camera_id = $2
      AND (ca.expires_at IS NULL OR ca.expires_at > NOW())
      AND ca.permissions::jsonb ? $3
    LIMIT 1
  `, [tenantId, xcmsCameraId, requiredPermission]);

  return (result.rowCount ?? 0) > 0;
}

// ========== 用戶租戶關聯 ==========

/**
 * 獲取用戶的租戶列表
 */
export async function getUserTenants(userId: number) {
  const result = await query(`
    SELECT
      t.*,
      ut.role
    FROM user_tenants ut
    JOIN tenants t ON ut.tenant_id = t.id
    WHERE ut.user_id = $1 AND t.status = 'active'
    ORDER BY t.name ASC
  `, [userId]);

  return result.rows;
}

/**
 * 檢查用戶是否屬於租戶
 */
export async function checkUserTenant(userId: number, tenantId: number): Promise<boolean> {
  const result = await query(
    'SELECT 1 FROM user_tenants WHERE user_id = $1 AND tenant_id = $2 LIMIT 1',
    [userId, tenantId]
  );
  return (result.rowCount ?? 0) > 0;
}

export default pool;
