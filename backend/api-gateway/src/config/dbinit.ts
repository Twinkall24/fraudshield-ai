import fs from "fs";
import path from "path";
import pool from "./database";

export const initializeDatabase = async () => {
  try {
    const sqlPath = path.resolve(__dirname, "../../../../database/init.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    await pool.query(sql);

    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
  }
};