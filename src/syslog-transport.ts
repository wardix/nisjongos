import { type ChildProcess, spawn } from 'node:child_process'
import build from 'pino-abstract-transport'

interface SyslogTransportOptions {
  appname?: string
  facility?: number
  debug?: boolean
}

const FACILITY_NAMES: Record<number, string> = {
  0: 'kern',
  1: 'user',
  2: 'mail',
  3: 'daemon',
  4: 'auth',
  8: 'uucp',
  9: 'cron',
  16: 'local0',
  17: 'local1',
  18: 'local2',
  19: 'local3',
  20: 'local4',
  21: 'local5',
  22: 'local6',
  23: 'local7',
}

const SEVERITY_NAMES: Record<string, string> = {
  trace: 'debug',
  debug: 'debug',
  info: 'info',
  warn: 'warning',
  error: 'err',
  fatal: 'emerg',
}

function log(debug: boolean, msg: string) {
  if (debug) {
    process.stderr.write(`[syslog-transport] ${msg}\n`)
  }
}

/**
 * Custom pino transport that sends log entries to the local syslog
 * using the system `logger` command with --prio-prefix.
 *
 * This avoids socket-type issues entirely because `logger` handles
 * communication with the local syslog daemon natively.
 */
export default async function (opts: SyslogTransportOptions) {
  const appname = opts.appname || 'nisjongos'
  const facility = opts.facility ?? 16
  const debug = opts.debug ?? false
  const facilityName = FACILITY_NAMES[facility] || 'local0'

  let proc: ChildProcess | null = null
  let ready = false

  function spawnLogger() {
    try {
      const args = ['-t', appname, '--prio-prefix']
      log(debug, `Spawning: logger ${args.join(' ')}`)

      const p = spawn('logger', args, {
        stdio: ['pipe', 'ignore', 'ignore'],
      })

      p.on('error', (err) => {
        log(debug, `logger process error: ${err.message}`)
        ready = false
        proc = null
      })

      p.on('exit', (code) => {
        log(debug, `logger process exited (code: ${code})`)
        ready = false
        proc = null
      })

      p.stdin?.on('error', (err) => {
        log(debug, `logger stdin error: ${err.message}`)
        ready = false
      })

      proc = p
      ready = true
      log(debug, `logger process started (pid: ${p.pid})`)
    } catch (err) {
      log(debug, `Failed to spawn logger: ${err}`)
      proc = null
      ready = false
    }
  }

  spawnLogger()

  function toSyslogLine(obj: Record<string, unknown>): string {
    const pinoLevel = levelToName(Number(obj.level ?? 30))
    const severity = SEVERITY_NAMES[pinoLevel] || 'info'
    const msg = obj.msg || JSON.stringify(obj)

    // --prio-prefix format: <facility.severity>message
    return `<${facilityName}.${severity}>${msg}\n`
  }

  return build(
    async (source) => {
      for await (const obj of source) {
        const line = toSyslogLine(obj)

        if (!proc || !ready) {
          log(debug, 'logger process not available, respawning...')
          spawnLogger()
        }

        if (proc && ready) {
          proc.stdin?.write(line)
          log(debug, `Sent: ${line.trim()}`)
        } else {
          log(debug, `Dropped: ${line.trim()}`)
        }
      }
    },
    {
      close() {
        log(debug, 'Transport closing')
        if (proc) {
          proc.stdin?.end()
          proc.kill()
          proc = null
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
