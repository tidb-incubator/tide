import * as vscode from 'vscode'
import { ShellResult } from './shell'

export function handleError(cr?: ShellResult) {
  vscode.window.showErrorMessage('Error:' + cr?.stderr + cr?.stdout)
}
