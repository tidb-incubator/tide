import { shell } from '../shell'

// Name User Version Path PrivateKey
type ClusterListItem = Record<
  'name' | 'user' | 'version' | 'path' | 'privateKey',
  string
>

// ID Role Host Ports OS/Arch Status  Data Dir  Deploy Dir
type ClusterInstance = Record<
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

export class ClusterCommand {
  // list clusters
  static async listClusters(): Promise<ClusterListItem[]> {
    const clusters: ClusterListItem[] = []
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
    }
    return clusters
  }

  // display cluster
  static async displayCluster(clusterName: string): Promise<ClusterInstance[]> {
    const instances: ClusterInstance[] = []
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
            instances.push({
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
    }
    return instances
  }

  // start cluster

  // stop cluster

  // destroy cluster

  // deploy cluster

  // patch component

  // edit config
}
