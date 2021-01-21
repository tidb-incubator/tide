import { Terminal } from 'vscode'
import { FindBinaryStatus } from './binutil'
import { affectsUs, TiUPVersioning } from './components/config/config'
import { FS } from './fs'
import { Host } from './host'
import { Shell } from './shell'

export interface TiUP {
  invokeInSharedTerminal(command: string): Promise<void>
   
  // FIXME: should be abstracted in Shell interface
  invokeAnyInNewTerminal(command: string, terminalName: string): Promise<void>
}

interface Context {
  readonly host: Host
  readonly fs: FS
  readonly shell: Shell
  readonly pathfinder: (() => Promise<string>) | undefined
  binPath: string
  status: FindBinaryStatus | undefined
}

class TiUPImpl implements TiUP {
  constructor(
    host: Host,
    fs: FS,
    shell: Shell,
    pathfinder: (() => Promise<string>) | undefined
  ) {
    this.context = {
      host: host,
      fs: fs,
      shell: shell,
      pathfinder: pathfinder,
      binPath: 'tiup',
      status: undefined,
    }
  }
  invokeInSharedTerminal(command: string): Promise<void> {
    const terminal = this.getSharedTerminal()
    return invokeInTerminal(this.context, command, undefined, terminal)
  }

  invokeAnyInNewTerminal(command: string, terminalName: string): Promise<void> {
    const terminal = this.context.host.createTerminal(terminalName)
    return invokeAnyInTerminal(this.context, command, undefined, terminal)
  }

  private readonly context: Context
  private sharedTerminal: Terminal | null = null

  private getSharedTerminal(): Terminal {
    if (!this.sharedTerminal) {
      this.sharedTerminal = this.context.host.createTerminal('tiup')
      const disposable = this.context.host.onDidCloseTerminal((terminal) => {
        if (terminal === this.sharedTerminal) {
          this.sharedTerminal = null
          disposable.dispose()
        }
      })
      this.context.host.onDidChangeConfiguration((change) => {
        if (affectsUs(change) && this.sharedTerminal) {
          this.sharedTerminal.dispose()
        }
      })
    }
    return this.sharedTerminal
  }
}

export function create(
  versioning: TiUPVersioning,
  host: Host,
  fs: FS,
  shell: Shell
): TiUP {
  // TODO: automatically update version
  // if (versioning === TiUPVersioning.Infer) {
  //     return createAutoVersioned(host, fs, shell);
  // }
  return createSingleVersion(host, fs, shell)
}

function createSingleVersion(host: Host, fs: FS, shell: Shell): TiUP {
  return new TiUPImpl(host, fs, shell, undefined)
}

async function invokeInTerminal(
  context: Context,
  command: string,
  pipeTo: string | undefined,
  terminal: Terminal
): Promise<void> {
  if (await checkPresent(context, CheckPresentMessageMode.command)) {
    // You might be tempted to think we needed to add 'wsl' here if user is using wsl
    // but this runs in the context of a vanilla terminal, which is controlled by the
    // existing preference, so it's not necessary.
    // But a user does need to default VS code to use WSL in the settings.json
    const tiupCommand = `tiup ${command}`
    const fullCommand = pipeTo ? `${tiupCommand} | ${pipeTo}` : tiupCommand
    terminal.sendText(fullCommand)
    terminal.show()
  }
}

async function invokeAnyInTerminal(
  context: Context,
  command: string,
  pipeTo: string | undefined,
  terminal: Terminal
): Promise<void> {
  if (await checkPresent(context, CheckPresentMessageMode.command)) {
    const tiupCommand = `${command}`
    const fullCommand = pipeTo ? `${tiupCommand} | ${pipeTo}` : tiupCommand
    terminal.sendText(fullCommand)
    terminal.show()
  }
}

export enum CheckPresentMessageMode {
  command,
  silent,
}

// TODO: complete binary finding mechanism as in kubernetes plugin
async function checkPresent(
  context: Context,
  errorMessageMode: CheckPresentMessageMode
): Promise<boolean> {
  if (/*context.binFound || */ context.pathfinder) {
    return true
  }

  // return await checkForKubectlInternal(context, errorMessageMode);
  return Promise.resolve(true)
}
