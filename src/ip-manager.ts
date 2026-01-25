import IPCIDR from 'ip-cidr'
import {
  SQL_GET_IP_BY_ACCOUNT,
  SQL_GET_USED_IPS_BY_PREFIX,
  SQL_RECORD_IP_USAGE,
} from './config'
import { pool } from './database'
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
    await pool.execute(SQL_RECORD_IP_USAGE, [ip, accountName])
    logger.info(`Recorded IP usage for account ${accountName}: ${ip}`)
  } catch (error: any) {
    logger.error('Error recording IP usage', { error: error.message })
    throw error
  }
}

export async function getAllUsedIps(cidrPrefix: string): Promise<string[]> {
  try {
    const [rows] = await pool.execute(SQL_GET_USED_IPS_BY_PREFIX, [cidrPrefix])
    const results = rows as any[]
    if (results.length > 0) {
      // Assuming 'ip' is the column name, or taking the first column
      return results
        .map((row) => {
          const keys = Object.keys(row)
          const firstKey = keys[0]
          if (firstKey) {
            return row[firstKey]
          }
          return null
        })
        .filter((ip) => ip !== null) as string[]
    }
    return []
  } catch (error: any) {
    logger.error('Error fetching used IPs by prefix', { error: error.message })
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
