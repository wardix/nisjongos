import { type JsMsg, StringCodec } from 'nats'
import {
  SQL_SUBSCRIPTION_DETAIL,
  TEMPLATE_MESSAGE_TERMINATED_SUBSCRIPTION,
  TERMINATED_SUBSCRIPTION_PICS,
} from './config'
import { pool } from './database'
import logger from './logger'
import { sendNotification } from './notification'

interface SubscriptionService {
  id: number
  account: string
  description: string
}

export async function handleServiceClosed(msg: JsMsg) {
  const sc = StringCodec()
  try {
    const payload = JSON.parse(sc.decode(msg.data))
    const [rows] = await pool.execute(SQL_SUBSCRIPTION_DETAIL, [
      payload.customer_service_id,
    ])
    const service = rows as SubscriptionService[]

    if (service.length === 0) {
      msg.ack()
      return
    }

    const template = TEMPLATE_MESSAGE_TERMINATED_SUBSCRIPTION
    const pics = TERMINATED_SUBSCRIPTION_PICS
    service.forEach(async ({ id, account, description }) => {
      const message = template
        .replace('{account}', account)
        .replace('{description}', description)
        .replace('{id}', String(id))
      pics.forEach(async (to: string) => {
        await sendNotification({ to, message })
      })
    })
    msg.ack()
  } catch (error: any) {
    logger.error('Error processing service-closed message', {
      error: error.message,
    })
    msg.nak()
  }
}
