import * as vscode from 'vscode'
import { fieldGroups, STORAGE_KEY } from '../constants'
import { DetailedFileInfo } from '../types'

export async function getFieldSelections(context: vscode.ExtensionContext): Promise<Set<keyof DetailedFileInfo> | null> {
  const saved = context.globalState.get<string[]>(STORAGE_KEY) || []

  const items: vscode.QuickPickItem[] = []
  for (const [group, fields] of Object.entries(fieldGroups)) {
    items.push({ label: `--- ${group} ---`, kind: vscode.QuickPickItemKind.Separator })
    for (const field of fields) {
      items.push({ label: field, picked: saved.includes(field) })
    }
  }

  const quickPick = vscode.window.createQuickPick()
  quickPick.canSelectMany = true
  quickPick.title = 'Select fields for Detailed JSON'
  quickPick.items = items
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
