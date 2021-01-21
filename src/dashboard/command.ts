import * as vscode from 'vscode'
import { shell } from '../shell'
import { handleError } from '../utils/window'
import { PlaygroundCommand } from '../playground/command'

export class DashboardCommand {
  static async start(treeItem: any) {
    console.log(treeItem)

    const folder = treeItem.path as string
    if (!folder.endsWith('/tidb-dashboard')) {
      vscode.window.showErrorMessage('This is not the tidb-dashboard folder')
      return
    }

    // start a playground
    const playgroundRunning = await PlaygroundCommand.checkPlaygroundRun()
    if (!playgroundRunning) {
      let t = vscode.window.createTerminal(`tiup playground`)
      t.sendText(`tiup playground`)
      t.show()
    }

    // TODO: check whether they are running
    let cmd = `cd ${folder} && make && make run && exit`
    let t = vscode.window.createTerminal(`dashboard backend`)
    t.sendText(cmd)
    t.show()

    cmd = `cd ${folder}/ui && yarn && yarn start`
    t = vscode.window.createTerminal(`dashboard fronted`)
    t.sendText(cmd)
    t.show()
  }

  static async restartBackend(dashboardFolder: string) {
    let cmd = `ps ax | grep bin/tidb-dashboard | grep -v grep`
    let cr = await shell.exec(cmd)
    if (cr?.code !== 0) {
      handleError(cr)
      return
    }
    let pid = cr.stdout.trim().split(/\s+/)[0]
    cmd = `kill ${pid}`
    cr = await shell.exec(cmd)
    if (cr?.code !== 0) {
      handleError(cr)
      return
    }

    setTimeout(() => {
      let cmd = `cd ${dashboardFolder} && make && make run && exit`
      let t = vscode.window.createTerminal(`dashboard backend`)
      t.sendText(cmd)
      t.show()
    }, 2000)
  }
}
