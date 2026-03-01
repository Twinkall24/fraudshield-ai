import fs from "fs";
import path from "path";
import pool from "./database";

export const initializeDatabase = async () => {
  try {
    // Check if tables already exist
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (checkResult.rows[0].exists) {
      console.log('✅ Database tables already initialized. Skipping init script.');
      return;
    }

    const sqlPath = path.resolve(__dirname, "../../../../database/init.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    await pool.query(sql);

    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
  }
};