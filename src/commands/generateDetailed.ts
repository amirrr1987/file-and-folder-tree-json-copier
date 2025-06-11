import * as vscode from 'vscode'
import * as path from 'path'
import { buildTreeJson } from '../utils/jsonBuilder'
import { getFieldSelections } from '../ui/fieldSelection'
import { DetailedFileInfo } from '../types'
import { allowedExtensions } from '../constants'

export async function generateDetailed(uri: vscode.Uri, context: vscode.ExtensionContext) {
  if (!uri) {
    vscode.window.showErrorMessage('Please right-click on a folder or file in the Explorer.')
    return
  }

  const fields = await getFieldSelections(context)
  if (!fields || fields.size === 0) {
    vscode.window.showWarningMessage('No fields selected. Operation cancelled.')
    return
  }

  const selectedFields: Set<keyof DetailedFileInfo> = fields
  const rootName = path.basename(uri.fsPath)
const tree = await buildTreeJson(uri.fsPath, true, selectedFields, allowedExtensions)

  const output = { [rootName]: tree }

  try {
    const jsonString = JSON.stringify(output, null, 2)
    await vscode.env.clipboard.writeText(jsonString)
    vscode.window.showInformationMessage('📋 Detailed JSON copied to clipboard!')
  } catch (error) {
    vscode.window.showErrorMessage('Error copying JSON: ' + (error as any).message)
  }
}
