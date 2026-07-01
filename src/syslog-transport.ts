import { createSocket, type Socket } from 'node:dgram'
import build from 'pino-abstract-transport'

interface SyslogTransportOptions {
  address?: string
  appname?: string
  facility?: number
  debug?: boolean
}

const SEVERITY_MAP: Record<string, number> = {
  trace: 7, // debug
  debug: 7,
  info: 6,
  warn: 4, // warning
  error: 3,
  fatal: 0, // emerg
}

function log(debug: boolean, msg: string) {
  if (debug) {
    process.stderr.write(`[syslog-transport] ${msg}\n`)
  }
}

/**
 * Custom pino transport that formats log entries as RFC 3164 syslog
 * messages and sends them to /dev/log via Unix datagram socket.
 */
export default async function (opts: SyslogTransportOptions) {
  const socketPath = opts.address || '/dev/log'
  const appname = opts.appname || 'nisjongos'
  const facility = opts.facility ?? 16 // local0
  const debug = opts.debug ?? false

  let socket: Socket | null = null
  let ready = false

  function createSyslogSocket() {
    try {
      log(debug, `Creating unix_dgram socket for ${socketPath}`)

      // 'unix_dgram' is not in Node.js typings but supported by Bun runtime
      // biome-ignore lint/suspicious/noExplicitAny: unix_dgram not in SocketType
      socket = createSocket('unix_dgram' as any)

      socket.on('error', (err) => {
        log(debug, `Socket error: ${err.message}`)
        ready = false
      })

      ready = true
      log(debug, 'Socket created (dgram is connectionless)')
    } catch (err) {
      log(debug, `Failed to create socket: ${err}`)
      socket = null
      ready = false
    }
  }

  createSyslogSocket()

  function toSyslog(obj: Record<string, unknown>): string {
    const pinoLevel = levelToName(Number(obj.level ?? 30))
    const severity = SEVERITY_MAP[pinoLevel] ?? 6
    const priority = facility * 8 + severity

    const time = obj.time ? new Date(obj.time as number) : new Date()
    const month = time.toLocaleString('en-US', { month: 'short' })
    const day = String(time.getDate()).padStart(2, ' ')
    const timeStr = time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    const msg = obj.msg || JSON.stringify(obj)

    // RFC 3164: <priority>Mon DD HH:MM:SS appname: message
    return `<${priority}>${month} ${day} ${timeStr} ${appname}: ${msg}`
  }

  return build(
    async (source) => {
      for await (const obj of source) {
        const msg = toSyslog(obj)
        const buf = Buffer.from(msg)

        if (!socket || !ready) {
          log(debug, 'Socket not ready, attempting reconnect...')
          createSyslogSocket()
        }

        if (socket && ready) {
          // biome-ignore lint/suspicious/noExplicitAny: unix_dgram send accepts path as port
          socket.send(buf, 0, buf.length, socketPath as any, (err) => {
            if (err) {
              log(debug, `Send error: ${err.message}`)
              ready = false
            } else {
              log(debug, `Sent: ${msg}`)
            }
          })
        } else {
          log(debug, `Dropped: ${msg}`)
        }
      }
    },
    {
      close() {
        log(debug, 'Transport closing')
        if (socket) {
          socket.close()
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
