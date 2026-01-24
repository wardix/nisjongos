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

export const SQL_GET_IP_BY_ACCOUNT =
  process.env.SQL_GET_IP_BY_ACCOUNT ||
  'SELECT ip_address FROM subscriptions WHERE account = ?'
export const SQL_RECORD_IP_USAGE =
  process.env.SQL_RECORD_IP_USAGE ||
  'INSERT INTO ip_usage (account, ip, created_at) VALUES (?, ?, NOW())'

export const NUSASELECTA_CIDR =
  process.env.NUSASELECTA_CIDR || '192.168.10.0/24'
export const NUSASELECTA_ROUTER_HOST =
  process.env.NUSASELECTA_ROUTER_HOST || 'localhost'
export const NUSASELECTA_ROUTER_PORT = Number(
  process.env.NUSASELECTA_ROUTER_PORT || 22,
)
export const NUSASELECTA_ROUTER_USER =
  process.env.NUSASELECTA_ROUTER_USER || 'admin'
export const NUSASELECTA_ROUTER_PRIVATE_KEY =
  process.env.NUSASELECTA_ROUTER_PRIVATE_KEY || ''
export const NUSASELECTA_CMD_TEMPLATE =
  process.env.NUSASELECTA_CMD_TEMPLATE ||
  '/ip firewall address-list add list=allowed address={ip} comment={account}'
export const NUSASELECTA_BW_PROFILE_MAP = JSON.parse(
  process.env.NUSASELECTA_BW_PROFILE_MAP || '{}',
)
export const NUSASELECTA_DEFAULT_PROFILE =
  process.env.NUSASELECTA_DEFAULT_PROFILE || 'default'
export const SQL_GET_USED_IPS_BY_PREFIX =
  process.env.SQL_GET_USED_IPS_BY_PREFIX ||
  'SELECT ip FROM ip_usage WHERE ip LIKE ?'
