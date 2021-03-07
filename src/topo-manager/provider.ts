import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { shell } from '../shell'
import { handleError } from '../utils'

export class TopoProvider implements vscode.TreeDataProvider<Item> {
  public templateFolder: string = ''
  public localFolder: string = ''

  public templateClusterFolders: string[] = []

  constructor(private context: vscode.ExtensionContext) {
    // copy template files
    this.templateFolder = path.join(
      __dirname,
      '..',
      '..',
      'template',
      'cluster-topos'
    )
    this.localFolder = path.join(context.globalStoragePath, 'cluster-topos')
    if (!fs.existsSync(this.localFolder)) {
      fs.mkdirSync(this.localFolder, { recursive: true })
    }
    console.log('local folder:', this.localFolder)
    this.copyTemplateFiles()
  }

  async copyTemplateFiles() {
    this.templateClusterFolders = fs.readdirSync(this.templateFolder)
    // the result is only the folders name, not include path
    console.log('template-cluters:', this.templateClusterFolders)

    this.templateClusterFolders.forEach(async (folderName) => {
      const localClusterFolder = path.join(this.localFolder, folderName)
      if (!fs.existsSync(localClusterFolder)) {
        // copy
        const fullSourceFolder = path.join(this.templateFolder, folderName)
        // notice, if the path include blankspace, we need to use `"` to wrap it
        const cmd = `cp -r ${fullSourceFolder} "${this.localFolder}"`
        const cr = await shell.exec(cmd)
        if (cr?.code !== 0) {
          handleError(cr)
        }
      }
    })
  }

  getTreeItem(element: Item): vscode.TreeItem {
    return element
  }

  async getChildren(element?: Item): Promise<Item[]> {
    const items: Item[] = []
    if (element === undefined) {
      const folders = fs.readdirSync(this.localFolder)
      const nonTemplatedFolders = folders.filter(
        (f) => this.templateClusterFolders.indexOf(f) < 0
      )
      const allFolders = this.templateClusterFolders.concat(nonTemplatedFolders)

      allFolders.forEach((f) => {
        const item: Item = new Item(
          f,
          vscode.TreeItemCollapsibleState.Collapsed
        )
        if (f === '_shared') {
          item.contextValue = 'topo-vagrant-shared'
        } else if (this.templateClusterFolders.indexOf(f) >= 0) {
          item.contextValue = 'topo-cluster-templated'
        } else {
          item.contextValue = 'topo-cluster-added'
        }
        items.push(item)
      })
    }
    if (element?.contextValue === 'topo-vagrant-shared') {
      const fullSharedFolderPath = path.join(this.localFolder, element.label)
      const subFiles = fs.readdirSync(fullSharedFolderPath)
      subFiles.forEach((f) => {
        const fullFilePath = path.join(fullSharedFolderPath, f)
        const item = new Item(f, vscode.TreeItemCollapsibleState.None, {
          command: 'vscode.open',
          title: 'open',
          arguments: [vscode.Uri.file(fullFilePath)],
        })
        // remember the folderName
        item.extra = element.label
        item.contextValue = 'topo-file-shared'
        items.push(item)
      })
    }
    if (
      element?.contextValue === 'topo-cluster-templated' ||
      element?.contextValue === 'topo-cluster-added'
    ) {
      const clusterName = element.label

      // topology.yaml
      const fullTopoFilePath = path.join(
        this.localFolder,
        clusterName,
        'topology.yaml'
      )
      const topoItem: Item = new Item(
        'topology.yaml',
        vscode.TreeItemCollapsibleState.None,
        {
          command: 'vscode.open',
          title: 'open',
          arguments: [vscode.Uri.file(fullTopoFilePath)],
        }
      )
      // remember the folderName
      topoItem.extra = clusterName
      topoItem.contextValue = 'topo-file-topology'
      items.push(topoItem)

      // Vagrantfile
      const fullVagrantfilePath = path.join(
        this.localFolder,
        clusterName,
        'Vagrantfile'
      )
      const vagrantItem: Item = new Item(
        'Vagrantfile',
        vscode.TreeItemCollapsibleState.None,
        {
          command: 'vscode.open',
          title: 'open',
          arguments: [vscode.Uri.file(fullVagrantfilePath)],
        }
      )
      // remember the folderName
      vagrantItem.extra = clusterName
      vagrantItem.contextValue = 'topo-file-vagrantfile'
      items.push(vagrantItem)

      // virtual machines
      const vagrantFolder = path.join(this.localFolder, clusterName, '.vagrant')
      if (fs.existsSync(vagrantFolder)) {
        const vmsItem = new Item(
          'virtual machines',
          vscode.TreeItemCollapsibleState.Collapsed
        )
        vmsItem.extra = clusterName
        vmsItem.contextValue = 'topo-vms'
        items.push(vmsItem)
      }
    }
    if (element?.contextValue === 'topo-vms') {
      const clusterName = element.extra
      const fullFolderPath = path.join(this.localFolder, clusterName)
      const cmd = `cd "${fullFolderPath}" && vagrant status --machine-readable | grep state,`
      const cr = await shell.exec(cmd)
      if (cr?.code !== 0) {
        handleError(cr)
      } else {
        // output example
        // > vagrant status --machine-readable | grep state,
        // 1615034507,node1,state,running
        // 1615034507,node2,state,running
        // 1615034507,node3,state,running
        // 1615034507,node4,state,running
        const lines = cr.stdout.trim().split('\n')
        lines.forEach((line) => {
          const [_id, name, _state, status] = line.split(',')

          const item = new Item(name, vscode.TreeItemCollapsibleState.None)
          item.description = status
          item.extra = clusterName
          item.contextValue = 'topo-vm'
          items.push(item)
        })
      }
    }

    return items
  }

  ///////////////
  // refresh
  private _onDidChangeTreeData: vscode.EventEmitter<
    Item | undefined | null | void
  > = new vscode.EventEmitter<Item | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<
    Item | undefined | null | void
  > = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }
}

class Item extends vscode.TreeItem {
  public extra?: any
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState)
  }
}
