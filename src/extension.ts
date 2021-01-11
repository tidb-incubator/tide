import * as vscode from 'vscode'
import * as config from './components/config/config'
import { fs } from './fs'
import { host } from './host'
import { PlaygroundCommand } from './playground/command'
import { PlaygroundProvider } from './playground/playground'
import { shell } from './shell'
import { create as createTiUP } from './tiup'

const tiup = createTiUP(config.getTiUPVersioning(), host, fs, shell)

export async function activate(context: vscode.ExtensionContext) {
  // playground tree view
  const playgroundProvider = new PlaygroundProvider(
    vscode.workspace.rootPath,
    context
  )
  vscode.window.registerTreeDataProvider(
    'ticode-tiup-playground',
    playgroundProvider
  )

  const subscriptions = [
    registerCommand('ticode.help', tiupHelp),
    registerCommand('ticode.playground.start', () =>
      PlaygroundCommand.startPlayground(tiup)
    ),
    registerCommand('ticode.playground.startByConfig', () =>
      PlaygroundCommand.startPlayground(
        tiup,
        playgroundProvider.playgroundConfigPath
      )
    ),
    registerCommand('ticode.playground.refresh', () =>
      playgroundProvider.refresh()
    ),
  ]

  subscriptions.forEach((x) => context.subscriptions.push(x))
}

// this method is called when your extension is deactivated
export function deactivate() {}

function registerCommand(
  command: string,
  callback: (...args: any[]) => any
): vscode.Disposable {
  // TODO: add telemetry for usage data collection
  // const wrappedCallback = telemetry.telemetrise(command, tiup, callback);
  const wrappedCallback = callback
  return vscode.commands.registerCommand(command, wrappedCallback)
}

async function tiupHelp() {
  vscode.window.showInformationMessage('TiCode Help')
  await tiup.invokeInSharedTerminal('help')
}
