/**
 * 資料庫遷移 API
 * 部署到 Railway 後訪問此 API 來執行遷移
 * GET /api/admin/migrate
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(request: NextRequest) {
  // ⚠️ 暫時禁用授權檢查，方便初次遷移
  // TODO: 遷移完成後應該重新啟用授權檢查

  // const authHeader = request.headers.get('authorization');
  // const expectedAuth = `Bearer ${process.env.ADMIN_SECRET || 'migration-secret-key'}`;
  // if (authHeader !== expectedAuth) {
  //   return NextResponse.json({
  //     error: 'Unauthorized',
  //     message: '請在 header 中提供正確的 Authorization: Bearer <secret>'
  //   }, { status: 401 });
  // }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const logs: string[] = [];
  const log = (message: string) => {
    console.log(message);
    logs.push(message);
  };

  try {
    log('🚀 開始執行資料庫遷移...');

    const client = await pool.connect();

    try {
      // 讀取 SQL 文件
      const sqlPath = path.join(process.cwd(), 'migrations', '001_create_multi_tenant_structure.sql');

      if (!fs.existsSync(sqlPath)) {
        throw new Error(`遷移文件不存在: ${sqlPath}`);
      }

      const sql = fs.readFileSync(sqlPath, 'utf-8');
      log(`📄 讀取遷移文件: ${sqlPath}`);
      log(`📊 連接到資料庫: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Railway PostgreSQL'}`);

      // 執行 SQL
      log('⚙️  執行 SQL...');
      await client.query(sql);
      log('✅ SQL 執行成功');

      // 驗證表格
      log('🔍 驗證表格...');
      const tables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('tenants', 'cameras', 'camera_authorizations', 'user_tenants')
        ORDER BY table_name;
      `);

      log(`✓ 已創建 ${tables.rowCount} 個表格:`);
      tables.rows.forEach(row => {
        log(`  - ${row.table_name}`);
      });

      // 查詢測試數據
      const tenantsCount = await client.query('SELECT COUNT(*) FROM tenants');
      const camerasCount = await client.query('SELECT COUNT(*) FROM cameras');
      const authCount = await client.query('SELECT COUNT(*) FROM camera_authorizations');

      log('📊 測試數據統計:');
      log(`  - 租戶: ${tenantsCount.rows[0].count} 筆`);
      log(`  - 攝影機: ${camerasCount.rows[0].count} 筆`);
      log(`  - 授權關係: ${authCount.rows[0].count} 筆`);

      // 顯示詳細資料
      const tenants = await client.query('SELECT id, name, domain, status FROM tenants ORDER BY id');
      log('📋 租戶列表:');
      tenants.rows.forEach(t => {
        log(`  [${t.id}] ${t.name} (${t.domain}) - ${t.status}`);
      });

      const cameras = await client.query('SELECT id, xcms_camera_id, name, location, status FROM cameras ORDER BY id');
      log('📷 攝影機列表:');
      cameras.rows.forEach(c => {
        log(`  [${c.id}] XCMS#${c.xcms_camera_id}: ${c.name} - ${c.location} (${c.status})`);
      });

      const auths = await client.query(`
        SELECT
          t.name AS tenant_name,
          c.name AS camera_name,
          ca.permissions
        FROM camera_authorizations ca
        JOIN tenants t ON ca.tenant_id = t.id
        JOIN cameras c ON ca.camera_id = c.id
        ORDER BY t.id, c.id
      `);
      log('🔗 授權關係:');
      auths.rows.forEach(a => {
        const perms = JSON.parse(a.permissions as string);
        log(`  ${a.tenant_name} → ${a.camera_name} [${perms.join(', ')}]`);
      });

      log('🎉 完成！資料庫已準備就緒。');

      return NextResponse.json({
        success: true,
        message: '資料庫遷移成功',
        stats: {
          tenants: parseInt(tenantsCount.rows[0].count),
          cameras: parseInt(camerasCount.rows[0].count),
          authorizations: parseInt(authCount.rows[0].count),
        },
        logs,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`❌ 遷移失敗: ${errorMessage}`);

    return NextResponse.json({
      success: false,
      error: errorMessage,
      logs,
    }, { status: 500 });

  } finally {
    await pool.end();
  }
}
