import * as vscode from 'vscode'
import { generateSimple } from './commands/generateSimple'
import { generateDetailed } from './commands/generateDetailed'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('file-tree-json.generateSimple', uri => generateSimple(uri, context)),
    vscode.commands.registerCommand('file-tree-json.generateDetailed', uri => generateDetailed(uri, context))
  )
}

export function deactivate() {}
