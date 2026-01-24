import { type JsMsg } from 'nats'
import { handleServiceClosed } from './service-closed'
import { handleTtsCreated } from './tts-created'
import { handleTicketSolved } from './ticket-solved'
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
  }
}
