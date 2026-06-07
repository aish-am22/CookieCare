import pg from "pg";
const { Pool } = pg;

async function verifyRLS() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  const userId1 = "test_user_1";
  const userId2 = "test_user_2";

  const client = await pool.connect();
  try {
    console.log("Setting up test data...");
    await client.query("DELETE FROM folders WHERE user_id IN ($1, $2)", [userId1, userId2]);
    await client.query("INSERT INTO users (id, email, name, password_hash, status) VALUES ($1, $2, $3, 'hash', 'APPROVED') ON CONFLICT (email) DO NOTHING", [userId1, "user1@test.com", "User 1"]);
    await client.query("INSERT INTO users (id, email, name, password_hash, status) VALUES ($1, $2, $3, 'hash', 'APPROVED') ON CONFLICT (email) DO NOTHING", [userId2, "user2@test.com", "User 2"]);

    await client.query("INSERT INTO folders (id, name, user_id) VALUES ('f1', 'Folder 1', $1)", [userId1]);
    await client.query("INSERT INTO folders (id, name, user_id) VALUES ('f2', 'Folder 2', $1)", [userId1]);
    await client.query("INSERT INTO folders (id, name, user_id) VALUES ('f3', 'Folder 3', $2)", [userId2]);

    console.log("Verifying User 1 Isolation...");
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [userId1]);
    await client.query("SELECT set_config('app.current_user_role', 'USER', true)");
    const { rows: rows1 } = await client.query("SELECT id, name FROM folders");
    console.log("User 1 see folders:", rows1.map(r => r.name));
    if (rows1.length !== 2 || rows1.some(r => r.id === 'f3')) {
      throw new Error("RLS Isolation FAILED for User 1");
    }
    await client.query("ROLLBACK");

    console.log("Verifying User 2 Isolation...");
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [userId2]);
    await client.query("SELECT set_config('app.current_user_role', 'USER', true)");
    const { rows: rows2 } = await client.query("SELECT id, name FROM folders");
    console.log("User 2 see folders:", rows2.map(r => r.name));
    if (rows2.length !== 1 || rows2[0].id !== 'f3') {
      throw new Error("RLS Isolation FAILED for User 2");
    }
    await client.query("ROLLBACK");

    console.log("Verifying Admin Override...");
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [userId1]);
    await client.query("SELECT set_config('app.current_user_role', 'ADMIN', true)");
    const { rows: rowsAdmin } = await client.query("SELECT id, name FROM folders");
    console.log("Admin see folders count:", rowsAdmin.length);
    if (rowsAdmin.length < 3) {
      throw new Error("RLS Isolation FAILED for Admin Override");
    }
    await client.query("ROLLBACK");

    console.log("RLS Isolation VERIFIED successfully!");
  } finally {
    client.release();
    await pool.end();
  }
}

verifyRLS().catch(err => {
  console.error(err);
  process.exit(1);
});
