import { shell } from '../shell'

export class KubeCommand {
  static async listTidbClusters() {
    const res = await shell.exec('tiup playground display')
    console.log(res)
  }
}
