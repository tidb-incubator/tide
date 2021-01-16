import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

import { shell, Platform } from '../shell'
import { TiUP } from '../tiup'
import { handleError } from '../utils'

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

export type ClusterComponent = {
  cluster: Cluster
  role: string
  instances: ClusterInstance[]
}

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
    if (cr?.code !== 0) {
      handleError(cr)
      return clusters
    }
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
      fs.mkdirSync(tempFolder, { recursive: true })
    }

    const { instance, cluster } = inst
    const localLogFileName = `${cluster.name}-${instance.role}-${instance.id}-${fileName}.log`
    if (logfileScpStatus[localLogFileName]) {
      vscode.window.showInformationMessage(`${fileName} is loading`)
      return
    }

    const localLogFileFullPath = path.join(tempFolder, localLogFileName)
    const cmd = `scp -oStrictHostKeyChecking=no -i ${cluster.privateKey} ${cluster.user}@${instance.host}:${instance.deployDir}/log/${fileName} "${localLogFileFullPath}"`
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
      fs.mkdirSync(tempFolder, { recursive: true })
    }

    const { instance, cluster } = inst
    const localFileName = `${cluster.name}-${instance.role}-${instance.id}-${fileName}`
    if (logfileScpStatus[localFileName]) {
      vscode.window.showInformationMessage(`${fileName} is loading`)
      return
    }

    const localOriFileName = 'ori-' + localFileName
    const localOriFileFullPath = path.join(tempFolder, localOriFileName)
    const cmd = `scp -oStrictHostKeyChecking=no -i ${cluster.privateKey} ${cluster.user}@${instance.host}:${instance.deployDir}/conf/${fileName} "${localOriFileFullPath}"`
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

  static async applyConfFile(
    fileName: string,
    inst: InstanceAndCluster,
    tempFolder: string
  ) {
    const { instance, cluster } = inst

    const localFileName = `${cluster.name}-${instance.role}-${instance.id}-${fileName}`
    const localFileFullPath = path.join(tempFolder, localFileName)
    const newConf = fs.readFileSync(localFileFullPath, { encoding: 'utf-8' })

    const localOriFileName = 'ori-' + localFileName
    const localOriFileFullPath = path.join(tempFolder, localOriFileName)
    const oriConf = fs.readFileSync(localOriFileFullPath, { encoding: 'utf-8' })

    if (newConf === oriConf) {
      vscode.window.showInformationMessage(`${fileName} has no changes!`)
      return
    }
    const cmd = `scp -oStrictHostKeyChecking=no -i ${cluster.privateKey} "${localFileFullPath}" ${cluster.user}@${instance.host}:${instance.deployDir}/conf/${fileName}`
    vscode.window.showInformationMessage(`Applying new ${fileName}!`)
    const cr = await shell.exec(cmd)
    if (cr?.code === 0) {
      vscode.window.showInformationMessage(`New ${fileName} is applied!`)
      fs.copyFileSync(localFileFullPath, localOriFileFullPath)
    } else {
      vscode.window.showErrorMessage('Error:' + cr?.stderr + cr?.stdout)
    }
  }

  // copy global config file
  static async copyGloalConfigFile(cluster: Cluster, tempFolder: string) {
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder, { recursive: true })
    }

    const editFileName = `${cluster.name}-meta.yaml`
    const bakFileName = 'ori-' + editFileName

    // sync and bak
    const bakFileFullPath = path.join(tempFolder, bakFileName)
    const originalFileFullPath = path.join(cluster.path, 'meta.yaml')
    fs.copyFileSync(originalFileFullPath, bakFileFullPath)

    const editFileFullPath = path.join(tempFolder, editFileName)
    if (!fs.existsSync(editFileFullPath)) {
      fs.copyFileSync(bakFileFullPath, editFileFullPath)
    }
    vscode.commands.executeCommand(
      'vscode.diff',
      vscode.Uri.file(bakFileFullPath),
      vscode.Uri.file(editFileFullPath),
      `${cluster.name} global config changes`
    )
  }

  static async applyGlobalConfigFile(
    cluster: Cluster,
    tempFolder: string,
    restart: boolean,
    tiup: TiUP
  ) {
    const res = await vscode.window.showWarningMessage(
      'Are you sure?',
      'Let me check again',
      'Apply anyway'
    )
    if (res !== 'Apply anyway') {
      return
    }

    const editFileName = `${cluster.name}-meta.yaml`
    const editFileFullPath = path.join(tempFolder, editFileName)
    const originalFileFullPath = path.join(cluster.path, 'meta.yaml')
    fs.copyFileSync(editFileFullPath, originalFileFullPath)
    tiup.invokeInSharedTerminal(
      `cluster reload ${cluster.name} ${restart ? '' : '--skip-restart'}`
    )
  }

  // start cluster
  static async startCluster(clusterName: string, tiup: TiUP) {
    await tiup.invokeInSharedTerminal(`cluster start ${clusterName}`)
  }

  // stop cluster
  static async stopCluster(clusterName: string, tiup: TiUP) {
    await tiup.invokeInSharedTerminal(`cluster stop ${clusterName}`)
  }

  // restart cluster
  static async restartCluster(clusterName: string, tiup: TiUP) {
    await tiup.invokeInSharedTerminal(`cluster restart ${clusterName}`)
  }

  // destroy cluster
  static async destroyCluster(clusterName: string, tiup: TiUP) {
    const res = await vscode.window.showWarningMessage(
      'DANGER!!! Are you sure you want to destroy this cluster?',
      'Let me think',
      'Destroy anyway'
    )
    if (res === 'Destroy anyway') {
      await tiup.invokeInSharedTerminal(`cluster destroy ${clusterName} -y`)
    }
  }

  // open dashboard
  static async openDashboard(clusterName: string, tiup: TiUP) {
    const cr = await shell.exec(`tiup cluster display ${clusterName}`)
    if (cr?.code !== 0) {
      handleError(cr)
      return
    }
    const lines = cr.stdout.trim().split('\n')
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/Dashboard URL:\s+(\S+)/)
      if (m) {
        const url = m[1]
        vscode.env.openExternal(vscode.Uri.parse(url))
        return
      }
    }
  }

  // open grafana
  static async openGrafana(clusterName: string, tiup: TiUP) {
    const cr = await shell.exec(`tiup cluster display ${clusterName}`)
    if (cr?.code !== 0) {
      handleError(cr)
      return
    }
    const lines = cr.stdout.trim().split('\n')
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/(\S+)\s+grafana/)
      if (m) {
        const url = m[1]
        vscode.env.openExternal(vscode.Uri.parse(`http://${url}`))
        return
      }
    }
    vscode.window.showErrorMessage(
      'Open grafana failed, you may not install it.'
    )
  }

  // ssh
  static async ssh(inst: InstanceAndCluster) {
    const { instance, cluster } = inst
    const cmd = `ssh -oStrictHostKeyChecking=no -i ${cluster.privateKey} -t ${cluster.user}@${instance.host} "cd ${instance.deployDir}; bash"`
    const t = vscode.window.createTerminal(
      `ssh ${instance.host} ${instance.role}`
    )
    t.sendText(cmd)
    t.show()
  }

  // debug
  static async debug(inst: InstanceAndCluster) {
    const { instance, cluster } = inst
    const instanceName = instance.role
    // TODO: pd, tikv
    if (['tidb'].indexOf(instanceName) < 0) {
      vscode.window.showErrorMessage(`debug ${instanceName} is not supported yet `);
      return
    }
    const wd = (vscode.workspace.workspaceFolders || []).find((folder) => folder.name == instanceName);
    if (!wd) {
      vscode.window.showErrorMessage(`${instanceName} is not included in workspace, maybe you want to try 'ticode init'?`);
      return
    }
    switch (instanceName) {
      case "tidb" :{
        const cmd = `ssh -oStrictHostKeyChecking=no -i ${cluster.privateKey} -t ${cluster.user}@${instance.host} "cd ${instance.deployDir}; ./bin/dlv --headless --listen=:45678 --api-version 2 attach \\$(pidof tidb-server)"`
        const remote = vscode.window.createTerminal(`debug ${instanceName}`)
        remote.sendText(cmd)
        remote.show()
        const debugConfiguration = {
          type: "go",
          request: "attach",
          name: "Attach Remote TiDB",
          mode: "remote",
          remotePath: wd.uri.fsPath,
          port: "45678",
          host: instance.host,
        };
        setTimeout(() => vscode.debug.startDebugging(wd, debugConfiguration), 3 * 1000)
        break
      }
      case "pd" :{
        const debugConfiguration = {
          type: "go",
          request: "attach",
          name: "Attach Remote PD",
          mode: "remote",
          remotePath: `${instance.deployDir}/bin/pd-server`,
          port: "45678",
          host: instance.host,
        };
        vscode.debug.startDebugging(wd, debugConfiguration)
        break
      }
      // TODO
      case "tikv" :{
        // unreachable
      }
    }
  }

  // patch component
  static async patchByCurrent(
    treeItemExtra: ClusterComponent | InstanceAndCluster,
    treeItemContextValue: string
  ) {
    // warn
    const res = await vscode.window.showInformationMessage(
      'If you need to modify the cluster or instance config at the same time, please do it before patching to save your time',
      'Let me check',
      'Patch anyway'
    )
    if (res === 'Let me check') {
      return
    }

    let compRole = 'unknown'
    let patchTarget = ''
    let deployDir = ''
    if (treeItemContextValue === 'cluster-component') {
      const { cluster, role, instances } = treeItemExtra as ClusterComponent
      compRole = role
      patchTarget = `-R ${role}`
      // FIXME: hack, we think all instance has same deploy dir
      deployDir = instances[0].deployDir
    }
    if (treeItemContextValue === 'cluster-instance') {
      const { instance, cluster } = treeItemExtra as InstanceAndCluster
      compRole = instance.role
      patchTarget = `-N ${instance.id}`
      deployDir = instance.deployDir
    }

    // check repo
    let targetFolder = vscode.workspace.rootPath
    if (targetFolder && !targetFolder.endsWith(compRole)) {
      vscode.window.showErrorMessage(`This is not ${compRole} repo`)
      return
    } else {
      let workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders) {
        vscode.window.showErrorMessage(`This is not ${compRole} repo`)
        return
      }
      for (let i = 0; i < workspaceFolders.length; i++) {
        const folder = workspaceFolders[i]
        if (folder.uri.path.endsWith(compRole)) {
          targetFolder = folder.uri.path
          break
        }
      }
    }
    if (!targetFolder) {
      vscode.window.showErrorMessage(`There is no ${compRole} repo`)
      return
    }

    const tar = `/tmp/${compRole}.tar.gz`
    let cmds: string[] = []
    // case by case
    // TODO: use tasks provider to replace
    if (compRole === 'tidb') {
      // compile
      cmds.push(`cd ${targetFolder} && GOOS=linux GOARCH=amd64 go build -gcflags='-N -l' -o ./bin/tidb-server tidb-server/main.go`)
      // hack to weave in dlv
      // hard-code dlv path...
      cmds.push(`cd ${targetFolder}/bin && mv ~/dlv ./`)
      // replace
      cmds.push(`cd ${targetFolder}/bin && tar cvzf ${tar} * && tiup cluster patch ${treeItemExtra.cluster.name} ${tar} ${patchTarget} && exit`)
    }
    // TODO: tikv, pd

    if (cmds.length > 0) {
      const t = vscode.window.createTerminal(`patch ${compRole}`)
      for (const cmd of cmds) {
        t.sendText(cmd)
      }
      t.show()
    }
  }

  //
  static async patchByOther(
    treeItemExtra: ClusterComponent | InstanceAndCluster,
    treeItemContextValue: string
  ) {
    // warn
    const res = await vscode.window.showInformationMessage(
      'If you need to modify the cluster or instance config at the same time, please do it before patching to save your time',
      'Let me check',
      'Patch anyway'
    )
    if (res === 'Let me check') {
      return
    }

    //
    let compRole = 'unknown'
    let patchTarget = ''
    if (treeItemContextValue === 'cluster-component') {
      const { cluster, role, instances } = treeItemExtra as ClusterComponent
      compRole = role
      patchTarget = `-R ${role}`
    }
    if (treeItemContextValue === 'cluster-instance') {
      const { instance, cluster } = treeItemExtra as InstanceAndCluster
      compRole = instance.role
      patchTarget = `-N ${instance.id}`
    }

    // choose
    const files = await vscode.window.showOpenDialog({
      canSelectFolders: false,
      filters: { tar: ['.tar.gz'] },
      canSelectMany: false,
    })
    if (files === undefined) {
      return
    }
    const cmd = `tiup cluster patch ${treeItemExtra.cluster.name} ${files[0].path} ${patchTarget} && exit`
    const t = vscode.window.createTerminal(`patch ${compRole}`)
    t.sendText(cmd)
    t.show()
  }

  static async restartComponent(treeItemExtra: ClusterComponent, tiup: TiUP) {
    const { cluster, role } = treeItemExtra
    const cmd = `cluster restart ${cluster.name} -R ${role}`
    await tiup.invokeInSharedTerminal(cmd)
  }

  static async restartInstance(treeItemExtra: InstanceAndCluster, tiup: TiUP) {
    const { cluster, instance } = treeItemExtra
    const cmd = `cluster restart ${cluster.name} -N ${instance.id}`
    await tiup.invokeInSharedTerminal(cmd)
  }

  static async viewClusterTopo(cluster: Cluster, tempFolder: string) {
    vscode.window.showInformationMessage('Generating... please be patient')

    const comps = await ClusterCommand.displayCluster(cluster.name)
    let instances: ClusterInstance[] = []
    Object.values(comps).forEach((arr) => (instances = instances.concat(arr)))
    const hostInstances: Record<string, ClusterInstance[]> = {}
    instances.forEach((inst) => {
      hostInstances[inst.host] = hostInstances[inst.host] || []
      hostInstances[inst.host].push(inst)
    })
    console.log('host instances:', hostInstances)
    let content = ''
    Object.keys(hostInstances).forEach((host, idx) => {
      const instances = hostInstances[host]
      const instsStr = instances
        .map((inst) => `${inst.role}_${inst.ports.replace(/\//g, '_')};`)
        .join(' ')
      content += `
  subgraph cluster${idx} {
    node [style=filled];
    label = "${host}";
    ${instsStr}
  }
`
    })
    content = `
digraph G {
  rankdir=LR
  ${content}
}
`
    console.log(content)

    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder, { recursive: true })
    }
    const dotFilePath = path.join(tempFolder, `${cluster.name}.dot`)
    fs.writeFileSync(dotFilePath, content)
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(dotFilePath))
    // vscode.commands.executeCommand(
    //   'graphviz.preview',
    //   vscode.Uri.parse(dotFilePath)
    // )
  }
}
