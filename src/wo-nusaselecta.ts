import { type JsMsg, StringCodec } from 'nats'
import logger from './logger'
import { provisionAccount } from './provisioning'

export async function handleWONusaselecta(msg: JsMsg) {
  const sc = StringCodec()
  try {
    const payload = JSON.parse(sc.decode(msg.data))

    if (!payload.provisioningData) {
      logger.error('wo-nusaselecta: missing provisioningData in payload')
      msg.ack()
      return
    }

    const {
      ontUsername: account,
      ontPassword: password,
      paymentStatus,
      bandwidth,
    } = payload.provisioningData

    if (paymentStatus === 'FREE') {
      logger.info(`wo-nusaselecta: FREE account: ${account}`)
      msg.ack()
      return
    }

    logger.info(`Processing wo-nusaselecta for account: ${account}`)

    await provisionAccount({
      account,
      password,
      bandwidth,
    })

    logger.info(`Successfully processed wo-nusaselecta for ${account}`)
    msg.ack()
  } catch (error: any) {
    logger.error('Error processing wo-nusaselecta message', {
      error: error.message,
    })

    if (error.message.includes('CRITICAL: No available IP')) {
      msg.ack()
      return
    }

    msg.nak()
  }
}
