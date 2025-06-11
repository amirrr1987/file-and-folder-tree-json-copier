import * as path from 'path'
import * as vscode from 'vscode'
import { buildTreeJson } from '../utils/jsonBuilder'

export async function generateSimple(uri: vscode.Uri, context: vscode.ExtensionContext) {
  if (!uri) {
    vscode.window.showErrorMessage('Please right-click on a folder or file in the Explorer.')
    return
  }

  const rootName = path.basename(uri.fsPath)
  const tree = await buildTreeJson(uri.fsPath, false, new Set())
  const output = { [rootName]: tree }

  try {
    const jsonString = JSON.stringify(output, null, 2)
    await vscode.env.clipboard.writeText(jsonString)
    vscode.window.showInformationMessage('📋 Simple JSON copied to clipboard!')
  } catch (error) {
    vscode.window.showErrorMessage('Error copying JSON: ' + (error as any).message)
  }
}
