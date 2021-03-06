import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { shell } from '../shell'
import { handleError } from '../utils'

export class TopoProvider implements vscode.TreeDataProvider<Item> {
  public templateFolder: string = ''
  public localFolder: string = ''

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
    const templateClusterFolders = fs.readdirSync(this.templateFolder)
    // the result is only the folders name, not include path
    console.log('template-cluters:', templateClusterFolders)

    templateClusterFolders.forEach(async (folderName) => {
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

      folders.forEach((f) => {
        const item: Item = new Item(
          f,
          vscode.TreeItemCollapsibleState.Collapsed
        )
        if (f === '_shared') {
          item.contextValue = 'topo-vagrant-shared'
        } else {
          item.contextValue = 'topo-cluster-name'
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
        items.push(item)
      })
    }
    if (element?.contextValue === 'topo-cluster-name') {
      const clusterName = element.label

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
      items.push(vagrantItem)

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
      items.push(topoItem)
    }
    return items
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
