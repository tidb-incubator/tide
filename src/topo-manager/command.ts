import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
export class TopoManagerCommand {
  static diffModification(
    templateFolder: string,
    localFolder: string,
    folderName: string,
    fileName: string
  ) {
    const templateFile = path.join(templateFolder, folderName, fileName)
    if (!fs.existsSync(templateFile)) {
      vscode.window.showErrorMessage(
        'Has no template file available to compare.'
      )
      return
    }
    // generate example
    const exampleTemplateFile = path.join(
      templateFolder,
      folderName,
      'example.' + fileName
    )
    fs.copyFileSync(templateFile, exampleTemplateFile)

    // view diff
    const localFile = path.join(localFolder, folderName, fileName)
    vscode.commands.executeCommand(
      'vscode.diff',
      vscode.Uri.file(exampleTemplateFile),
      vscode.Uri.file(localFile),
      `${fileName} changes`
    )
    vscode.window.showWarningMessage(
      "Notice the left side is the default template file, you shouldn't modify it."
    )
  }
}
