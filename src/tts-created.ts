import { StringCodec, type JsMsg } from 'nats'
import logger from './logger'
import { pool } from './database'
import {
  SQL_ESCALATION_TICKET_DETAIL,
  TEMPLATE_MESSAGE_ESCALATION_TICKET,
  ESCALATION_TICKET_PICS,
} from './config'
import { sendNotification } from './notification'

interface Ticket {
  id: number
  contact: string
  subject: string
}

export async function handleTtsCreated(msg: JsMsg) {
  const sc = StringCodec()
  try {
    const payload = JSON.parse(sc.decode(msg.data))
    const [rows] = await pool.execute(SQL_ESCALATION_TICKET_DETAIL, [
      payload.ttsId,
    ])
    const ticket = rows as Ticket[]

    if (ticket.length == 0) {
      msg.ack()
      return
    }

    const template = TEMPLATE_MESSAGE_ESCALATION_TICKET
    const pics = ESCALATION_TICKET_PICS
    ticket.forEach(async ({ id, contact, subject }) => {
      const message = template
        .replace('{id}', String(id))
        .replace('{contact}', contact)
        .replace('{subject}', subject)
      pics.forEach(async (to: string) => {
        await sendNotification({ to, message })
      })
    })
    msg.ack()
  } catch (error: any) {
    logger.error('Error processing tts-created message', {
      error: error.message,
    })
    msg.nak()
  }
}
