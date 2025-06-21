import mysql from 'mysql2/promise'
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } from './config'

export const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 4,
  queueLimit: 0,
})
