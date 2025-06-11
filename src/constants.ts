import { DetailedFileInfo } from './types'

export const fieldGroups: { [group: string]: (keyof DetailedFileInfo)[] } = {
  'Basic Info': ['Name', 'Path', 'Size', 'Lines', 'Language', 'Extension', 'CreatedAt', 'ModifiedAt', 'Permissions', 'IsSymlink'],
  'Code Stats': ['IsTestFile', 'HasDefaultExport', 'Functions', 'Classes', 'Imports', 'Comments', 'TODOs', 'IsMinified'],
  'Git Info': ['GitTracked', 'GitLastAuthor', 'GitLastDate', 'GitModified']
}

export const STORAGE_KEY = 'fileTreeJson.selectedFields'

export const allowedExtensions = new Set([
  'js', 'ts', 'jsx', 'tsx', 'vue', 'json', 'mjs', 'cjs'
])
