export function getCodeStats(content: string, filename: string) {
  const lines = content.split('\n').length
  return {
    Lines: lines,
    IsTestFile: filename.includes('.test.'),
    HasDefaultExport: content.includes('export default'),
    Functions: (content.match(/function\s+|\s*=>/g) || []).length,
    Classes: (content.match(/class\s+/g) || []).length,
    Imports: (content.match(/import\s+/g) || []).length,
    Comments: (content.match(/\/\/|\/\*/g) || []).length,
    TODOs: (content.match(/TODO/g) || []).length,
    IsMinified: content.length > 0 && content.length / lines > 300
  }
}
