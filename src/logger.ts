import type { TransportTargetOptions } from 'pino'
import pino from 'pino'
import { SYSLOG_APPNAME, SYSLOG_DEBUG, SYSLOG_ENABLED } from './config'

function buildTargets(): TransportTargetOptions[] {
  const targets: TransportTargetOptions[] = [
    {
      target: 'pino/file',
      options: { destination: 1 }, // stdout
      level: 'info',
    },
  ]

  if (SYSLOG_ENABLED) {
    targets.push({
      target: new URL('./syslog-transport.ts', import.meta.url).pathname,
      options: {
        address: '/dev/log',
        appname: SYSLOG_APPNAME,
        facility: 16, // local0
        debug: SYSLOG_DEBUG,
      },
      level: 'info',
    })
  }

  return targets
}

const logger = pino({
  level: 'info',
  transport: { targets: buildTargets() },
})

export default logger
