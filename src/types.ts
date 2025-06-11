export interface DetailedFileInfo {
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
  IsTestFile: boolean
  HasDefaultExport: boolean
  Functions: number
  Classes: number
  Imports: number
  Comments: number
  TODOs: number
  IsMinified: boolean
  GitTracked: boolean
  GitLastAuthor: string
  GitLastDate: string
  GitModified: boolean
}
