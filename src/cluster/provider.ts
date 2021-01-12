import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export class ClusterProvider implements vscode.TreeDataProvider<Item> {
  constructor(
    private workspaceRoot: string | undefined,
    private context: vscode.ExtensionContext
  ) {}

  getTreeItem(element: Item): vscode.TreeItem {
    return element
  }

  async getChildren(element?: Item): Promise<Item[]> {
    const items: Item[] = []
    if (element === undefined) {
      items.push(
        new Item('clusters', vscode.TreeItemCollapsibleState.Collapsed)
      )
    } else {
      if (element.label === 'clusters') {
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
