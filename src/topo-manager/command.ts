import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { shell } from '../shell'
import { runNewTerminal } from '../utils'
export class TopoManagerCommand {
  static diffModification(
    templateFolder: string,
    localFolder: string,
    tempFolder: string,
    folderName: string,
    fileName: string
  ) {
    const templateFile = path.join(templateFolder, folderName, fileName)
    if (!fs.existsSync(templateFile)) {
      vscode.window.showErrorMessage(
        'Has no template file available to compare.'
      )
      return
    }
    // copy template file to temp folder
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder, { recursive: true })
    }
    const tempTemplateFile = path.join(tempFolder, fileName)
    fs.copyFileSync(templateFile, tempTemplateFile)

    // view diff
    const localFile = path.join(localFolder, folderName, fileName)
    vscode.commands.executeCommand(
      'vscode.diff',
      vscode.Uri.file(tempTemplateFile),
      vscode.Uri.file(localFile),
      `${fileName} changes`
    )
    vscode.window.showWarningMessage(
      'Notice the left side is the default template file, you should only modify the right side.'
    )
  }

  static async vagrantUp(localFolder: string, folderName: string) {
    const checkRet = await this.checkVagrant()
    if (!checkRet) {
      return
    }
    const fullFolderPath = path.join(localFolder, folderName)
    const cmd = `cd "${fullFolderPath}" && vagrant up && exit`
    runNewTerminal('vagrant up', cmd)
  }

  static async vagrantReload(localFolder: string, folderName: string) {
    const checkRet = await this.checkVagrant()
    if (!checkRet) {
      return
    }
    const fullFolderPath = path.join(localFolder, folderName)
    const cmd = `cd "${fullFolderPath}" && vagrant reload --provision && exit`
    runNewTerminal('vagrant reload', cmd)
  }

  static async vagrantDestroy(localFolder: string, folderName: string) {
    const checkRet = await this.checkVagrant()
    if (!checkRet) {
      return
    }
    const fullFolderPath = path.join(localFolder, folderName)
    const cmd = `cd "${fullFolderPath}" && vagrant destroy && exit`
    runNewTerminal('vagrant destroy', cmd)
  }

  static async checkVagrant(): Promise<boolean> {
    const cr = await shell.exec('vagrant -v')
    if (cr?.code !== 0) {
      this.showVagrantInstallGuide()
      return false
    }
    return true
  }

  static async showVagrantInstallGuide() {
    const res = await vscode.window.showInformationMessage(
      'Please install vagrant first.',
      'Install Guide'
    )
    if (res === 'Install Guide') {
      vscode.env.openExternal(
        vscode.Uri.parse('https://www.vagrantup.com/downloads')
      )
    }
  }
}
