import { connect } from 'nats'
import logger from './logger'
import { NATS_CONSUMER, NATS_SERVERS, NATS_STREAM, NATS_TOKEN } from './config'
import { processMessage } from './consumer'

async function main() {
  const nc = await connect({
    servers: NATS_SERVERS,
    token: NATS_TOKEN,
  })
  const js = nc.jetstream()
  const consumer = await js.consumers.get(NATS_STREAM, NATS_CONSUMER)
  const sub = await consumer.consume({
    callback: processMessage,
  })

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, stopping consumer…`)
    try {
      sub.stop()
      logger.info('Subscription stopped; draining connection…')
      await nc.drain()
      logger.info('NATS connection drained; exiting')
      process.exit(0)
    } catch (err: any) {
      logger.error('Error during shutdown', err)
      process.exit(1)
    }
  }

  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((err) => {
  logger.error('Fatal error in main()', err)
  process.exit(1)
})
