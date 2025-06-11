import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

type FileTree = string | null | { [key: string]: FileTree } | DetailedFileInfo

interface DetailedFileInfo {
  name: string
  path: string
  size: string
  lines: number
  language: string
  extension: string
  createdAt: string
  modifiedAt: string
  isTestFile: boolean
  hasDefaultExport: boolean
  functions: number
}

function buildTreeJson(dirPath: string, detailed: boolean): FileTree {
  try {
    const stats = fs.statSync(dirPath)

    if (stats.isFile()) {
      if (!detailed) return null

      const content = fs.readFileSync(dirPath, 'utf8')
      const lines = content.split('\n').length
      const name = path.basename(dirPath)
      const extension = path.extname(name).slice(1)

      return {
        name,
        path: dirPath,
        size: `${(stats.size / 1024).toFixed(1)}KB`,
        lines,
        language: extension === 'ts' ? 'TypeScript' : extension,
        extension,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString(),
        isTestFile: name.includes('.test.'),
        hasDefaultExport: content.includes('export default'),
        functions: (content.match(/function\s+|\s*=>/g) || []).length
      }
    }

    if (stats.isDirectory()) {
      const entries = fs.readdirSync(dirPath)
      const result: { [key: string]: FileTree } = {}

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry)
        result[entry] = buildTreeJson(fullPath, detailed)
      }

      return result
    }
  } catch (err) {
    console.error(`Error accessing path: ${dirPath}`, err)
  }

  return 'error'
}

async function handleTreeGeneration(uri: vscode.Uri, detailed: boolean) {
  if (!uri) {
    vscode.window.showErrorMessage('Please right-click on a folder or file in the Explorer.')
    return
  }

  const rootName = path.basename(uri.fsPath)
  const tree = buildTreeJson(uri.fsPath, detailed)
  const output = { [rootName]: tree }

  try {
    const jsonString = JSON.stringify(output, null, 2)
    await vscode.env.clipboard.writeText(jsonString)
    vscode.window.showInformationMessage(
      `Directory tree ${detailed ? 'detailed' : 'simple'} JSON copied to clipboard!`
    )
  } catch (error) {
    vscode.window.showErrorMessage('Error copying JSON: ' + (error as any).message)
  }
}

export function activate(context: vscode.ExtensionContext) {
  const simple = vscode.commands.registerCommand(
    'file-tree-json.generateSimple',
    async (uri: vscode.Uri) => handleTreeGeneration(uri, false)
  )

  const detailed = vscode.commands.registerCommand(
    'file-tree-json.generateDetailed',
    async (uri: vscode.Uri) => handleTreeGeneration(uri, true)
  )

  context.subscriptions.push(simple, detailed)
}

export function deactivate() {}
