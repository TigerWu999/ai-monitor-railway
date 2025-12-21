/**
 * 資料庫遷移執行腳本
 * 執行方式：npx tsx scripts/run-migrations.ts
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  console.log('🚀 開始執行資料庫遷移...\n');

  const client = await pool.connect();

  try {
    // 讀取 SQL 文件
    const sqlPath = path.join(process.cwd(), 'migrations', '001_create_multi_tenant_structure.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📄 讀取遷移文件:', sqlPath);
    console.log('📊 連接到資料庫:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Railway PostgreSQL');
    console.log('');

    // 執行 SQL
    console.log('⚙️  執行 SQL...\n');
    await client.query(sql);

    console.log('\n✅ 資料庫遷移完成！\n');

    // 驗證表格是否創建成功
    console.log('🔍 驗證表格...');
    const tables = await client.query(`
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

    // 查詢測試數據
    console.log('\n📊 測試數據統計:');

    const tenantsCount = await client.query('SELECT COUNT(*) FROM tenants');
    console.log(`  - 租戶: ${tenantsCount.rows[0].count} 筆`);

    const camerasCount = await client.query('SELECT COUNT(*) FROM cameras');
    console.log(`  - 攝影機: ${camerasCount.rows[0].count} 筆`);

    const authCount = await client.query('SELECT COUNT(*) FROM camera_authorizations');
    console.log(`  - 授權關係: ${authCount.rows[0].count} 筆`);

    // 顯示租戶和攝影機資料
    console.log('\n📋 租戶列表:');
    const tenants = await client.query('SELECT id, name, domain, status FROM tenants ORDER BY id');
    tenants.rows.forEach(t => {
      console.log(`  [${t.id}] ${t.name} (${t.domain}) - ${t.status}`);
    });

    console.log('\n📷 攝影機列表:');
    const cameras = await client.query('SELECT id, xcms_camera_id, name, location, status FROM cameras ORDER BY id');
    cameras.rows.forEach(c => {
      console.log(`  [${c.id}] XCMS#${c.xcms_camera_id}: ${c.name} - ${c.location} (${c.status})`);
    });

    console.log('\n🔗 授權關係:');
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
    auths.rows.forEach(a => {
      const perms = JSON.parse(a.permissions as string);
      console.log(`  ${a.tenant_name} → ${a.camera_name} [${perms.join(', ')}]`);
    });

    console.log('\n🎉 完成！資料庫已準備就緒。\n');

  } catch (error) {
    console.error('\n❌ 遷移失敗:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 執行遷移
runMigrations()
  .then(() => {
    console.log('✅ 遷移腳本執行完畢');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 遷移腳本失敗:', error);
    process.exit(1);
  });
