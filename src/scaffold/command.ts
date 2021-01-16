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

    // copy template files
    const targetAppFolder = path.join(
      dashboardFolder,
      'ui',
      'lib',
      'apps',
      folderName
    )
    console.log('target app folder:', targetAppFolder)
    if (fs.existsSync(targetAppFolder)) {
      vscode.window.showErrorMessage('App alreday exists!')
      return
    } else {
      fs.mkdirSync(targetAppFolder, { recursive: true })
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
    const cmd = `cp -r ${templateFolder}/* ${targetAppFolder}`
    console.log('cmd:', cmd)
    const cr = await shell.exec(cmd)
    if (cr?.code !== 0) {
      handleError(cr)
      return
    }

    // replace placeholders
    const options = {
      files: [
        `${targetAppFolder}/**/*.ts`,
        `${targetAppFolder}/**/*.tsx`,
        `${targetAppFolder}/**/*.yaml`,
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
    vscode.window.showInformationMessage(`Add ${appName} successfully!`)
  }
}
