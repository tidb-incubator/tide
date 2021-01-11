import * as vscode from 'vscode'
import { shellEnvironment } from './shell'

export interface Host {
  createTerminal(
    name?: string,
    shellPath?: string,
    shellArgs?: string[]
  ): vscode.Terminal
  getConfiguration(key: string): any
  onDidCloseTerminal(listener: (e: vscode.Terminal) => any): vscode.Disposable
  onDidChangeConfiguration(
    listener: (ch: vscode.ConfigurationChangeEvent) => any
  ): vscode.Disposable
}

export const host: Host = {
  createTerminal: createTerminal,
  getConfiguration: getConfiguration,
  onDidChangeConfiguration: onDidChangeConfiguration,
  onDidCloseTerminal: onDidCloseTerminal,
}

function getConfiguration(key: string): any {
  return vscode.workspace.getConfiguration(key)
}

function createTerminal(
  name?: string,
  shellPath?: string,
  shellArgs?: string[]
): vscode.Terminal {
  const terminalOptions = {
    name: name,
    shellPath: shellPath,
    shellArgs: shellArgs,
    env: shellEnvironment(process.env),
  }
  return vscode.window.createTerminal(terminalOptions)
}

function onDidChangeConfiguration(
  listener: (e: vscode.ConfigurationChangeEvent) => any
): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration(listener)
}

function onDidCloseTerminal(
  listener: (e: vscode.Terminal) => any
): vscode.Disposable {
  return vscode.window.onDidCloseTerminal(listener)
}
