import * as fs from 'fs'
import * as path from 'path'
import { getHash } from './hash'
import { getGitInfo } from './gitUtils'
import { getPermissions, isAllowedFile } from './fileUtils'
import { getCodeStats } from './codeStats'
import { DetailedFileInfo } from '../types'

export async function buildTreeJson(dirPath: string, detailed: boolean, selectedFields: Set<keyof DetailedFileInfo>, allowedExtensions: Set<string>): Promise<any> {
  const stats = fs.statSync(dirPath)

  if (stats.isFile()) {
    if (!isAllowedFile(dirPath, allowedExtensions)) return null
    if (!detailed) return null

    const content = fs.readFileSync(dirPath, 'utf8')
    const name = path.basename(dirPath)
    const extension = path.extname(name).slice(1)

    const baseInfo: DetailedFileInfo = {
      Name: name,
      Path: dirPath,
      Size: `${(stats.size / 1024).toFixed(1)}KB`,
      Extension: extension,
      Language: extension || 'unknown',
      CreatedAt: stats.birthtime.toISOString(),
      ModifiedAt: stats.mtime.toISOString(),
      Permissions: getPermissions(stats),
      IsSymlink: fs.lstatSync(dirPath).isSymbolicLink(),
      ...getCodeStats(content, name),
      Hash: getHash(content),
      ...(await getGitInfo(dirPath))
    } as DetailedFileInfo

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
      const child = await buildTreeJson(fullPath, detailed, selectedFields, allowedExtensions)
      if (child !== null) {
        result[entry] = child
      }
    }

    return result
  }

  return 'error'
}
