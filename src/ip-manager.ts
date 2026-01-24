import IPCIDR from 'ip-cidr'
import { pool } from './database'
import { SQL_GET_IP_BY_ACCOUNT, SQL_RECORD_IP_USAGE } from './config'
import logger from './logger'

export async function getIpByAccount(
  accountName: string,
): Promise<string | null> {
  try {
    const [rows] = await pool.execute(SQL_GET_IP_BY_ACCOUNT, [accountName])
    const results = rows as any[]
    if (results.length > 0) {
      const firstRow = results[0]
      const keys = Object.keys(firstRow)
      const firstKey = keys[0]
      if (firstKey) {
        return firstRow[firstKey]
      }
    }
    return null
  } catch (error: any) {
    logger.error('Error fetching IP by account', { error: error.message })
    throw error
  }
}

export async function recordIpUsage(
  accountName: string,
  ip: string,
): Promise<void> {
  try {
    await pool.execute(SQL_RECORD_IP_USAGE, [accountName, ip])
    logger.info(`Recorded IP usage for account ${accountName}: ${ip}`)
  } catch (error: any) {
    logger.error('Error recording IP usage', { error: error.message })
    throw error
  }
}

export function findAvailableIp(
  cidrParams: string,
  usedIps: string[],
): string | null {
  const cidr = new IPCIDR(cidrParams)
  const allIps = cidr.toArray()

  if (!allIps) {
    logger.error(`Invalid CIDR: ${cidrParams}`)
    return null
  }

  // Create a Set for faster lookup
  const usedIpSet = new Set(usedIps)

  for (const ip of allIps) {
    if (!usedIpSet.has(ip)) {
      return ip
    }
  }

  return null
}
