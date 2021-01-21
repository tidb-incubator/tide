import { shell } from '../shell'
import { handleError } from '../utils/window'
import { TidbCluster, Pod } from './resources.objectmodel'


export class KubeCommand {
  static async listTidbCluster(): Promise<TidbCluster[]> {
    let sr = await shell.exec('kubectl get tidbcluster -ojson')
    if (sr?.code !== 0) {
      handleError(sr)
      return []
    }
    let obj = JSON.parse(sr.stdout)
    let tcs = obj.items as TidbCluster[]

    // console.log(obj)
    console.log(tcs[0])
    return tcs
  }

  static async listPDPods(): Promise<Pod[] | undefined> {
    return await listJson<Pod>('kubectl get pod -l app.kubernetes.io/component=pd -ojson')
  }

  static async listTiDBPods(): Promise<Pod[] | undefined> {
    return await listJson<Pod>('kubectl get pod -l app.kubernetes.io/component=tidb -ojson')
  }

  static async listTiKVPods(): Promise<Pod[] | undefined> {
    return await listJson<Pod>('kubectl get pod -l app.kubernetes.io/component=tikv -ojson')
  }
}

async function kubectlJson(command: string): Promise<string | undefined> {
  let sr = await shell.exec(command)
  if (sr?.code !== 0) {
    handleError(sr)
    return
  }
  return sr.stdout
}

async function listJson<T>(command: string): Promise<T[] | undefined> {
  let listJson = await kubectlJson(command)
  if (listJson === undefined) { return }
  return JSON.parse(listJson).items as T[]
}

async function getJson<T>(command: string): Promise<T | undefined> {
  let json = await kubectlJson(command)
  if (json === undefined) { return }
  return JSON.parse(json) as T
}
