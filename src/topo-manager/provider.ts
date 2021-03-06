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
      items.push(new Item('TODO', vscode.TreeItemCollapsibleState.None))
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
