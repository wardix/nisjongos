import { StringCodec, type JsMsg } from 'nats'
import logger from './logger'
import {
  NUSASELECTA_CIDR,
  NUSASELECTA_CMD_TEMPLATE,
  NUSASELECTA_ROUTER_HOST,
  NUSASELECTA_ROUTER_PASSWORD,
  NUSASELECTA_ROUTER_PORT,
  NUSASELECTA_ROUTER_USER,
} from './config'
import {
  findAvailableIp,
  getAllUsedIps,
  getIpByAccount,
  recordIpUsage,
} from './ip-manager'
import { executeRemoteCommand } from './ssh'

export async function handleWONusaselecta(msg: JsMsg) {
  const sc = StringCodec()
  try {
    const payload = JSON.parse(sc.decode(msg.data))
    const account = payload.account

    if (!account) {
      logger.error('wo-nusaselecta: missing account in payload')
      msg.ack() // Ack to avoid retry loop for bad data
      return
    }

    logger.info(`Processing wo-nusaselecta for account: ${account}`)

    // 1. Check if IP already exists
    let ip = await getIpByAccount(account)

    if (ip) {
      logger.info(`Account ${account} already has IP: ${ip}`)
    } else {
      // 2. Provision new IP
      const cidrPools = NUSASELECTA_CIDR.split(',').map((c) => c.trim())
      let newIp: string | null = null

      for (const poolCidr of cidrPools) {
        // Convert CIDR (e.g., 192.168.10.0/24) to prefix (e.g., 192.168.10.%)
        const cidrParts = poolCidr.split('.')
        if (cidrParts.length < 3) {
          logger.warn(`Skipping invalid CIDR format in pool: ${poolCidr}`)
          continue
        }
        const prefix = `${cidrParts[0]}.${cidrParts[1]}.${cidrParts[2]}.%`

        const usedIps = await getAllUsedIps(prefix)
        const candidateIp = findAvailableIp(poolCidr, usedIps)

        if (candidateIp) {
          newIp = candidateIp
          break // Found an IP, stop searching
        }
      }

      if (!newIp) {
        logger.error(
          `CRITICAL: No available IP in pools [${NUSASELECTA_CIDR}] for account ${account}`,
        )
        // We might want to NAK here with delay, but for now we stop to prevent loops
        // or let it crash to alert ops. Let's NAK without Ack so NATS redelivers?
        // Actually, if pool is full, redelivery won't help immediately.
        // Let's log error and Ack to clear the queue, or Nak if we expect ops to fix it fast.
        // Per plan "Log error & Stop" -> I'll Ack to remove the blocking message.
        msg.ack() 
        return
      }

      await recordIpUsage(account, newIp)
      ip = newIp
      logger.info(`Allocated new IP ${ip} for account ${account}`)
    }

    // 3. Configure Router (Idempotent: running it again ensures state)
    const command = NUSASELECTA_CMD_TEMPLATE.replace('{ip}', ip).replace(
      '{account}',
      account,
    )

    logger.info(`Executing SSH command on ${NUSASELECTA_ROUTER_HOST}: ${command}`)
    
    await executeRemoteCommand(
      {
        host: NUSASELECTA_ROUTER_HOST,
        port: NUSASELECTA_ROUTER_PORT,
        username: NUSASELECTA_ROUTER_USER,
        password: NUSASELECTA_ROUTER_PASSWORD,
      },
      command,
    )

    logger.info(`Successfully processed wo-nusaselecta for ${account}`)
    msg.ack()
  } catch (error: any) {
    logger.error('Error processing wo-nusaselecta message', {
      error: error.message,
    })
    // Nak to retry transient errors (DB, SSH connection)
    msg.nak()
  }
}
