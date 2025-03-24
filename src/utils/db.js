import mysql from "mysql2/promise";

const requiredEnv = [
  "DATABASE_HOST",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
  "DATABASE_NAME",
];

// Ensure all required environment variables exist
requiredEnv.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing environment variable: ${envVar}`);
  }
});

// Create the pool once and reuse it
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 30, // Maximum simultaneous connections
  queueLimit: 0, // No limit on queueing requests
});

// Function to get a single connection from the pool
export const getConnection = async () => {
  return pool.getConnection(); // Fetch a connection from the pool
};

export { pool };
