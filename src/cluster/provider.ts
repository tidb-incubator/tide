import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { ClusterCommand } from './command'

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

  getTreeItem(element: Item): vscode.TreeItem {
    return element
  }

  async getChildren(element?: Item): Promise<Item[]> {
    const items: Item[] = []
    if (element === undefined) {
      const item = new Item(
        'clusters',
        vscode.TreeItemCollapsibleState.Collapsed
        // {
        //   command: 'ticode.cluster.list',
        //   title: 'List cluster',
        // }
      )
      item.contextValue = 'clusters'
      items.push(item)
    } else {
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
        const instances = await ClusterCommand.displayCluster(element.label)
        instances.forEach((inst) => {
          const item = new Item(inst.role, vscode.TreeItemCollapsibleState.None)
          item.extra = inst
          item.description = `${inst.id} (${inst.status.toLocaleLowerCase()})`
          item.contextValue = 'cluster-instance'
          items.push(item)
        })
      }
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
