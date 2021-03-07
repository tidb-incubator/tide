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
    const res = await vscode.window.showWarningMessage(
      `Are you sure to remove this virtual machine? If you have deployed a cluster in it, you need to destroy the cluster first.`,
      'Let me think',
      'Remove it anyway'
    )
    if (res === 'Let me think') {
      return
    }
    const fullFolderPath = path.join(localFolder, folderName)
    const cmd = `cd "${fullFolderPath}" && vagrant destroy --force && exit`
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

  static async vagrantSSH(
    localFolder: string,
    folderName: string,
    machineName: string
  ) {
    const checkRet = await this.checkVagrant()
    if (!checkRet) {
      return
    }
    const fullFolderPath = path.join(localFolder, folderName)
    const cmd = `cd "${fullFolderPath}" && vagrant ssh ${machineName} && exit`
    runNewTerminal('vagrant ssh', cmd)
  }

  static async addTopo(localFolder: string) {
    let clusterName = await vscode.window.showInputBox({
      prompt: 'Your cluster name',
    })
    if (!clusterName || clusterName.trim() === '') {
      return
    }
    const folders = fs.readdirSync(localFolder)
    if (folders.indexOf(clusterName) >= 0) {
      vscode.window.showErrorMessage(
        'The cluster name exists, please choose another name.'
      )
      return
    }
    const fullFolderPath = path.join(localFolder, clusterName)
    fs.mkdirSync(fullFolderPath, { recursive: true })

    const topologyFile = path.join(fullFolderPath, 'topology.yaml')
    fs.writeFileSync(topologyFile, '# add your content here')
    const vagrantFile = path.join(fullFolderPath, 'Vagrantfile')
    fs.writeFileSync(vagrantFile, '# add your content here')

    vscode.commands.executeCommand('ticode.topo.refresh')
  }

  static async removeTopo(localFolder: string, folderName: string) {
    const res = await vscode.window.showWarningMessage(
      "Are you sure to remove this cluster configurations? Although it only deletes the configure files, but it can't rollback.",
      'Let me think',
      'Remove anyway'
    )
    if (res === 'Let me think') {
      return
    }
    const fullFolderPath = path.join(localFolder, folderName)
    fs.rmdirSync(fullFolderPath, { recursive: true })

    vscode.commands.executeCommand('ticode.topo.refresh')
  }

  static async renameTopo(localFolder: string, folderName: string) {
    let clusterName = await vscode.window.showInputBox({
      prompt: 'Your cluster name',
      value: folderName,
    })
    if (
      !clusterName ||
      clusterName.trim() === '' ||
      clusterName.trim() === folderName
    ) {
      return
    }
    const folders = fs.readdirSync(localFolder)
    if (folders.indexOf(clusterName) >= 0) {
      vscode.window.showErrorMessage(
        'The cluster name exists, please choose another name.'
      )
      return
    }
    const srcFolderPath = path.join(localFolder, folderName)
    const targetFolderPath = path.join(localFolder, clusterName)
    fs.renameSync(srcFolderPath, targetFolderPath)

    vscode.commands.executeCommand('ticode.topo.refresh')
  }
}
