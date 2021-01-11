import * as vscode from 'vscode'
import { PlaygroundCommand } from './command'
import * as fs from 'fs'
import * as path from 'path'

export class PlaygroundProvider implements vscode.TreeDataProvider<Item> {
  public playgroundConfigPath: string = ''

  constructor(
    private workspaceRoot: string | undefined,
    private context: vscode.ExtensionContext
  ) {
    // initial config files
    const globalStoragePath = context.globalStoragePath
    const configFolderPath = path.join(globalStoragePath, 'playground')
    if (!fs.existsSync(configFolderPath)) {
      fs.mkdirSync(configFolderPath, { recursive: true })
    }
    const configFilePath = path.join(configFolderPath, 'config.toml')
    this.playgroundConfigPath = configFilePath
    if (!fs.existsSync(configFilePath)) {
      const templateFile = path.join(
        __dirname,
        '..',
        '..',
        'config-template',
        'playground',
        'config.toml'
      )
      fs.copyFileSync(templateFile, configFilePath)
    }
  }

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
      const running = await PlaygroundCommand.checkPlayground()
      if (!running) {
        items.push(
          new Item('start playground', vscode.TreeItemCollapsibleState.None, {
            command: 'ticode.playground',
            title: 'start playground',
          })
        )
      }

      // config
      items.push(
        new Item('config.toml', vscode.TreeItemCollapsibleState.None, {
          command: 'vscode.open',
          title: 'open',
          arguments: [vscode.Uri.file(this.playgroundConfigPath)],
        })
      )

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
      const instances = await PlaygroundCommand.displayPlayground()
      if (instances) {
        Object.keys(instances).forEach((inst) => {
          items.push(
            new Item(
              `${inst} (${instances[inst]})`,
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
