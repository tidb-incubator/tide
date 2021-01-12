import * as vscode from 'vscode'
import { shell } from '../shell'
import { TiUP } from '../tiup'
import * as TOML from '@iarna/toml'
import * as fs from 'fs'
import * as path from 'path'
export class PlaygroundCommand {
  constructor() {}

  checkTiUP() {}

  static async checkPlayground() {
    const res = await shell.exec('ps aux | grep tiup-playground | grep -v grep')
    const lines = res?.stdout.trim().split('\n').length
    return res?.code === 0 && lines === 1
  }

  static async displayPlayground() {
    const res = await shell.exec('tiup playground display')
    if (res?.code === 0) {
      // running
      const instances = {} as any
      const output = res.stdout
      const arr = output.split('\n')
      arr.forEach((line) => {
        const m = line.match(/(\d+)\s+(\w+)/)
        if (m) {
          const pid = m[1]
          const comp = m[2]
          instances[comp] = (instances[comp] || []).concat(pid)
        }
      })
      return instances
    }
    return undefined
  }

  static async startPlayground(tiup: TiUP, configPath?: string) {
    const running = await PlaygroundCommand.checkPlayground()
    if (running) {
      vscode.window.showInformationMessage('TiUP Playground is running')
      vscode.commands.executeCommand('ticode.playground.refresh')
      return
    }

    if (configPath === undefined) {
      await tiup.invokeInSharedTerminal('playground')
      PlaygroundCommand.loopCheckPlayground()
      return
    }

    // read config
    const content = fs.readFileSync(configPath, { encoding: 'utf-8' })
    const obj = TOML.parse(content)
    // build command
    const folder = path.dirname(configPath)
    const args: string[] = []
    Object.keys(obj).forEach((k) => {
      if (k !== 'tidb.version' && obj[k] !== '') {
        if (typeof obj[k] === 'boolean') {
          args.push(`--${k}=${obj[k]}`)
        } else if (
          k.endsWith('.config') &&
          (obj[k] as string).startsWith('components-config')
        ) {
          const fullPath = path.join(folder, obj[k] as string)
          args.push(`--${k} "${fullPath}"`)
        } else {
          args.push(`--${k} ${obj[k]}`)
        }
      }
    })
    const tidbVersion = obj['tidb.version'] || ''
    const cmd = `playground ${tidbVersion} ${args.join(' ')}`
    await tiup.invokeInSharedTerminal(cmd)
    PlaygroundCommand.loopCheckPlayground()
  }

  static loopCheckPlayground(times: number = 10, intervals: number = 3 * 1000) {
    let tried = 0
    async function check() {
      const instances = await PlaygroundCommand.displayPlayground()
      if (instances) {
        vscode.commands.executeCommand('ticode.playground.refresh')
        return
      }
      tried++
      if (tried > times) {
        return
      }
      setTimeout(check, intervals)
    }
    setTimeout(check, intervals)
  }

  restartPlayground() {}

  static viewIntanceLogs(pids: string[]) {
    pids.forEach(this.openInstanceLog)
  }

  static async openInstanceLog(pid: string) {
    const res = await shell.exec(`ps -p ${pid} | grep tiup`)
    console.log('ps result:', res)
    const m = res?.stdout.match(/log-file=(.+)\.log/)
    if (m) {
      const logFilePath = m[1] + '.log'
      vscode.commands.executeCommand(
        'vscode.open',
        vscode.Uri.file(logFilePath)
      )
    } else {
      vscode.window.showErrorMessage('open log file failed!')
      vscode.commands.executeCommand('ticode.playground.refresh')
    }
  }
}
