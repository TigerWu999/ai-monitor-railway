/**
 * 資料庫遷移執行腳本（使用 Node.js）
 * 執行方式：node scripts/migrate-database.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 開始執行資料庫遷移...\n');

  // 建立資料庫連線
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // 連接資料庫
    console.log('📊 連接到 Railway PostgreSQL...');
    await client.connect();
    console.log('✅ 已連接到資料庫\n');

    // 讀取 SQL 文件
    const sqlPath = path.join(__dirname, '..', 'migrations', '001_create_multi_tenant_structure.sql');
    console.log(`📄 讀取遷移文件: ${sqlPath}`);

    if (!fs.existsSync(sqlPath)) {
      throw new Error(`遷移文件不存在: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8');
    console.log('✅ 遷移文件已讀取\n');

    // 執行 SQL
    console.log('⚙️  執行 SQL...\n');
    await client.query(sql);
    console.log('✅ SQL 執行成功\n');

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

    // 顯示租戶資料
    console.log('\n📋 租戶列表:');
    const tenants = await client.query('SELECT id, name, domain, status FROM tenants ORDER BY id');
    tenants.rows.forEach(t => {
      console.log(`  [${t.id}] ${t.name} (${t.domain}) - ${t.status}`);
    });

    // 顯示攝影機資料
    console.log('\n📷 攝影機列表:');
    const cameras = await client.query('SELECT id, xcms_camera_id, name, location, status FROM cameras ORDER BY id');
    cameras.rows.forEach(c => {
      console.log(`  [${c.id}] XCMS#${c.xcms_camera_id}: ${c.name} - ${c.location} (${c.status})`);
    });

    // 顯示授權關係
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
      const perms = JSON.parse(a.permissions);
      console.log(`  ${a.tenant_name} → ${a.camera_name} [${perms.join(', ')}]`);
    });

    console.log('\n🎉 完成！資料庫已準備就緒。\n');

  } catch (error) {
    console.error('\n❌ 遷移失敗:', error.message);
    console.error('詳細錯誤:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('📊 資料庫連線已關閉');
  }
}

// 執行遷移
runMigration()
  .then(() => {
    console.log('\n✅ 遷移腳本執行完畢');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 遷移腳本失敗:', error);
    process.exit(1);
  });
