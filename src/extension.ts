import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import * as vscode from 'vscode'
import simpleGit from 'simple-git'

const git = simpleGit()

interface DetailedFileInfo {
  // Basic Info
  Name: string
  Path: string
  Size: string
  Lines: number
  Language: string
  Extension: string
  CreatedAt: string
  ModifiedAt: string
  Permissions: string
  IsSymlink: boolean
  // Code Stats
  IsTestFile: boolean
  HasDefaultExport: boolean
  Functions: number
  Classes: number
  Imports: number
  Comments: number
  TODOs: number
  IsMinified: boolean
  // Git Info
  GitTracked: boolean
  GitLastAuthor: string
  GitLastDate: string
  GitModified: boolean
}

const fieldGroups: { [group: string]: (keyof DetailedFileInfo)[] } = {
  'Basic Info': ['Name', 'Path', 'Size', 'Lines', 'Language', 'Extension', 'CreatedAt', 'ModifiedAt', 'Permissions', 'IsSymlink'],
  'Code Stats': ['IsTestFile', 'HasDefaultExport', 'Functions', 'Classes', 'Imports', 'Comments', 'TODOs', 'IsMinified'],
  'Git Info': ['GitTracked', 'GitLastAuthor', 'GitLastDate', 'GitModified']
}

const allFields = Object.values(fieldGroups).flat()

const STORAGE_KEY = 'fileTreeJson.selectedFields'

// پسوندهای مجاز برای JS/TS و فریم‌ورک‌های مرتبط
const allowedExtensions = new Set([
  'js', 'ts', 'jsx', 'tsx', 'vue', 'json', 'mjs', 'cjs'
])

function getHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

function getPermissions(stats: fs.Stats): string {
  const mode = stats.mode & 0o777
  return mode.toString(8)
}

async function getGitInfo(filePath: string) {
  try {
    const isTracked = (await git.raw(['ls-files', '--error-unmatch', filePath])).trim() !== ''
    const log = await git.log({ file: filePath, n: 1 })
    return {
      GitTracked: isTracked,
      GitLastAuthor: log.latest?.author_name || '',
      GitLastDate: log.latest?.date || '',
      GitModified: (await git.status()).modified.includes(filePath)
    }
  } catch {
    return {
      GitTracked: false,
      GitLastAuthor: '',
      GitLastDate: '',
      GitModified: false
    }
  }
}

// بررسی اینکه آیا فایل مجاز است یا نه
function isAllowedFile(filePath: string): boolean {
  const ext = path.extname(filePath).slice(1).toLowerCase()
  return allowedExtensions.has(ext)
}

async function buildTreeJson(dirPath: string, detailed: boolean, selectedFields: Set<keyof DetailedFileInfo>): Promise<any> {
  const stats = fs.statSync(dirPath)

  if (stats.isFile()) {
    if (!isAllowedFile(dirPath)) return null
    if (!detailed) return null

    const content = fs.readFileSync(dirPath, 'utf8')
    const lines = content.split('\n').length
    const name = path.basename(dirPath)
    const extension = path.extname(name).slice(1)

    const baseInfo: DetailedFileInfo = {
      Name: name,
      Path: dirPath,
      Size: `${(stats.size / 1024).toFixed(1)}KB`,
      Lines: lines,
      Language: extension || 'unknown',
      Extension: extension,
      CreatedAt: stats.birthtime.toISOString(),
      ModifiedAt: stats.mtime.toISOString(),
      Permissions: getPermissions(stats),
      IsSymlink: fs.lstatSync(dirPath).isSymbolicLink(),
      IsTestFile: name.includes('.test.'),
      HasDefaultExport: content.includes('export default'),
      Functions: (content.match(/function\s+|\s*=>/g) || []).length,
      Classes: (content.match(/class\s+/g) || []).length,
      Imports: (content.match(/import\s+/g) || []).length,
      Comments: (content.match(/\/\/|\/\*/g) || []).length,
      TODOs: (content.match(/TODO/g) || []).length,
      IsMinified: content.length > 0 && content.length / lines > 300,
      Hash: getHash(content),
      ...(await getGitInfo(dirPath))
    }

    const filtered: Partial<DetailedFileInfo> = {}
    for (const key of selectedFields) {
      filtered[key] = baseInfo[key]
    }

    return filtered
  }

  if (stats.isDirectory()) {
    const entries = fs.readdirSync(dirPath)
    const result: { [key: string]: any } = {}

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry)
      const child = await buildTreeJson(fullPath, detailed, selectedFields)
      if (child !== null) {
        result[entry] = child
      }
    }

    return result
  }

  return 'error'
}

async function getFieldSelections(context: vscode.ExtensionContext): Promise<Set<keyof DetailedFileInfo> | null> {
  const saved = context.globalState.get<string[]>(STORAGE_KEY) || []

  // آماده‌سازی آیتم‌های QuickPick با دسته‌بندی
  const items: vscode.QuickPickItem[] = []
  for (const [group, fields] of Object.entries(fieldGroups)) {
    items.push({ label: `--- ${group} ---`, kind: vscode.QuickPickItemKind.Separator })
    for (const field of fields) {
      items.push({
        label: field,
        picked: saved.includes(field)
      })
    }
  }

  const quickPick = vscode.window.createQuickPick()
  quickPick.canSelectMany = true
  quickPick.title = 'Select fields for Detailed JSON'
  quickPick.items = items

  // تنظیم انتخاب‌های قبلی
  quickPick.selectedItems = quickPick.items.filter(i => i.picked && i.kind !== vscode.QuickPickItemKind.Separator)

  return new Promise(resolve => {
    quickPick.onDidAccept(() => {
      const chosen = quickPick.selectedItems.map(i => i.label as keyof DetailedFileInfo)
      context.globalState.update(STORAGE_KEY, chosen)
      quickPick.hide()
      resolve(new Set(chosen))
    })

    quickPick.onDidHide(() => resolve(null))
    quickPick.show()
  })
}

async function handleTreeGeneration(uri: vscode.Uri, detailed: boolean, context: vscode.ExtensionContext) {
  if (!uri) {
    vscode.window.showErrorMessage('Please right-click on a folder or file in the Explorer.')
    return
  }

  let selectedFields: Set<keyof DetailedFileInfo> = new Set()

  if (detailed) {
    const fields = await getFieldSelections(context)
    if (!fields || fields.size === 0) {
      vscode.window.showWarningMessage('No fields selected. Operation cancelled.')
      return
    }
    selectedFields = fields
  }

  const rootName = path.basename(uri.fsPath)
  const tree = await buildTreeJson(uri.fsPath, detailed, selectedFields)
  const output = { [rootName]: tree }

  try {
    const jsonString = JSON.stringify(output, null, 2)
    await vscode.env.clipboard.writeText(jsonString)
    vscode.window.showInformationMessage(
      `📋 ${detailed ? 'Detailed' : 'Simple'} JSON copied to clipboard!`
    )
  } catch (error) {
    vscode.window.showErrorMessage('Error copying JSON: ' + (error as any).message)
  }
}

export function activate(context: vscode.ExtensionContext) {
  const simple = vscode.commands.registerCommand(
    'file-tree-json.generateSimple',
    async (uri: vscode.Uri) => handleTreeGeneration(uri, false, context)
  )

  const detailed = vscode.commands.registerCommand(
    'file-tree-json.generateDetailed',
    async (uri: vscode.Uri) => handleTreeGeneration(uri, true, context)
  )

  context.subscriptions.push(simple, detailed)
}

export function deactivate() {}
