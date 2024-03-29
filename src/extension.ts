import * as vscode from 'vscode'
import * as path from 'path'
import * as tmp from 'tmp'

import { fs } from './fs'
import { host } from './host'
import { shell } from './shell'
import { create as createTiUP } from './tiup'

import * as config from './components/config/config'

import { PlaygroundCommand } from './playground/command'
import { PlaygroundProvider } from './playground/provider'
import { TopoProvider } from './topo-manager/provider'
import { TopoManagerCommand } from './topo-manager/command'
import {
  ClusterCommand,
  ClusterComponent,
  InstanceAndCluster,
} from './cluster/command'
import { ClusterProvider } from './cluster/provider'
import { DashboardCommand } from './dashboard/command'
import { KubeCommand } from './kubernetes/command'
import { KubeProvider } from './kubernetes/provider'
import { ScaffoldProvider } from './scaffold/provider'
import { ScaffoldCommand } from './scaffold/command'

const tiup = createTiUP(config.getTiUPVersioning(), host, fs, shell)

export async function activate(context: vscode.ExtensionContext) {
  // check environments
  checkEnvs()

  // playground tree view
  const playgroundProvider = new PlaygroundProvider(context)
  vscode.window.registerTreeDataProvider(
    'ticode-tiup-playground',
    playgroundProvider
  )

  // topo tree view
  const topoProvider = new TopoProvider(context)
  vscode.window.registerTreeDataProvider('ticode-topo-manager', topoProvider)

  // clsuter tree view
  const clusterProvider = new ClusterProvider()
  vscode.window.registerTreeDataProvider('ticode-tiup-cluster', clusterProvider)

  // kubernetes tree view
  const kubeProvider = new KubeProvider()
  vscode.window.registerTreeDataProvider('ticode-kube-cluster', kubeProvider)

  // scaffold tree view
  const scaffoldProvider = new ScaffoldProvider()
  vscode.window.registerTreeDataProvider('ticode-scaffold', scaffoldProvider)

  // temp folder
  // TODO: persist path to vscode configuration
  const { name: tempFolder } = tmp.dirSync()

  const commandsSubscriptions = [
    // help
    registerCommand('ticode.help', tiupHelp),

    /**
     * TiUP Playground
     */
    registerCommand('ticode.playground.start', () =>
      PlaygroundCommand.startPlayground(
        tiup,
        vscode.workspace.workspaceFolders,
        playgroundProvider.playgroundDefaultConfigPath
      )
    ),
    registerCommand('ticode.playground.stop', () => stopPlayground()),
    registerCommand('ticode.playground.startByConfig', () =>
      PlaygroundCommand.startPlayground(
        tiup,
        vscode.workspace.workspaceFolders,
        playgroundProvider.playgroundConfigPath
      )
    ),
    registerCommand('ticode.playground.restart', (treeItem) => {
      PlaygroundCommand.reloadPlayground(
        tiup,
        vscode.workspace.workspaceFolders,
        playgroundProvider.playgroundDefaultConfigPath
      )
    }),
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
    registerCommand('ticode.playground.debugCluster', (treeItem) => {
      playgroundProvider.getChildren(treeItem).then((childs) => {
        PlaygroundCommand.debugCluster(tiup, childs)
      })
    }),
    registerCommand('ticode.playground.debugInstance', (treeItem) => {
      PlaygroundCommand.debugInstances(
        tiup,
        treeItem.extra.comp,
        treeItem.extra.pids
      )
    }),
    registerCommand('ticode.playground.connectMySQL', (treeItem) => {
      PlaygroundCommand.connectMySQL(tiup)
    }),
    registerCommand('ticode.playground.tpccPrepare', (treeItem) => {
      PlaygroundCommand.tpccPrepare(tiup)
    }),
    registerCommand('ticode.playground.tpccRun', (treeItem) => {
      PlaygroundCommand.tpccRun(tiup)
    }),
    registerCommand('ticode.playground.tpccCleanUp', (treeItem) => {
      PlaygroundCommand.tpccCleanUp(tiup)
    }),
    registerCommand('ticode.playground.tpccCheck', (treeItem) => {
      PlaygroundCommand.tpccCheck(tiup)
    }),
    /**
     * TiUP Cluster
     */
    // navigation action
    registerCommand('ticode.cluster.refresh', () => clusterProvider.refresh()),
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
    registerCommand('ticode.cluster.debug', (treeItem) =>
      ClusterCommand.debug(treeItem.extra)
    ),
    // context menu
    registerCommand('ticode.cluster.patchByCurrent', (treeItem) => {
      ClusterCommand.patchByCurrent(treeItem.extra, treeItem.contextValue)
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
    registerCommand('ticode.cluster.connectMySQL', (treeItem) => {
      ClusterCommand.connectMySQL(treeItem.extra as ClusterComponent, tiup)
    }),
    // click
    registerCommand('ticode.cluster.viewTopo', (cluster) => {
      ClusterCommand.viewClusterTopo(cluster, tempFolder)
    }),

    /**
     * Kubernetes Cluster
     */
    registerCommand('ticode.kubernetes.listTidbCluster', () =>
      KubeCommand.listTidbCluster()
    ),
    registerCommand('ticode.kubernetes.showPodInDocument', (podName) =>
      showPodInDocument(podName)
    ),

    /**
     * Scaffold
     */
    // click
    registerCommand('ticode.scaffold.addDashboardApp', () => {
      ScaffoldCommand.addDashboardApp()
    }),

    /**
     * Dashboard
     */
    registerCommand('ticode.dashboard.run', (treeItem) => {
      DashboardCommand.start(treeItem)
    }),
    /**
     * Topo Manager
     */
    registerCommand('ticode.topo.refresh', () => topoProvider.refresh()),
    registerCommand('ticode.topo.add', () =>
      TopoManagerCommand.addTopo(topoProvider.localFolder)
    ),
    // context menu
    registerCommand('ticode.topo.remove', (treeItem) =>
      // treeItem.contextValue = 'topo-cluster-added'
      TopoManagerCommand.removeTopo(topoProvider.localFolder, treeItem.label)
    ),
    registerCommand('ticode.topo.rename', (treeItem) =>
      // treeItem.contextValue = 'topo-cluster-added'
      TopoManagerCommand.renameTopo(topoProvider.localFolder, treeItem.label)
    ),
    // context menu
    registerCommand('ticode.topo.diffModification', (treeItem) => {
      const templateFolder = topoProvider.templateFolder
      const localFoder = topoProvider.localFolder
      const folderName = treeItem.extra
      const fileName = treeItem.label
      TopoManagerCommand.diffModification(
        templateFolder,
        localFoder,
        tempFolder,
        folderName,
        fileName
      )
    }),
    registerCommand('ticode.topo.vagrantUp', (treeItem) => {
      const localFoder = topoProvider.localFolder
      const folderName = treeItem.extra
      TopoManagerCommand.vagrantUp(localFoder, folderName)
    }),
    registerCommand('ticode.topo.vagrantReload', (treeItem) => {
      const localFoder = topoProvider.localFolder
      const folderName = treeItem.extra
      TopoManagerCommand.vagrantReload(localFoder, folderName)
    }),
    registerCommand('ticode.topo.vagrantDestroy', (treeItem) => {
      const localFoder = topoProvider.localFolder
      const folderName = treeItem.extra
      TopoManagerCommand.vagrantDestroy(localFoder, folderName)
    }),
    registerCommand('ticode.topo.vagrantSSH', (treeItem) => {
      // treeItem.contextValue = 'topo-vm'
      const localFoder = topoProvider.localFolder
      const folderName = treeItem.extra
      const machineName = treeItem.label
      TopoManagerCommand.vagrantSSH(localFoder, folderName, machineName)
    }),
    registerCommand('ticode.topo.deployByPassword', (treeItem) => {
      // treeItem.contextValue = 'topo-file-topology'
      const localFoder = topoProvider.localFolder
      const folderName = treeItem.extra
      TopoManagerCommand.deploy(localFoder, folderName, 'password')
    }),
    registerCommand('ticode.topo.deployByVagrantKey', (treeItem) => {
      // treeItem.contextValue = 'topo-file-topology'
      const localFoder = topoProvider.localFolder
      const folderName = treeItem.extra
      TopoManagerCommand.deploy(localFoder, folderName, 'vagrant_private_key')
    }),
    registerCommand('ticode.topo.deployBySelfKey', (treeItem) => {
      // treeItem.contextValue = 'topo-file-topology'
      const localFoder = topoProvider.localFolder
      const folderName = treeItem.extra
      TopoManagerCommand.deploy(localFoder, folderName, 'self_private_key')
    }),
    // context menu
    registerCommand('ticode.topo.removeSelfKey', (treeItem) => {
      // treeItem.contextValue = 'topo-file-private-key'
      const localFoder = topoProvider.localFolder
      const folderName = treeItem.extra
      TopoManagerCommand.removeSelfKey(localFoder, folderName)
    }),
  ]

  commandsSubscriptions.forEach((x) => context.subscriptions.push(x))

  // TODO: review implementation of virtual document
  const schemeTiUPCluster = 'tiup-cluster'
  const tdcProviderTiUPCluster = new (class
    implements vscode.TextDocumentContentProvider {
    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>()
    onDidChange = this.onDidChangeEmitter.event
    async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
      const cr = await shell.exec(`tiup cluster ${uri.path}`)
      return cr?.stdout || ''
    }
  })()
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      schemeTiUPCluster,
      tdcProviderTiUPCluster
    )
  )

  const schemeKubePod = 'kube-pod'
  const tdcProviderKubePod = new (class
    implements vscode.TextDocumentContentProvider {
    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>()
    onDidChange = this.onDidChangeEmitter.event
    async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
      const podName = uri.path.split('.')[0]
      const cr = await shell.exec(`kubectl get pod ${podName} -o yaml`)
      return cr?.stdout || ''
    }
  })()
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      schemeKubePod,
      tdcProviderKubePod
    )
  )
}

