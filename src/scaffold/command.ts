import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as replace from 'replace-in-file'

import { shell } from '../shell'
import { handleError } from '../utils'

export class ScaffoldCommand {
  static async addDashboardApp() {
    let appName = await vscode.window.showInputBox({
      prompt: 'Your app name',
    })
    if (!appName || appName.trim() === '') {
      return
    }
    const folderName = appName[0].toUpperCase() + appName.substr(1)
    appName = appName.trim().toLocaleLowerCase()

    // find dashboard folder
    const folders = vscode.workspace.workspaceFolders || []
    let dashboardFolder = ''
    for (let i = 0; i < folders.length; i++) {
      if (folders[i].uri.path.endsWith('/tidb-dashboard')) {
        dashboardFolder = folders[i].uri.path
        break
      }
    }
    if (dashboardFolder === '') {
      vscode.window.showErrorMessage('Has not found tidb-dashboard repo')
      return
    }

    handleBackend(appName, dashboardFolder)
    handleFe(appName, folderName, dashboardFolder)

    vscode.window.showInformationMessage(`Add ${appName} app successfully!`)

    // open files
    const beFile = path.join(
      dashboardFolder,
      'pkg',
      'apiserver',
      appName,
      'service.go'
    )
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(beFile))
    const feFile = path.join(
      dashboardFolder,
      'ui',
      'lib',
      'apps',
      folderName,
      'index.tsx'
    )
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(feFile))
  }
}

async function handleBackend(appName: string, dashboardFolder: string) {
  // copy template files
  const targetApiFolder = path.join(
    dashboardFolder,
    'pkg',
    'apiserver',
    appName
  )
  console.log('target app folder:', targetApiFolder)
  if (!fs.existsSync(targetApiFolder)) {
    fs.mkdirSync(targetApiFolder, { recursive: true })
  }
  const templateFolder = path.join(
    __dirname,
    '..',
    '..',
    'scaffold-template',
    'dashboard',
    'be',
    'api'
  )
  const cmd = `cp -r ${templateFolder}/* ${targetApiFolder}`
  console.log('cmd:', cmd)
  const cr = await shell.exec(cmd)
  if (cr?.code !== 0) {
    handleError(cr)
    return
  }

  // replace placeholders
  const options = {
    files: [`${targetApiFolder}/**/*.go`],
    from: /__APP_NAME__/g,
    to: appName,
  }
  replace.sync(options)

  // replace pkg/apiserver/apiserver.go
  // register api
  const apiIndexFile = path.join(
    dashboardFolder,
    'pkg',
    'apiserver',
    'apiserver.go'
  )
  replace.sync({
    files: apiIndexFile,
    from: `// "github.com/pingcap-incubator/tidb-dashboard/pkg/apiserver/__APP_NAME__"`,
    to: `"github.com/pingcap-incubator/tidb-dashboard/pkg/apiserver/${appName}"\n// "github.com/pingcap-incubator/tidb-dashboard/pkg/apiserver/__APP_NAME__"`,
  })
  replace.sync({
    files: apiIndexFile,
    from: `// __APP_NAME__.NewService,`,
    to: `${appName}.NewService,\n// __APP_NAME__.NewService,`,
  })
  replace.sync({
    files: apiIndexFile,
    from: `// __APP_NAME__.RegisterRouter,`,
    to: `${appName}.RegisterRouter,// __APP_NAME__.RegisterRouter,`,
  })
}

async function handleFe(
  appName: string,
  folderName: string,
  dashboardFolder: string
) {
  // copy template files
  const targetAppFeFolder = path.join(
    dashboardFolder,
    'ui',
    'lib',
    'apps',
    folderName
  )
  console.log('target app folder:', targetAppFeFolder)
  if (!fs.existsSync(targetAppFeFolder)) {
    fs.mkdirSync(targetAppFeFolder, { recursive: true })
  }
  const templateFolder = path.join(
    __dirname,
    '..',
    '..',
    'scaffold-template',
    'dashboard',
    'fe',
    'app'
  )
  const cmd = `cp -r ${templateFolder}/* ${targetAppFeFolder}`
  console.log('cmd:', cmd)
  const cr = await shell.exec(cmd)
  if (cr?.code !== 0) {
    handleError(cr)
    return
  }

  // replace placeholders
  const options = {
    files: [
      `${targetAppFeFolder}/**/*.ts`,
      `${targetAppFeFolder}/**/*.tsx`,
      `${targetAppFeFolder}/**/*.yaml`,
    ],
    from: /__APP_NAME__/g,
    to: appName,
  }
  replace.sync(options)

  // replace ui/dashboardApp/index.ts
  // register app
  const appIndexFile = path.join(
    dashboardFolder,
    'ui',
    'dashboardApp',
    'index.ts'
  )
  replace.sync({
    files: appIndexFile,
    from: `// import __APP_NAME__ from '@lib/apps/__APP_NAME__/index.meta'`,
    to: `import ${folderName} from '@lib/apps/${folderName}/index.meta'\n// import __APP_NAME__ from '@lib/apps/__APP_NAME__/index.meta'`,
  })
  replace.sync({
    files: appIndexFile,
    from: `// .register(__APP_NAME__)`,
    to: `.register(${folderName})\n// .register(__APP_NAME__)`,
  })

  // replace ui/dashboardApp/layout/main/Sider/index.tsx
  // add menu
  const menuEntryFile = path.join(
    dashboardFolder,
    'ui',
    'dashboardApp',
    'layout',
    'main',
    'Sider',
    'index.tsx'
  )
  replace.sync({
    files: menuEntryFile,
    from: `// useAppMenuItem(registry, '__APP_NAME__'),`,
    to: `useAppMenuItem(registry, '${appName}'),\n// useAppMenuItem(registry, '__APP_NAME__'),`,
  })
}
