import { shell } from '../shell'
export class PlaygroundCommand {
  constructor() {}

  checkTiUP() {}

  static async checkRunPlayground() {
    const res = await shell.exec('tiup playground display')
    if (res?.code === 0) {
      // running
      const instances = {} as any
      const output = res.stdout
      const arr = output.split('\n')
      arr.forEach((line) => {
        const m = line.match(/\d+\s+(\w+)/)
        if (m) {
          const comp = m[1]
          instances[comp] = (instances[comp] || 0) + 1
        }
      })
      return instances
    }
    return undefined
  }

  startPlayground() {}

  restartPlayground() {}
}
