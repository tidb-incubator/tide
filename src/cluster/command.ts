import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as tmp from 'tmp'

import { shell } from '../shell'

// Name User Version Path PrivateKey
export type Cluster = Record<
  'name' | 'user' | 'version' | 'path' | 'privateKey',
  string
>

// ID Role Host Ports OS/Arch Status  Data Dir  Deploy Dir
export type ClusterInstance = Record<
  | 'id'
  | 'role'
  | 'host'
  | 'ports'
  | 'osArch'
  | 'status'
  | 'dataDir'
  | 'deployDir',
  string
>

export type InstanceAndCluster = {
  cluster: Cluster
  instance: ClusterInstance
}

type LogFileScpStatus = Record<string, boolean>
const logfileScpStatus: LogFileScpStatus = {}

export class ClusterCommand {
  // list clusters
  static async listClusters(): Promise<Cluster[]> {
    const clusters: Cluster[] = []
    const cr = await shell.exec('tiup cluster list')
    if (cr?.code === 0) {
      const lines = cr.stdout.trim().split('\n')
      let skip = true
      lines.forEach((line) => {
        if (!skip) {
          const [name, user, version, path, privateKey] = line.split(/\s+/)
          clusters.push({ name, user, version, path, privateKey })
        }
        if (line.startsWith('--')) {
          skip = false
        }
      })
    } else {
      vscode.window.showErrorMessage('Error:' + cr?.stderr + cr?.stdout)
    }
    return clusters
  }

  // display cluster
  static async displayCluster(
    clusterName: string
  ): Promise<Record<string, ClusterInstance[]>> {
    const comps: Record<string, ClusterInstance[]> = {}
    const cr = await shell.exec(`tiup cluster display ${clusterName}`)
    if (cr?.code === 0) {
      const lines = cr.stdout.trim().split('\n')
      let skip = true
      lines.forEach((line) => {
        if (!skip) {
          const [
            id,
            role,
            host,
            ports,
            osArch,
            status,
            dataDir,
            deployDir,
          ] = line.split(/\s+/)
          if (deployDir !== undefined) {
            comps[role] = (comps[role] || []).concat({
              id,
              role,
              host,
              ports,
              osArch,
              status,
              dataDir,
              deployDir,
            })
          }
        }
        if (line.startsWith('--')) {
          skip = false
        }
      })
    } else {
      vscode.window.showErrorMessage('Error:' + cr?.stderr + cr?.stdout)
    }
    return comps
  }

  // list instance files
  static async listInstanceFiles(
    instAndCluster: InstanceAndCluster,
    folderName: string
  ): Promise<string[]> {
    const { cluster, instance } = instAndCluster
    const cmd = `tiup cluster exec ${cluster.name} -N ${instance.host} --command "ls ${instance.deployDir}/${folderName}"`
    const cr = await shell.exec(cmd)

    const files: string[] = []
    if (cr?.code === 0) {
      const lines = cr.stdout.trim().split('\n')
      let skip = true
      lines.forEach((line) => {
        if (!skip) {
          if (line) {
            files.push(line)
          }
        }
        if (line.startsWith('stdout:')) {
          skip = false
        }
      })
    } else {
      vscode.window.showErrorMessage('Error:' + cr?.stderr + cr?.stdout)
    }
    return files
  }

  static async scpLogFile(
    fileName: string,
    inst: InstanceAndCluster,
    tempFolder: string
  ) {
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder)
    }

    const { instance, cluster } = inst
    const localLogFileName = `${cluster.name}-${instance.role}-${instance.id}-${fileName}`
    if (logfileScpStatus[localLogFileName]) {
      vscode.window.showInformationMessage(`${fileName} is loading`)
      return
    }

    const localLogFileFullPath = path.join(tempFolder, localLogFileName)
    const cmd = `scp -i ${cluster.privateKey} ${cluster.user}@${instance.host}:${instance.deployDir}/log/${fileName} "${localLogFileFullPath}"`
    logfileScpStatus[localLogFileName] = true
    vscode.window.showInformationMessage(`${fileName} is loading`)
    const cr = await shell.exec(cmd)
    logfileScpStatus[localLogFileName] = false
    if (cr?.code === 0) {
      vscode.commands.executeCommand(
        'vscode.open',
        vscode.Uri.file(localLogFileFullPath)
      )
    } else {
      vscode.window.showErrorMessage('Error:' + cr?.stderr + cr?.stdout)
    }
  }

  static async scpConfFile(
    fileName: string,
    inst: InstanceAndCluster,
    tempFolder: string
  ) {
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder)
    }

    const { instance, cluster } = inst
    const localFileName = `${cluster.name}-${instance.role}-${instance.id}-${fileName}`
    if (logfileScpStatus[localFileName]) {
      vscode.window.showInformationMessage(`${fileName} is loading`)
      return
    }

    const localOriFileName = 'ori-' + localFileName
    const localOriFileFullPath = path.join(tempFolder, localOriFileName)
    const cmd = `scp -i ${cluster.privateKey} ${cluster.user}@${instance.host}:${instance.deployDir}/conf/${fileName} "${localOriFileFullPath}"`
    logfileScpStatus[localFileName] = true
    vscode.window.showInformationMessage(`${fileName} is loading`)
    const cr = await shell.exec(cmd)
    logfileScpStatus[localFileName] = false

    if (cr?.code === 0) {
      const localFileFullPath = path.join(tempFolder, localFileName)
      if (!fs.existsSync(localFileFullPath)) {
        fs.copyFileSync(localOriFileFullPath, localFileFullPath)
      }
      vscode.commands.executeCommand(
        'vscode.diff',
        vscode.Uri.file(localOriFileFullPath),
        vscode.Uri.file(localFileFullPath),
        `${fileName} changes`
      )
    } else {
      vscode.window.showErrorMessage('Error:' + cr?.stderr + cr?.stdout)
    }
  }

  // start cluster

  // stop cluster

  // destroy cluster

  // deploy cluster

  // patch component

  // edit config
}
