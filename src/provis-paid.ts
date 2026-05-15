import { type JsMsg, StringCodec } from 'nats'
import logger from './logger'
import { provisionAccount } from './provisioning'

export async function handleProvisPaid(msg: JsMsg) {
  const sc = StringCodec()
  try {
    const payload = JSON.parse(sc.decode(msg.data))
    const { ontUsername: account, ontPassword: password, bandwidth } = payload

    logger.info(`Processing provis-paid for account: ${account}`)

    await provisionAccount({
      account,
      password,
      bandwidth,
    })

    logger.info(`Successfully processed provis-paid for ${account}`)
    msg.ack()
  } catch (error: any) {
    logger.error('Error processing provis-paid message', {
      error: error.message,
    })
    
    if (error.message.includes('CRITICAL: No available IP')) {
      // Clear the blocking message if pool is full to prevent infinite loop
      msg.ack()
      return
    }

    // Nak to retry transient errors (DB, SSH connection)
    msg.nak()
  }
}
