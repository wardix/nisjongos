import { type JsMsg, StringCodec } from 'nats'
import {
  NUSACONTACT_SENDER_ID,
  NUSASELECTA_BRANCH_IDS,
  NUSASELECTA_SENDER_ID,
  SQL_ESCALATION_TICKET_DETAIL,
  TEMPLATE_MESSAGE_ESCALATION_TICKET_SOLVED,
  TEMPLATE_MESSAGE_NUSASELECTA_TICKET_SOLVED,
} from './config'
import { pool } from './database'
import logger from './logger'
import { sendMessageTemplate } from './nusacontact'

interface Ticket {
  id: number
  contact: string
  subject: string
  branchId: string | null
}

export function isNusaselectaBranch(branchId: string | null | undefined) {
  if (branchId === null || branchId === undefined) {
    return false
  }
  return NUSASELECTA_BRANCH_IDS.includes(String(branchId).trim())
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
      ticket.length === 0 ||
      !('sendSmsOnTicketSolved' in payload) ||
      !payload.sendSmsOnTicketSolved
    ) {
      msg.ack()
      return
    }

    for (const { contact, branchId } of ticket) {
      const contactDigits = contact.replace(/\D/g, '')
      const safeContact = contactDigits.startsWith('0')
        ? `62${contactDigits.substring(1)}`
        : contactDigits
      const isNusaselecta = isNusaselectaBranch(branchId)
      await sendMessageTemplate(
        safeContact,
        {
          name: isNusaselecta
            ? TEMPLATE_MESSAGE_NUSASELECTA_TICKET_SOLVED
            : TEMPLATE_MESSAGE_ESCALATION_TICKET_SOLVED,
          language: { code: 'id' },
        },
        isNusaselecta ? NUSASELECTA_SENDER_ID : NUSACONTACT_SENDER_ID,
      )
    }
    msg.ack()
  } catch (error: any) {
    logger.error('Error processing ticket-solved message', {
      error: error.message,
    })
    msg.nak()
  }
}
