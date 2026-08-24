import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const MAX_MAIN_PACKAGE_BYTES = 2 * 1024 * 1024

const requiredPages = [
  'pages/index/index',
  'pages/planner/index',
  'pages/landmarks/index',
  'pages/saved/index',
  'pages/route-detail/index'
]

const pageExtensions = ['.js', '.json', '.wxml', '.wxss']

const readJson = (file, issues) => {
  if (!fs.existsSync(file)) {
    issues.push(`缺少 ${path.basename(file)}`)
    return null
  }

  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    issues.push(`${path.basename(file)} 不是有效 JSON：${error.message}`)
    return null
  }
}

const collectFiles = (directory) => {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? collectFiles(target) : [target]
  })
}

const webpNames = (directory) => fs.existsSync(directory)
  ? fs.readdirSync(directory).filter((file) => file.endsWith('.webp')).sort()
  : []

export function auditRelease ({ miniRoot, repoRoot, maxPackageBytes = MAX_MAIN_PACKAGE_BYTES }) {
  const issues = []
  const distRoot = path.join(miniRoot, 'dist')
  const appConfig = readJson(path.join(distRoot, 'app.json'), issues)
  const rootProjectConfig = readJson(path.join(repoRoot, 'project.config.json'), issues)
  const miniProjectConfig = readJson(path.join(miniRoot, 'project.config.json'), issues)
  const distFiles = collectFiles(distRoot)
  const totalBytes = distFiles.reduce((total, file) => total + fs.statSync(file).size, 0)
  const sourceImages = webpNames(path.join(miniRoot, 'src', 'assets', 'landmarks'))
  const distImages = webpNames(path.join(distRoot, 'landmarks'))

  if (appConfig) {
    for (const page of requiredPages) {
      if (!appConfig.pages?.includes(page)) issues.push(`app.json 未注册页面 ${page}`)
      for (const extension of pageExtensions) {
        const pageFile = path.join(distRoot, `${page}${extension}`)
        if (!fs.existsSync(pageFile)) issues.push(`缺少页面产物 ${page}${extension}`)
      }
    }

    if (appConfig.lazyCodeLoading !== 'requiredComponents') {
      issues.push('app.json 未启用 requiredComponents 按需注入')
    }
    if (appConfig.tabBar?.list?.length !== 4) issues.push('tabBar 应包含 4 个入口')
  }

  if (sourceImages.length !== 44) issues.push(`源码点位图片应为 44 张，当前 ${sourceImages.length} 张`)
  if (distImages.length !== 44) issues.push(`发布包点位图片应为 44 张，当前 ${distImages.length} 张`)
  if (sourceImages.length === 44 && distImages.length === 44 && sourceImages.join('|') !== distImages.join('|')) {
    issues.push('源码与发布包的点位图片文件名不一致')
  }

  if (totalBytes > maxPackageBytes) {
    issues.push(`发布包超过 2 MiB 阈值：${(totalBytes / 1024 / 1024).toFixed(2)} MiB`)
  }
  if (distFiles.some((file) => file.endsWith('.map'))) issues.push('发布包不应包含 source map')

  if (rootProjectConfig?.miniprogramRoot !== 'miniprogram/dist/') {
    issues.push('根项目 miniprogramRoot 必须指向 miniprogram/dist/')
  }
  if (rootProjectConfig?.setting?.compileHotReLoad !== false) {
    issues.push('根项目必须关闭 compileHotReLoad，避免构建时白屏')
  }
  if (miniProjectConfig?.setting?.compileHotReLoad !== false) {
    issues.push('小程序子项目必须关闭 compileHotReLoad')
  }

  return {
    ok: issues.length === 0,
    issues,
    imageCount: distImages.length,
    fileCount: distFiles.length,
    totalBytes
  }
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url

if (isMain) {
  const miniRoot = path.resolve(import.meta.dirname, '..')
  const repoRoot = path.resolve(miniRoot, '..')
  const result = auditRelease({ miniRoot, repoRoot })

  if (!result.ok) {
    console.error('小程序发布检查失败：')
    for (const issue of result.issues) console.error(`- ${issue}`)
    process.exitCode = 1
  } else {
    console.log(`小程序发布检查通过：${result.fileCount} 个文件，44 张点位图，${(result.totalBytes / 1024 / 1024).toFixed(2)} MiB`)
  }
}
