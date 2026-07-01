import { connect, type Socket } from 'node:net'
import build from 'pino-abstract-transport'

interface SyslogTransportOptions {
  address?: string
  appname?: string
  facility?: number
}

const SEVERITY_MAP: Record<string, number> = {
  trace: 7, // debug
  debug: 7,
  info: 6,
  warn: 4, // warning
  error: 3,
  fatal: 0, // emerg
}

/**
 * Custom pino transport that formats log entries as RFC 3164 syslog
 * messages and sends them to a Unix stream socket (e.g. /dev/log).
 *
 * If the socket is unavailable, logs are silently dropped to avoid
 * crashing the application. Reconnection is attempted on each write.
 */
export default async function (opts: SyslogTransportOptions) {
  const socketPath = opts.address || '/dev/log'
  const appname = opts.appname || 'nisjongos'
  const facility = opts.facility ?? 16 // local0

  let socket: Socket | null = null
  let connected = false

  function createSocket() {
    try {
      const s = connect(socketPath)

      s.on('connect', () => {
        connected = true
      })

      s.on('error', () => {
        connected = false
        try {
          s.destroy()
        } catch {
          // ignore
        }
        socket = null
      })

      s.on('close', () => {
        connected = false
        socket = null
      })

      socket = s
    } catch {
      socket = null
      connected = false
    }
  }

  createSocket()

  function toSyslog(obj: Record<string, unknown>): string {
    const pinoLevel = levelToName(Number(obj.level ?? 30))
    const severity = SEVERITY_MAP[pinoLevel] ?? 6
    const priority = facility * 8 + severity

    const time = obj.time ? new Date(obj.time as number) : new Date()
    const timestamp = time.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    const msg = obj.msg || JSON.stringify(obj)

    // RFC 3164: <priority>timestamp hostname appname: message
    return `<${priority}>${timestamp} ${appname}: ${msg}\n`
  }

  return build(
    async (source) => {
      for await (const obj of source) {
        const msg = toSyslog(obj)

        // Attempt reconnect if socket is down
        if (!socket || !connected) {
          createSocket()
        }

        // Write only if connected; silently drop otherwise
        if (socket && connected) {
          socket.write(msg)
        }
      }
    },
    {
      close() {
        if (socket) {
          socket.destroy()
          socket = null
        }
      },
    },
  )
}

function levelToName(level: number): string {
  if (level <= 10) return 'trace'
  if (level <= 20) return 'debug'
  if (level <= 30) return 'info'
  if (level <= 40) return 'warn'
  if (level <= 50) return 'error'
  return 'fatal'
}
