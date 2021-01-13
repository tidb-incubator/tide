import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import {
  ClusterCommand,
  ClusterInstance,
  Cluster,
  InstanceAndCluster,
} from './command'

export class ClusterProvider implements vscode.TreeDataProvider<Item> {
  constructor(
    private workspaceRoot: string | undefined,
    private context: vscode.ExtensionContext
  ) {}

  private _onDidChangeTreeData: vscode.EventEmitter<
    Item | undefined | null | void
  > = new vscode.EventEmitter<Item | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<
    Item | undefined | null | void
  > = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  // the returned value will pass to other commands
  getTreeItem(element: Item): vscode.TreeItem {
    return element
  }

  async getChildren(element?: Item): Promise<Item[]> {
    const items: Item[] = []
    if (element === undefined) {
      const item = new Item(
        'clusters',
        vscode.TreeItemCollapsibleState.Expanded
      )
      item.contextValue = 'clusters'
      items.push(item)
      return Promise.resolve(items)
    }

    if (element.contextValue === 'clusters') {
      const clusters = await ClusterCommand.listClusters()
      clusters.forEach((cluster) => {
        const item = new Item(
          cluster.name,
          vscode.TreeItemCollapsibleState.Collapsed
        )
        item.description = cluster.version
        item.extra = cluster
        item.contextValue = 'cluster-name'
        items.push(item)
      })
    }
    if (element.contextValue === 'cluster-name') {
      const cluster = element.extra as Cluster

      const comps = await ClusterCommand.displayCluster(cluster.name)
      Object.keys(comps).forEach((comp) => {
        const item = new Item(
          `${comp} (${comps[comp].length})`,
          vscode.TreeItemCollapsibleState.Collapsed
        )
        item.extra = { cluster, instances: comps[comp] }
        item.contextValue = 'cluster-component'
        items.push(item)
      })
    }
    if (element.contextValue === 'cluster-component') {
      const cluster = element.extra.cluster as Cluster
      const instances = element.extra.instances as ClusterInstance[]

      instances.forEach((inst) => {
        const item = new Item(
          inst.id,
          vscode.TreeItemCollapsibleState.Collapsed
        )
        item.extra = { cluster, instance: inst } as InstanceAndCluster
        item.description = inst.status
        item.contextValue = 'cluster-instance'
        items.push(item)
      })
    }
    if (element.contextValue === 'cluster-instance') {
      const logsItem = new Item(
        'log',
        vscode.TreeItemCollapsibleState.Collapsed
      )
      logsItem.extra = element.extra
      logsItem.contextValue = 'cluster-instance-logs'
      items.push(logsItem)

      const configItem = new Item(
        'conf',
        vscode.TreeItemCollapsibleState.Collapsed
      )
      configItem.extra = element.extra
      configItem.contextValue = 'cluster-instance-confs'
      items.push(configItem)
    }
    if (element.contextValue === 'cluster-instance-logs') {
      const instAndCluster = element.extra as InstanceAndCluster
      const logFiles = await ClusterCommand.listInstanceLogs(instAndCluster)
      logFiles.forEach((logFile) => {
        const logItem = new Item(
          logFile,
          vscode.TreeItemCollapsibleState.None,
          {
            command: 'ticode.cluster.viewInstanceLog',
            title: 'View instance log',
            arguments: [logFile, instAndCluster],
          }
        )
        logItem.extra = instAndCluster
        logItem.contextValue = 'cluster-instance-log-file'
        items.push(logItem)
      })
    }
    // if collapsibleState is None, won't enter this logic
    // if (element.contextValue === 'cluster-instnace-log-file') {
    //   const a = element.label
    //   console.log('click log fiel:', a)
    // }

    return Promise.resolve(items)
  }
}

class Item extends vscode.TreeItem {
  public extra: any
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState)
  }
}
