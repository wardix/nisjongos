export const NATS_SERVERS = process.env.NATS_SERVERS || 'nats://localhost:4222'
export const NATS_TOKEN = process.env.NATS_TOKEN || ''
export const NATS_STREAM = process.env.NATS_STREAM || 'EVENTS'
export const NATS_CONSUMER = process.env.NATS_CONSUMER || 'nis'
export const DB_HOST = process.env.DB_HOST || 'localhost'
export const DB_PORT = Number(process.env.DB_PORT || 3306)
export const DB_USER = process.env.DB_USER || 'root'
export const DB_PASSWORD = process.env.DB_PASSWORD || ''
export const DB_NAME = process.env.DB_NAME || 'nis'
export const TEMPLATE_MESSAGE_TERMINATED_SUBSCRIPTION =
  process.env.TEMPLATE_MESSAGE_TERMINATED_SUBSCRIPTION ||
  'Terminated service {id} {description}'
export const SQL_SUBSCRIPTION_DETAIL =
  process.env.SQL_SUBSCRIPTION_DETAIL ||
  'SELECT id, account, description FROM subscriptions WHERE id = ?'
export const NOTIFICATION_API_URL =
  process.env.NOTIFICATION_API_URL ||
  'http://localhost:3001/notification/v2/messages'
export const NOTIFICATION_API_TOKEN =
  process.env.NOTIFICATION_API_TOKEN || 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
export const TERMINATED_SUBSCRIPTION_PICS = JSON.parse(
  process.env.TERMINATED_SUBSCRIPTION_PICS || '[]',
)

export const SQL_ESCALATION_TICKET_DETAIL =
  process.env.SQL_ESCALATION_TICKET_DETAIL ||
  'SELECT id, subject, contact FROM tickets WHERE id = ?'
export const TEMPLATE_MESSAGE_ESCALATION_TICKET =
  process.env.TEMPLATE_MESSAGE_ESCALATION_TICKET ||
  'Escalation ticket created {id} {subject}'
export const TEMPLATE_MESSAGE_ESCALATION_TICKET_SOLVED =
  process.env.TEMPLATE_MESSAGE_ESCALATION_TICKET_SOLVED ||
  'escalation_ticket_solved'
export const ESCALATION_TICKET_PICS = JSON.parse(
  process.env.ESCALATION_TICKET_PICS || '[]',
)

export const NUSACONTACT_MESSAGE_API_URL =
  process.env.NUSACONTACT_MESSAGE_API_URL ||
  'http://localhost:3000/api/messages'
export const NUSACONTACT_API_KEY =
  process.env.NUSACONTACT_API_KEY || 'xxxxxxxxxxxxxxxx'
export const NUSACONTACT_SENDER_ID =
  process.env.NUSACONTACT_SENDER_ID || '6281234567890'
