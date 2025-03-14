import mysql from "mysql2/promise";

let pool;

export const createConnection = async () => {
  if (!pool) {
    try {
      const requiredEnv = [
        "DATABASE_HOST",
        "DATABASE_USER",
        "DATABASE_PASSWORD",
        "DATABASE_NAME",
      ];
      requiredEnv.forEach((envVar) => {
        if (!process.env[envVar]) {
          throw new Error(`Missing environment variable: ${envVar}`);
        }
      });

      pool = mysql.createPool({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        waitForConnections: true,
        connectionLimit: 30, // Limits simultaneous connections
        queueLimit: 0, // No limit on connection queue
      });

      console.log("Database connection established successfully.");
    } catch (error) {
      console.error("Database connection failed:", error.message);
      throw error;
    }
  }
  return pool;
};
