import * as vscode from 'vscode'
import * as config from './components/config/config'
import { fs } from './fs'
import { host } from './host'
import { PlaygroundCommand } from './playground/command'
import { PlaygroundProvider } from './playground/provider'
import { ClusterProvider } from './cluster/provider'
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

  // clsuter tree view
  const clusterProvider = new ClusterProvider(
    vscode.workspace.rootPath,
    context
  )
  vscode.window.registerTreeDataProvider('ticode-tiup-cluster', clusterProvider)

  const subscriptions = [
    ////////////////
    registerCommand('ticode.help', tiupHelp),

    ////////////////
    // playground
    registerCommand('ticode.playground.start', () =>
      PlaygroundCommand.startPlayground(tiup)
    ),
    registerCommand('ticode.playground.stop', () => stopPlayground()),
    registerCommand('ticode.playground.startByConfig', () =>
      PlaygroundCommand.startPlayground(
        tiup,
        playgroundProvider.playgroundConfigPath
      )
    ),
    registerCommand('ticode.playground.reloadConfig', () =>
      reloadPlaygroundConfig(playgroundProvider)
    ),
    registerCommand('ticode.playground.refresh', () =>
      playgroundProvider.refresh()
    ),
    registerCommand('ticode.playground.viewInstanceLog', (item) => {
      PlaygroundCommand.viewIntanceLogs(item.extra.pids)
    }),

    ////////////////
    // playground
    registerCommand('ticode.cluster.refresh', () =>
      clusterProvider.refresh()
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

///////////////////////////////////////////
// playground

async function reloadPlaygroundConfig(playgroundProvider: PlaygroundProvider) {
  const res = await vscode.window.showWarningMessage(
    'Are you sure reload the config? Your current config will be overrided',
    'Reload'
  )
  if (res === 'Reload') {
    playgroundProvider.reloadConfig()
  }
}

async function stopPlayground() {
  const res = await vscode.window.showWarningMessage(
    'Are you sure stop the playground',
    'Stop'
  )
  if (res === 'Stop') {
    PlaygroundCommand.stopPlayground()
  }
}

///////////////////////////////////////////
// cluster
