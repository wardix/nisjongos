import {
  NUSASELECTA_BW_PROFILE_MAP,
  NUSASELECTA_CIDR,
  NUSASELECTA_CMD_TEMPLATE,
  NUSASELECTA_DEFAULT_PROFILE,
  NUSASELECTA_ROUTER_HOST,
  NUSASELECTA_ROUTER_PORT,
  NUSASELECTA_ROUTER_PRIVATE_KEY,
  NUSASELECTA_ROUTER_USER,
} from './config'
import {
  findAvailableIp,
  getAllUsedIps,
  getIpByAccount,
  recordIpUsage,
} from './ip-manager'
import logger from './logger'
import { executeRemoteCommand } from './ssh'

export interface ProvisioningOptions {
  account: string
  password?: string
  bandwidth?: string | number
}

/**
 * Handles the core IP provisioning and router configuration logic.
 * This function is idempotent.
 */
export async function provisionAccount({
  account,
  password = '',
  bandwidth,
}: ProvisioningOptions): Promise<string> {
  // 1. Check if IP already exists
  let ip = await getIpByAccount(account)

  if (ip) {
    logger.info(`Account ${account} already has IP: ${ip}`)
  } else {
    // 2. Provision new IP
    const cidrPools = NUSASELECTA_CIDR.split(',').map((c) => c.trim())
    let newIp: string | null = null

    for (const poolCidr of cidrPools) {
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
        break
      }
    }

    if (!newIp) {
      throw new Error(`CRITICAL: No available IP in pools [${NUSASELECTA_CIDR}] for account ${account}`)
    }

    await recordIpUsage(account, newIp)
    ip = newIp
    logger.info(`Allocated new IP ${ip} for account ${account}`)
  }

  // 3. Configure Router
  let profile = NUSASELECTA_DEFAULT_PROFILE
  const bandwidthKey = String(bandwidth)
  if (bandwidth && NUSASELECTA_BW_PROFILE_MAP[bandwidthKey]) {
    profile = NUSASELECTA_BW_PROFILE_MAP[bandwidthKey]
  } else {
    logger.warn(
      `No profile map found for bandwidth: ${bandwidth}, using default: ${profile}`,
    )
  }

  const command = NUSASELECTA_CMD_TEMPLATE.replaceAll('{ip}', ip)
    .replaceAll('{account}', account)
    .replaceAll('{password}', password)
    .replaceAll('{profile}', profile)

  logger.info(`Executing SSH command on ${NUSASELECTA_ROUTER_HOST}: ${command}`)

  const privateKey = NUSASELECTA_ROUTER_PRIVATE_KEY.replace(/\\n/g, '\n')

  try {
    await executeRemoteCommand(
      {
        host: NUSASELECTA_ROUTER_HOST,
        port: NUSASELECTA_ROUTER_PORT,
        username: NUSASELECTA_ROUTER_USER,
        privateKey: privateKey,
      },
      command,
    )
  } catch (sshError: any) {
    logger.warn(`SSH command failed (likely harmless if idempotent): ${sshError.message}`)
  }

  return ip
}
