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

  // list instance logs
  static async listInstanceLogs(
    instAndCluster: InstanceAndCluster
  ): Promise<string[]> {
    const { cluster, instance } = instAndCluster
    const cmd = `tiup cluster exec ${cluster.name} -N ${instance.host} --command "ls ${instance.deployDir}/log"`
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

  // use a uuid to record whether it is copying
  static async scpFile(fileName: string, inst: InstanceAndCluster) {
    const { instance, cluster } = inst
    const tmpFile = tmp.fileSync({
      discardDescriptor: true,
      prefix: cluster.name,
      postfix: fileName,
    })
    const cmd = `scp -i ${cluster.privateKey} ${cluster.user}@${instance.host}:${instance.deployDir}/log/${fileName} ${tmpFile.name}`
    const cr = await shell.exec(cmd)
    if (cr?.code === 0) {
      vscode.commands.executeCommand(
        'vscode.open',
        vscode.Uri.file(tmpFile.name)
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
