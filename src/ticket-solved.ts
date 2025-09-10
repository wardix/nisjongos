import { StringCodec, type JsMsg } from 'nats'
import logger from './logger'
import { pool } from './database'
import {
  SQL_ESCALATION_TICKET_DETAIL,
  TEMPLATE_MESSAGE_ESCALATION_TICKET_SOLVED,
  NUSACONTACT_SENDER_ID,
} from './config'
import { sendMessageTemplate } from './nusacontact'

interface Ticket {
  id: number
  contact: string
  subject: string
}

export async function handleTicketSolved(msg: JsMsg) {
  const sc = StringCodec()
  try {
    const payload = JSON.parse(sc.decode(msg.data))
    const [rows] = await pool.execute(SQL_ESCALATION_TICKET_DETAIL, [
      payload.ticketId,
    ])
    const ticket = rows as Ticket[]

    if (
      ticket.length == 0 ||
      !('sendSmsOnTicketSolved' in payload) ||
      !payload.sendSmsOnTicketSolved
    ) {
      msg.ack()
      return
    }

    ticket.forEach(async ({ contact }) => {
      const contactDigits = contact.replace(/\D/g, '')
      const safeContact = contactDigits.startsWith('0')
        ? `62${contactDigits.substring(1)}`
        : contactDigits
      sendMessageTemplate(
        safeContact,
        {
          name: TEMPLATE_MESSAGE_ESCALATION_TICKET_SOLVED,
          language: { code: 'id' },
        },
        NUSACONTACT_SENDER_ID,
      )
    })
    msg.ack()
  } catch (error: any) {
    logger.error('Error processing ticket-solved message', {
      error: error.message,
    })
    msg.nak()
  }
}
