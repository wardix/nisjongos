import type { JsMsg } from 'nats'
import { handleProvisPaid } from './provis-paid'
import { handleServiceClosed } from './service-closed'
import { handleTicketSolved } from './ticket-solved'
import { handleTtsCreated } from './tts-created'
import { handleWONusaselecta } from './wo-nusaselecta'

export async function processMessage(msg: JsMsg): Promise<void> {
  const subjects = msg.subject.split('.')
  switch (subjects[2]) {
    case 'service-closed':
      handleServiceClosed(msg)
      break
    case 'tts-created':
      handleTtsCreated(msg)
      break
    case 'ticket-solved':
      handleTicketSolved(msg)
      break
    case 'wo-nusaselecta':
      handleWONusaselecta(msg)
      break
    case 'provis-paid':
    case 'provis-free':
      handleProvisPaid(msg)
      break
  }
}
