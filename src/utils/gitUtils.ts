import simpleGit from 'simple-git'

const git = simpleGit()

export async function getGitInfo(filePath: string) {
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
