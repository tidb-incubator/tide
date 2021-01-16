import * as vscode from 'vscode'
import {
  ClusterCommand,
  ClusterInstance,
  Cluster,
  InstanceAndCluster,
  ClusterComponent,
} from './command'

export class ClusterProvider implements vscode.TreeDataProvider<Item> {
  constructor() {}

  // TODO: save cluster and instances in memory

  private _onDidChangeTreeData: vscode.EventEmitter<
    Item | undefined | null | void
  > = new vscode.EventEmitter<Item | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<
    Item | undefined | null | void
  > = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  // the returned value will pass to other commands in the context menu
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

      const topoItem = new Item(
        'cluster topo',
        vscode.TreeItemCollapsibleState.None,
        {
          command: 'ticode.cluster.viewTopo',
          title: 'View cluster topo',
          arguments: [cluster],
        }
      )
      items.push(topoItem)

      // view cluste global config
      const globalConfigItem = new Item(
        'cluster config',
        vscode.TreeItemCollapsibleState.None,
        {
          command: 'ticode.cluster.viewGlobalConfig',
          title: 'View cluster global config',
          arguments: [cluster],
        }
      )
      globalConfigItem.extra = cluster
      globalConfigItem.contextValue = 'cluster-global-config'
      items.push(globalConfigItem)

      const comps = await ClusterCommand.displayCluster(cluster.name)
      Object.keys(comps).forEach((comp) => {
        const item = new Item(
          `${comp} (${comps[comp].length})`,
          vscode.TreeItemCollapsibleState.Collapsed
        )
        item.extra = {
          cluster,
          role: comp,
          instances: comps[comp],
        } as ClusterComponent
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
      logsItem.extra = element.extra // InstanceAndCluster
      logsItem.contextValue = 'cluster-instance-logs'
      items.push(logsItem)

      const configItem = new Item(
        'conf',
        vscode.TreeItemCollapsibleState.Collapsed
      )
      configItem.extra = element.extra // InstanceAndCluster
      configItem.contextValue = 'cluster-instance-confs'
      items.push(configItem)
    }
    if (element.contextValue === 'cluster-instance-logs') {
      const instAndCluster = element.extra as InstanceAndCluster
      const logFiles = await ClusterCommand.listInstanceFiles(
        instAndCluster,
        'log'
      )
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

    if (element.contextValue === 'cluster-instance-confs') {
      const instAndCluster = element.extra as InstanceAndCluster
      const confFiles = await ClusterCommand.listInstanceFiles(
        instAndCluster,
        'conf'
      )
      confFiles.forEach((confFile) => {
        const confItem = new Item(
          confFile,
          vscode.TreeItemCollapsibleState.None,
          {
            command: 'ticode.cluster.viewInstanceConf',
            title: 'View instance conf',
            arguments: [confFile, instAndCluster],
          }
        )
        confItem.extra = instAndCluster
        confItem.contextValue = 'cluster-instance-conf-file'
        items.push(confItem)
      })
    }

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
