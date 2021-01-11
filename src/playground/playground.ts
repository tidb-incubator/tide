import * as vscode from 'vscode'
import { PlaygroundCommand } from './command'

export class PlaygroundProvider implements vscode.TreeDataProvider<Item> {
  constructor(private workspaceRoot: string | undefined) {}

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
      // return Promise.resolve([
      //   new Item('start playground', vscode.TreeItemCollapsibleState.None),
      // ]);

      // install tiup
      // judge tiup installed?

      // start playground
      const running = await PlaygroundCommand.checkRunPlayground()
      if (!running) {
        items.push(
          new Item('start playground', vscode.TreeItemCollapsibleState.None, {
            command: 'ticode.playground',
            title: 'start playground',
          })
        )
      }

      // config

      // restart playground

      // instances
      if (running) {
        items.push(
          new Item('instances', vscode.TreeItemCollapsibleState.Expanded)
        )
      }

      return Promise.resolve(items)
    }
    if (element.label === 'instances') {
      const running = await PlaygroundCommand.checkRunPlayground()
      if (running) {
        Object.keys(running).forEach((inst) => {
          items.push(
            new Item(
              `${inst} (${running[inst]})`,
              vscode.TreeItemCollapsibleState.None
            )
          )
        })
      }
    }

    return Promise.resolve(items)
  }
}

class Item extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState)
  }
}
