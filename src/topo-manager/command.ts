import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { shell } from '../shell'
import { handleError, runNewTerminal } from '../utils'

export type DeployType = 'password' | 'vagrant_private_key' | 'self_private_key'

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
      'Notice you should only edit the right side, the left side is the template file'
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
    runNewTerminal(`vagrant ssh ${machineName}`, cmd)
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
    this.refresh()
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
    this.refresh()
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
    this.refresh()
  }

  static async deploy(
    localFolder: string,
    folderName: string,
    deployType: DeployType
  ) {
    // select tidb version
    const tidbVersion = await vscode.window.showQuickPick(
      this.getTiDBVesions(),
      { placeHolder: 'Select tidb version' }
    )
    if (tidbVersion === undefined) {
      return
    }
    // input machines user name for login
    let machineUserName: string | undefined = 'vagrant'
    if (deployType !== 'vagrant_private_key') {
      machineUserName = await vscode.window.showInputBox({
        prompt: 'input the machines user name for login',
        placeHolder: 'machines username',
      })
      if (machineUserName === undefined) {
        return
      }
    }
    // select private key
    const fullFolderPath = path.join(localFolder, folderName)
    if (deployType === 'self_private_key') {
      // check private_key exist
      const selfPrivateKey = path.join(fullFolderPath, 'private_key')
      if (!fs.existsSync(selfPrivateKey)) {
        const filePath = await vscode.window.showOpenDialog({
          openLabel: "Select machine's private key for login",
          canSelectMany: false,
          title: "Select machine's private key for login",
        })
        if (filePath === undefined) {
          return
        }
        fs.copyFileSync(filePath[0].path, selfPrivateKey)
        this.refresh()
      }
    }

    // cmd
    let cmdFlags = ''
    if (deployType === 'password') {
      cmdFlags = '-p'
      vscode.window.showInformationMessage(
        'Notice to input the machine login passowrd in the terminal manually.'
      )
    } else if (deployType === 'vagrant_private_key') {
      cmdFlags = '-i ../_shared/vagrant_key'
    } else if (deployType === 'self_private_key') {
      cmdFlags = '-i ./private_key'
    }

    const fullCmd = `cd "${fullFolderPath}" && tiup cluster deploy ${folderName} ${tidbVersion} topology.yaml -u ${machineUserName} ${cmdFlags} -y && exit`
    runNewTerminal('deploy', fullCmd)
  }

  static async removeSelfKey(localFolder: string, folderName: string) {
    const fullPath = path.join(localFolder, folderName, 'private_key')
    fs.unlinkSync(fullPath)
    this.refresh()
  }

  static refresh() {
    vscode.commands.executeCommand('ticode.topo.refresh')
  }

  /////////////
  static tidbVersions: string[] = []
  static defTiDBVersions: string[] = [
    'nightly',
    'v5.0.0-rc',
    'v4.0.11',
    'v4.0.10',
    'v4.0.9',
  ]
  static async getTiDBVesions() {
    if (this.tidbVersions.length > 0) {
      return this.tidbVersions
    }
    const cr = await shell.exec('tiup list tidb')
    if (cr?.code !== 0) {
      handleError(cr)
      return this.defTiDBVersions
    }
    // > tiup list tidb
    // Available versions for tidb:
    // Version                             Installed  Release                              Platforms
    // -------                             ---------  -------                              ---------
    // nightly -> v5.0.0-nightly-20210311             2021-03-11T07:36:35+08:00            darwin/amd64,linux/amd64,linux/arm64
    // v3.0                                           2020-04-16T16:58:06+08:00            darwin/amd64,linux/amd64
    // v3.0.0                                         2020-04-16T14:03:31+08:00            darwin/amd64,linux/amd64
    // v3.0.1                                         2020-04-27T19:38:36+08:00            darwin/amd64,linux/amd64,linux/arm64
    const lines = cr.stdout.trim().split('\n')
    const versions: string[] = []
    lines.forEach((line) => {
      if (line.startsWith('v')) {
        const version = line.split(' ')[0]
        versions.push(version)
      }
    })
    this.tidbVersions = ['nightly'].concat(versions.reverse())
    return this.tidbVersions
  }
}
