import * as vscode from 'vscode'
import { ShellResult } from '../shell'

export function handleError(sr?: ShellResult) {
  vscode.window.showErrorMessage('Error:' + sr?.stderr + sr?.stdout)
}
