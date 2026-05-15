import axios from 'axios'
import { NUSACONTACT_API_KEY, NUSACONTACT_MESSAGE_API_URL } from './config'
import logger from './logger'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendMessageTemplate(
  destination: string,
  template: any,
  phoneNumberId: string,
  maxAttempts: number = 8,
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await axios.post(
        `${NUSACONTACT_MESSAGE_API_URL}?phone_number_id=${phoneNumberId}`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: destination,
          type: 'template',
          template,
        },
        {
          headers: {
            'X-Api-Key': NUSACONTACT_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      )
      return
    } catch (err: any) {
      if (err.response?.status === 429) {
        logger.warn(
          `Rate limit hit for ${destination} (attempt ${attempt}). Waiting 1 seconds...`,
        )
        await sleep(1000)
      } else {
        logger.error(err)
        return
      }
    }
  }
}
