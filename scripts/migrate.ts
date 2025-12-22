#!/usr/bin/env tsx

/**
 * 簡單的資料庫遷移工具
 * 執行方式：npx tsx scripts/migrate.ts
 * 或在 Railway: railway run npx tsx scripts/migrate.ts
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('=========================================');
  console.log('📊 資料庫遷移工具');
  console.log('=========================================\n');

  //檢查 DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ 錯誤：DATABASE_URL 環境變數未設置');
    process.exit(1);
  }

  console.log('✓ 資料庫連接字串已設置\n');

  // 建立資料庫連接池
  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    // 測試連接
    console.log('🔌 測試資料庫連接...');
    const testResult = await pool.query('SELECT version()');
    console.log('✓ 資料庫連接成功');
    console.log(`  PostgreSQL版本: ${testResult.rows[0].version.split(' ').slice(0, 2).join(' ')}\n`);

    // 讀取 SQL 遷移檔案
    const sqlPath = path.join(__dirname, '..', 'migrations', '001_create_multi_tenant_structure.sql');
    console.log(`📄 讀取遷移檔案: ${sqlPath}`);

    if (!fs.existsSync(sqlPath)) {
      throw new Error(`遷移檔案不存在: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8');
    console.log('✓ 遷移檔案已讀取\n');

    // 執行遷移
    console.log('⚙️  執行資料庫遷移...\n');
    await pool.query(sql);
    console.log('✅ 遷移執行成功\n');

    // 驗證表格
    console.log('🔍 驗證表格...');
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('tenants', 'cameras', 'camera_authorizations', 'user_tenants')
      ORDER BY table_name;
    `);

    console.log('\n已創建的表格:');
    tables.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // 顯示數據統計
    console.log('\n📊 數據統計:');

    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM tenants) AS tenants,
        (SELECT COUNT(*) FROM cameras) AS cameras,
        (SELECT COUNT(*) FROM camera_authorizations) AS authorizations,
        (SELECT COUNT(*) FROM user_tenants) AS user_tenants;
    `);

    const stat = stats.rows[0];
    console.log(`  - 租戶: ${stat.tenants} 筆`);
    console.log(`  - 攝影機: ${stat.cameras} 筆`);
    console.log(`  - 授權關係: ${stat.authorizations} 筆`);
    console.log(`  - 用戶關聯: ${stat.user_tenants} 筆`);

    // 顯示租戶列表
    console.log('\n📋 租戶列表:');
    const tenants = await pool.query('SELECT id, name, domain, status FROM tenants ORDER BY id');
    tenants.rows.forEach(t => {
      console.log(`  [${t.id}] ${t.name} (${t.domain}) - ${t.status}`);
    });

    // 顯示攝影機列表
    console.log('\n📷 攝影機列表:');
    const cameras = await pool.query('SELECT id, xcms_camera_id, name, location, status FROM cameras ORDER BY id');
    cameras.rows.forEach(c => {
      console.log(`  [${c.id}] XCMS#${c.xcms_camera_id}: ${c.name} - ${c.location} (${c.status})`);
    });

    // 顯示授權關係
    console.log('\n🔗 授權關係:');
    const auths = await pool.query(`
      SELECT
        t.name AS tenant_name,
        c.name AS camera_name,
        ca.permissions
      FROM camera_authorizations ca
      JOIN tenants t ON ca.tenant_id = t.id
      JOIN cameras c ON ca.camera_id = c.id
      ORDER BY t.id, c.id
    `);

    auths.rows.forEach(a => {
      const perms = JSON.parse(a.permissions);
      console.log(`  ${a.tenant_name} → ${a.camera_name} [${perms.join(', ')}]`);
    });

    console.log('\n=========================================');
    console.log('🎉 遷移完成！資料庫已準備就緒');
    console.log('=========================================\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ 遷移失敗:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('📊 資料庫連接已關閉');
  }
}

main();
