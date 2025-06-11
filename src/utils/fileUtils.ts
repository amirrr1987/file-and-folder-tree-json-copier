import * as fs from 'fs'
import * as path from 'path'

export function getPermissions(stats: fs.Stats): string {
  const mode = stats.mode & 0o777
  return mode.toString(8)
}

export function isAllowedFile(filePath: string, allowedExtensions: Set<string>): boolean {
  const ext = path.extname(filePath).slice(1).toLowerCase()
  return allowedExtensions.has(ext)
}
