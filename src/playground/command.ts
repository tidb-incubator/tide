import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as TOML from '@iarna/toml'

import { shell } from '../shell'
import { TiUP } from '../tiup'
import { TiUPVersioning } from '../components/config/config'

export class PlaygroundCommand {
  checkTiUP() {}

  static async checkPlaygroundRun() {
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

  static async startPlayground(
    tiup: TiUP,
    workspaceFolders: ReadonlyArray<vscode.WorkspaceFolder> | undefined,
    configPath?: string
  ) {
    const running = await PlaygroundCommand.checkPlaygroundRun()
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
    let preCmds: string[] = []
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
        } else if (k.endsWith('.binpath') && (obj[k] as string) === 'current') {
          const pre = k.split('.')[0]
          let comp = pre
          // case by case
          if (pre === 'db') {
            comp = 'tidb'
          } else if (pre === 'kv') {
            comp = 'tikv'
          } else if (pre === 'pd') {
            comp = 'pd'
          }
          workspaceFolders?.forEach(folder => {
            if (folder.name === comp) {
              if (comp === 'tidb') {
                preCmds.push(`cd ${folder.uri.fsPath} && go build -gcflags='-N -l' -o ./bin/tidb-server tidb-server/main.go`)
                args.push(`--${k} ${folder.uri.fsPath}/bin/tidb-server`)
              } else if (comp === 'tikv') {
                preCmds.push(`cd ${folder.uri.fsPath} && make build`)
                args.push(`--${k} ${folder.uri.fsPath}/target/debug/tikv-server`)
              } else if (comp === 'pd') {
                preCmds.push(`cd ${folder.uri.fsPath} && go build -gcflags='-N -l' -o ./bin/pd-server cmd/pd-server/main.go`)
                args.push(`--${k} ${folder.uri.fsPath}/bin/pd-server`)
              }
            }
          })
        } else {
          args.push(`--${k} ${obj[k]}`)
        }
      }
    })
    const tidbVersion = obj['tidb.version'] || ''
    const cmd = `tiup playground ${tidbVersion} ${args.join(' ')}`
    let fullCmd = `${cmd} && exit`
    if (preCmds.length > 0) {
      preCmds.push('cd ~')
      fullCmd = `${preCmds.join(' && ')} && ${fullCmd}`
    }
    const t = await vscode.window.createTerminal('tiup playground')
    t.sendText(fullCmd)
    t.show()
    // await tiup.invokeInSharedTerminal(cmd)
    PlaygroundCommand.loopCheckPlayground()
  }

  static loopCheckPlayground(times: number = 30, intervals: number = 3 * 1000) {
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

  static viewInstanceLogs(pids: string[]) {
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

  static followInstanceLogs(tiup: TiUP, pids: string[]) {
    pids.forEach(pid => this.followInstanceLog(tiup, pid))
  }

  static async followInstanceLog(tiup: TiUP, pid: string) {
    const res = await shell.exec(`ps -p ${pid} | grep tiup`)
    console.log('ps result:', res)
    const m = res?.stdout.match(/log-file=(.+)\.log/)
    if (m) {
      const logFilePath = m[1] + '.log'
      await tiup.invokeAnyInNewTerminal(`tail -f ${logFilePath}`, `log-${pid}`)
      return
    } else {
      vscode.window.showErrorMessage('open log file failed!')
      vscode.commands.executeCommand('ticode.playground.refresh')
    }
  }

  static debugInstances(tiup: TiUP, label: string, pids: string[]) {
    pids.forEach(pid => this.debugInstance(tiup, label, pid))
  }
  
  static async debugInstance(tiup: TiUP, label: string, pid: string) {
    const m = label.match(/(\w+).*\(\d+\)/)
    if (!m) {
      vscode.window.showErrorMessage(`${label} is not a valid instance`);
      return
    } 
    const instanceName = m[1]
    const wd = (vscode.workspace.workspaceFolders || []).find((folder) => folder.name === instanceName);
    if (!wd) {
      vscode.window.showErrorMessage(`${instanceName} is not included in workspace, maybe you want to try 'ticode init'?`);
      return
    }
    switch (instanceName) {
      case "tidb" :{
        const debugConfiguration = {
          type: "go",
          request: "attach",
          name: "Attach TiDB",
          mode: "local",
          processId: Number(pid),
        };
        vscode.debug.startDebugging(wd, debugConfiguration)
        break
      }
      case "pd" :{
        const debugConfiguration = {
          type: "go",
          request: "attach",
          name: "Attach PD",
          mode: "local",
          processId: Number(pid),
        };
        vscode.debug.startDebugging(wd, debugConfiguration)
        break
      }
      case "tikv" :{
        const debugConfiguration = {
          type: "lldb",
          request: "attach",
          name: "Attach TiKV",
          pid: Number(pid),
        };
        vscode.debug.startDebugging(wd, debugConfiguration)
        break
      }
    }
  }

  static async stopPlayground() {
    // use "ps ax" instead of "ps aux" make the PID first column
    let cr = await shell.exec('ps ax | grep tiup-playground | grep -v grep')
    const lines = cr?.stdout.trim().split('\n')
    if (cr?.code === 0 && lines?.length === 1) {
      const pid = lines[0].split(/\s+/)[0]
      cr = await shell.exec(`kill ${pid}`)
      if (cr?.code === 0) {
        // loop check tiup-playground stop
        vscode.window.showInformationMessage('stopping playground...')
        this.loopCheckPlaygroundStop()
        return
      }
    }
    vscode.window.showErrorMessage('stop playground failed!')
    vscode.commands.executeCommand('ticode.playground.refresh')
  }

  static loopCheckPlaygroundStop(
    times: number = 10,
    intervals: number = 3 * 1000
  ) {
    let tried = 0
    async function check() {
      const running = await PlaygroundCommand.checkPlaygroundRun()
      if (!running) {
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
}
