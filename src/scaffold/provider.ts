import * as vscode from 'vscode'
export class ScaffoldProvider implements vscode.TreeDataProvider<Item> {
  getTreeItem(element: Item): vscode.TreeItem {
    return element
  }

  async getChildren(element?: Item): Promise<Item[]> {
    const items: Item[] = []
    if (element === undefined) {
      items.push(
        new Item(
          'Add new app to dashboard',
          vscode.TreeItemCollapsibleState.None,
          {
            command: 'ticode.scaffold.addDashboardApp',
            title: 'Add new dashboard APP',
          }
        )
      )

      items.push(
        new Item('Add coprocessor (todo)', vscode.TreeItemCollapsibleState.None)
      )
    }
    return items
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