// this method is called when your extension is deactivated
export function deactivate() { }

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

// TiUP Playground
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

// TiUP Cluster
async function displayClusters(clusterName?: string) {
  if (clusterName === undefined) {
    vscode.window.showErrorMessage('cluster name is unknown')
    return
  }

  const uri = vscode.Uri.parse(`tiup-cluster:display ${clusterName}`)
  const doc = await vscode.workspace.openTextDocument(uri) // calls back into the provider
  await vscode.window.showTextDocument(doc, { preview: false })
}

async function showPodInDocument(podName: string) {
  const uri = vscode.Uri.parse(`kube-pod:${podName}.yaml`)
  const doc = await vscode.workspace.openTextDocument(uri)
  await vscode.window.showTextDocument(doc, { preview: false })
}

async function checkEnvs() {
  // const workFolders = vscode.workspace.workspaceFolders
  // open guide
  const guideFile = path.join(__dirname, '..', 'doc', 'guide.md')
  vscode.commands.executeCommand(
    'markdown.showPreview',
    vscode.Uri.file(guideFile)
  )

  // check tiup
  const cr = await shell.exec('tiup --version')
  if (cr?.code !== 0) {
    const res = await vscode.window.showWarningMessage(
      "TiUP doesn't install, you need to install it before continuing",
      'Install'
    )
    if (res === 'Install') {
      await tiup.invokeAnyInNewTerminal(
        `curl --proto '=https' --tlsv1.2 -sSf https://tiup-mirrors.pingcap.com/install.sh | sh && exit`,
        'install tiup'
      )
    }
  }
}
