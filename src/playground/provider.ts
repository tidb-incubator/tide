import * as vscode from 'vscode'
import { PlaygroundCommand } from './command'
import * as fs from 'fs'
import * as path from 'path'

export class PlaygroundProvider implements vscode.TreeDataProvider<Item> {
  public playgroundConfigFolder: string = ''
  public playgroundConfigPath: string = ''
  public playgroundDefaultConfigPath: string = ''

  constructor(
    private context: vscode.ExtensionContext
  ) {
    // initial config files
    this.playgroundConfigFolder = path.join(
      context.globalStoragePath,
      'playground'
    )
    if (!fs.existsSync(this.playgroundConfigFolder)) {
      fs.mkdirSync(this.playgroundConfigFolder, { recursive: true })
    }

    this.playgroundConfigPath = path.join(
      this.playgroundConfigFolder,
      'playground.toml'
    )
    this.playgroundDefaultConfigPath = path.join(
      this.playgroundConfigFolder,
      'default.toml'
    )
    if (!fs.existsSync(this.playgroundConfigPath)) {
      this.reloadConfig()
    }
    if (!fs.existsSync(this.playgroundDefaultConfigPath)) {
      this.reloadDefaultConfig()
    }

    // init component configs
    // tidb.config, tikv.config, pd.config
    const componentsConfigFolder = path.join(
      this.playgroundConfigFolder,
      'components-config'
    )
    ;[
      'tidb.config',
      'tikv.config',
      'pd.config',
      'tiflash.config',
      'drain.config',
      'pump.config',
    ].forEach((c) => this.initComponentConfig(componentsConfigFolder, c))
  }

  initComponentConfig(folder: string, fileName: string) {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true })
    }
    const fileFullPath = path.join(folder, fileName)
    if (!fs.existsSync(fileFullPath)) {
      fs.writeFileSync(fileFullPath, '')
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

  reloadConfig() {
    const templateFile = path.join(
      __dirname,
      '..',
      '..',
      'config-template',
      'playground',
      'playground.toml',
    )
    fs.copyFileSync(templateFile, this.playgroundConfigPath)
  }

  reloadDefaultConfig() {
    const templateFile = path.join(
      __dirname,
      '..',
      '..',
      'config-template',
      'playground',
      'default.toml',
    )
    fs.copyFileSync(templateFile, this.playgroundDefaultConfigPath)
  }

  getTreeItem(element: Item): vscode.TreeItem {
    return element
  }

  async getChildren(element?: Item): Promise<Item[]> {
    const items: Item[] = []
    if (element === undefined) {
      // install tiup
      // judge tiup installed?

      // start playground
      const running = await PlaygroundCommand.checkPlaygroundRun()
      if (!running) {
        items.push(
          new Item(
            'start default playground',
            vscode.TreeItemCollapsibleState.None,
            {
              command: 'ticode.playground.start',
              title: 'start playground',
            }
          )
        )
      } else {
        items.push(
          new Item('stop playground', vscode.TreeItemCollapsibleState.None, {
            command: 'ticode.playground.stop',
            title: 'stop playground',
          })
        )
      }

      // config
      const configItem = new Item(
        'playground.toml',
        vscode.TreeItemCollapsibleState.None,
        {
          command: 'vscode.open',
          title: 'open',
          arguments: [vscode.Uri.file(this.playgroundConfigPath)],
        }
      )
      // https://code.visualstudio.com/api/extension-guides/tree-view
      configItem.contextValue = 'playground-config'
      items.push(configItem)

      // components config
      items.push(
        new Item('components-config', vscode.TreeItemCollapsibleState.Collapsed)
      )

      // instances
      if (running) {
        items.push(
          new Item('cluster', vscode.TreeItemCollapsibleState.Expanded)
        )
      }

      return Promise.resolve(items)
    }
    if (element.label === 'cluster') {
      const instances = await PlaygroundCommand.displayPlayground()
      if (instances) {
        Object.keys(instances).forEach((inst) => {
          const item = new Item(
            `${inst} (${instances[inst].length})`,
            vscode.TreeItemCollapsibleState.None
          )
          item.contextValue = 'playground-instance'
          item.extra = { comp: inst, pids: instances[inst] }
          items.push(item)
        })
      }
    }
    if (element.label === 'components-config') {
      const componentsConfigFolder = path.join(
        this.playgroundConfigFolder,
        'components-config'
      )
      fs.readdirSync(componentsConfigFolder).forEach((f) => {
        const fullPath = path.join(componentsConfigFolder, f)
        items.push(
          new Item(f, vscode.TreeItemCollapsibleState.None, {
            command: 'vscode.open',
            title: 'open',
            arguments: [vscode.Uri.file(fullPath)],
          })
        )
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
