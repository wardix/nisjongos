import { appendFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { PAYLOAD_LOG_ENABLED, PAYLOAD_LOG_FILE } from './config'
import logger from './logger'

let dirEnsured = false

export async function recordIncomingPayload(
  subject: string,
  rawPayload: string,
): Promise<void> {
  if (!PAYLOAD_LOG_ENABLED) {
    return
  }

  try {
    if (!dirEnsured) {
      const dir = dirname(PAYLOAD_LOG_FILE)
      await mkdir(dir, { recursive: true })
      dirEnsured = true
    }

    let payload: unknown
    try {
      payload = JSON.parse(rawPayload)
    } catch {
      payload = rawPayload
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      subject,
      payload,
    }

    await appendFile(PAYLOAD_LOG_FILE, `${JSON.stringify(logEntry)}\n`, 'utf-8')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error('Failed to write payload to jsonl file', { error: message })
  }
}
