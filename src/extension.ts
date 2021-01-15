import * as vscode from 'vscode'
import * as config from './components/config/config'
import * as tmp from 'tmp'

import { fs } from './fs'
import { host } from './host'
import { PlaygroundCommand } from './playground/command'
import { PlaygroundProvider } from './playground/provider'
import { ClusterProvider } from './cluster/provider'
import { shell } from './shell'
import { create as createTiUP } from './tiup'
import {
  ClusterCommand,
  ClusterComponent,
  InstanceAndCluster,
} from './cluster/command'
import { TopoProvider } from './topo-manager/provider'

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

  // topo tree view
  const topoProvider = new TopoProvider()
  vscode.window.registerTreeDataProvider('ticode-topo-manager', topoProvider)

  // temp folder
  // TODO: persist path to vscode configuration
  const { name: tempFolder } = tmp.dirSync()

  const commandsSubscriptions = [
    ////////////////
    registerCommand('ticode.help', tiupHelp),

    ////////////////
    // playground
    registerCommand('ticode.playground.start', () =>
      PlaygroundCommand.startPlayground(tiup, vscode.workspace.rootPath || '')
    ),
    registerCommand('ticode.playground.stop', () => stopPlayground()),
    registerCommand('ticode.playground.startByConfig', () =>
      PlaygroundCommand.startPlayground(
        tiup,
        vscode.workspace.rootPath || '',
        playgroundProvider.playgroundConfigPath
      )
    ),
    registerCommand('ticode.playground.reloadConfig', () =>
      reloadPlaygroundConfig(playgroundProvider)
    ),
    registerCommand('ticode.playground.refresh', () =>
      playgroundProvider.refresh()
    ),
    registerCommand('ticode.playground.viewInstanceLog', (treeItem) => {
      PlaygroundCommand.viewInstanceLogs(treeItem.extra.pids)
    }),
    registerCommand('ticode.playground.followInstanceLog', (treeItem) => {
      PlaygroundCommand.followInstanceLogs(tiup, treeItem.extra.pids)
    }),

    ////////////////
    // cluster
    // navigation action
    registerCommand('ticode.cluster.refresh', () => clusterProvider.refresh()),
    // context menu
    registerCommand('ticode.cluster.list', listClusters),
    // context menu
    registerCommand('ticode.cluster.display', (treeItem) =>
      displayClusters(treeItem.label)
    ),
    // directly click
    registerCommand('ticode.cluster.viewInstanceLog', (fileName, inst) =>
      ClusterCommand.scpLogFile(fileName, inst, tempFolder)
    ),
    // directly click
    registerCommand('ticode.cluster.viewInstanceConf', (fileName, inst) =>
      ClusterCommand.scpConfFile(fileName, inst, tempFolder)
    ),
    // context menu
    registerCommand('ticode.cluster.applyInstanceConf', (treeItem) => {
      ClusterCommand.applyConfFile(treeItem.label, treeItem.extra, tempFolder)
    }),
    // context menu
    registerCommand('ticode.cluster.start', (treeItem) =>
      ClusterCommand.startCluster(treeItem.label, tiup)
    ),
    registerCommand('ticode.cluster.stop', (treeItem) =>
      ClusterCommand.stopCluster(treeItem.label, tiup)
    ),
    registerCommand('ticode.cluster.restart', (treeItem) =>
      ClusterCommand.restartCluster(treeItem.label, tiup)
    ),
    registerCommand('ticode.cluster.destroy', (treeItem) =>
      ClusterCommand.destroyCluster(treeItem.label, tiup)
    ),
    registerCommand('ticode.cluster.openDashboard', (treeItem) =>
      ClusterCommand.openDashboard(treeItem.label, tiup)
    ),
    registerCommand('ticode.cluster.openGrafana', (treeItem) =>
      ClusterCommand.openGrafana(treeItem.label, tiup)
    ),
    // click
    registerCommand('ticode.cluster.viewGlobalConfig', (cluster) => {
      ClusterCommand.copyGloalConfigFile(cluster, tempFolder)
    }),
    // context menu
    registerCommand('ticode.cluster.applyClusterConfOnly', (treeItem) =>
      ClusterCommand.applyGlobalConfigFile(
        treeItem.extra,
        tempFolder,
        false,
        tiup
      )
    ),
    registerCommand('ticode.cluster.applyClusterConfAndRestart', (treeItem) =>
      ClusterCommand.applyGlobalConfigFile(
        treeItem.extra,
        tempFolder,
        true,
        tiup
      )
    ),
    // context menu
    registerCommand('ticode.cluster.ssh', (treeItem) =>
      ClusterCommand.ssh(treeItem.extra)
    ),
    // context menu
    registerCommand('ticode.cluster.patchByCurrent', (treeItem) => {
      ClusterCommand.patchByCurrent(
        treeItem.extra,
        treeItem.contextValue,
        vscode.workspace.rootPath || ''
        // tiup
      )
    }),
    registerCommand('ticode.cluster.patchByOther', (treeItem) => {
      ClusterCommand.patchByOther(treeItem.extra, treeItem.contextValue)
    }),
    // context menu
    registerCommand('ticode.cluster.restartComponent', (treeItem) => {
      ClusterCommand.restartComponent(treeItem.extra as ClusterComponent, tiup)
    }),
    registerCommand('ticode.cluster.restartInstance', (treeItem) => {
      ClusterCommand.restartInstance(treeItem.extra as InstanceAndCluster, tiup)
    }),
    // click
    registerCommand('ticode.cluster.viewTopo', (cluster) => {
      ClusterCommand.viewClusterTopo(cluster, tempFolder)
    }),
  ]
  commandsSubscriptions.forEach((x) => context.subscriptions.push(x))

  // virtual document
  const myScheme = 'ticode'
  const myProvider = new (class implements vscode.TextDocumentContentProvider {
    // emitter and its event
    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>()
    onDidChange = this.onDidChangeEmitter.event

    async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
      const cr = await shell.exec(`tiup cluster ${uri.path}`)
      return cr?.stdout || ''
    }
  })()
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(myScheme, myProvider)
  )
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
async function listClusters() {
  const uri = vscode.Uri.parse('ticode:list')
  const doc = await vscode.workspace.openTextDocument(uri) // calls back into the provider
  await vscode.window.showTextDocument(doc, { preview: false })
}

async function displayClusters(clusterName?: string) {
  if (clusterName === undefined) {
    vscode.window.showErrorMessage('cluster name is unknown')
    return
  }

  const uri = vscode.Uri.parse(`ticode:display ${clusterName}`)
  const doc = await vscode.workspace.openTextDocument(uri) // calls back into the provider
  await vscode.window.showTextDocument(doc, { preview: false })
}
