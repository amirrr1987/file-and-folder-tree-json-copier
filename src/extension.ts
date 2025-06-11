import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

function getFileExtension(filename: string): string {
  return path.extname(filename)
}

// تابع بازگشتی برای ساختار درخت به شکل دلخواه JSON
function buildTreeJson(dirPath: string): any {
  const stats = fs.statSync(dirPath)
  if (stats.isFile()) {
    return getFileExtension(dirPath) // فقط پسوند
  } else if (stats.isDirectory()) {
    const result: any = {}
    const entries = fs.readdirSync(dirPath)
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry)
      result[entry] = buildTreeJson(fullPath)
    }
    return result
  }
  return null
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'file-tree-json.generateFromExplorer',
    async (uri: vscode.Uri) => {
      try {
        if (!uri) {
          vscode.window.showErrorMessage('Please right-click on a folder or file in the Explorer.')
          return
        }

        const rootName = path.basename(uri.fsPath)
        const tree = buildTreeJson(uri.fsPath)

        // خروجی نهایی با ریشه فولدر انتخاب شده
        const output = {
          [rootName]: tree
        }

        const jsonString = JSON.stringify(output, null, 2)

        // کپی به کلیپ‌بورد
        await vscode.env.clipboard.writeText(jsonString)

        vscode.window.showInformationMessage('File tree JSON copied to clipboard!')
      } catch (error) {
        vscode.window.showErrorMessage('Error generating file tree JSON: ' + (error as any).message)
      }
    }
  )

  context.subscriptions.push(disposable)
}

export function deactivate() {}
