import * as vscode from 'vscode'
import { shell } from '../shell'
import { TiUP } from '../tiup'
import * as TOML from '@iarna/toml'
import * as fs from 'fs'
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
        const m = line.match(/\d+\s+(\w+)/)
        if (m) {
          const comp = m[1]
          instances[comp] = (instances[comp] || 0) + 1
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
      return
    }

    // read config
    const content = fs.readFileSync(configPath, { encoding: 'utf-8' })
    const obj = TOML.parse(content)
    // build command
    const args: string[] = []
    Object.keys(obj).forEach((k) => {
      if (obj[k] !== '') {
        if (typeof obj[k] === 'boolean') {
          args.push(`--${k}=${obj[k]}`)
        } else {
          args.push(`--${k} ${obj[k]}`)
        }
      }
    })
    const cmd = `playground ${args.join(' ')}`
    await tiup.invokeInSharedTerminal(cmd)
  }

  restartPlayground() {}
}
