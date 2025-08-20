import { type JsMsg } from 'nats'
import { handleServiceClosed } from './service-closed'
import { handleTtsCreated } from './tts-created'

export async function processMessage(msg: JsMsg): Promise<void> {
  const subjects = msg.subject.split('.')
  switch (subjects[2]) {
    case 'service-closed':
      handleServiceClosed(msg)
      break
    case 'tts-created':
      handleTtsCreated(msg)
      break
  }
}
