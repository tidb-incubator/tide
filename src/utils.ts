import * as vscode from 'vscode'
import { ShellResult } from './shell'

export function handleError(cr?: ShellResult) {
  vscode.window.showErrorMessage('Error:' + cr?.stderr + cr?.stdout)
}

export function runNewTerminal(title: string, cmd?: string) {
  const finalCmd = cmd || title
  const t = vscode.window.createTerminal(title)
  t.sendText(finalCmd)
  t.show()
}
