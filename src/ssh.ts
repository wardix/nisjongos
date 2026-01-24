import { Client } from 'ssh2'
import logger from './logger'

export interface SshConfig {
  host: string
  username: string
  privateKey?: string
  password?: string
  port?: number
}

export function executeRemoteCommand(
  config: SshConfig,
  command: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    const { host, username, privateKey, password, port = 22 } = config

    conn
      .on('ready', () => {
        logger.info(`SSH connection established to ${host}`)
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end()
            return reject(err)
          }

          let stdout = ''
          let stderr = ''

          stream
            .on('close', (code: number, signal: string) => {
              logger.info(
                `SSH command closed with code ${code} and signal ${signal}`,
              )
              conn.end()
              if (code !== 0) {
                reject(
                  new Error(
                    `Command failed with code ${code}. Stderr: ${stderr}`,
                  ),
                )
              } else {
                resolve(stdout)
              }
            })
            .on('data', (data: Buffer) => {
              stdout += data.toString()
            })
            .stderr.on('data', (data: Buffer) => {
              stderr += data.toString()
            })
        })
      })
      .on('error', (err) => {
        logger.error(`SSH connection error: ${err.message}`)
        reject(err)
      })
      .connect({
        host,
        port,
        username,
        privateKey,
        password,
      })
  })
}
