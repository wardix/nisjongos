import { connect } from 'nats'
import {
  CONSUMER_FETCH_BATCH_SIZE,
  CONSUMER_FETCH_EXPIRES,
  LOOP_INITIAL_BACKOFF,
  LOOP_MAX_BACKOFF,
  LOOP_MIN_DELAY,
  NATS_CONSUMER,
  NATS_SERVERS,
  NATS_STREAM,
  NATS_TOKEN,
} from './config'
import { processMessage } from './consumer'
import logger from './logger'

async function main() {
  const nc = await connect({
    servers: NATS_SERVERS,
    token: NATS_TOKEN,
  })
  const js = nc.jetstream()
  const consumer = await js.consumers.get(NATS_STREAM, NATS_CONSUMER)

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, draining connection…`)
    try {
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

  let currentBackoff = LOOP_INITIAL_BACKOFF

  while (true) {
    let messageReceived = false
    try {
      const iter = await consumer.fetch({
        max_messages: CONSUMER_FETCH_BATCH_SIZE,
        expires: CONSUMER_FETCH_EXPIRES,
      })
      for await (const m of iter) {
        messageReceived = true
        await processMessage(m)
      }
    } catch (err: any) {
      // Fetch might time out if no messages, which is expected
      if (err.code !== '408' && err.code !== '503') {
        logger.error('Error fetching/processing messages', err)
      }
    }

    if (messageReceived) {
      // Message processed, reset backoff and wait minimal delay
      currentBackoff = LOOP_INITIAL_BACKOFF
      await new Promise((resolve) => setTimeout(resolve, LOOP_MIN_DELAY))
    } else {
      // No message, backoff exponentially
      await new Promise((resolve) => setTimeout(resolve, currentBackoff))
      currentBackoff = Math.min(currentBackoff * 2, LOOP_MAX_BACKOFF)
    }
  }
}

main().catch((err) => {
  logger.error('Fatal error in main()', err)
  process.exit(1)
})
