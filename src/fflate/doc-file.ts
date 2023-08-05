import { Buffer } from 'buffer'

// import fs from 'fs-extra'
import path from 'pathe'
import * as fflate from 'fflate'
import { Hookable, createHooks } from 'hookable'
import { Logger } from '@171h/log'
// import type { DocxOptions } from '@171h/remark-docx'

type DocxOptions = any

const logger = new Logger('doc-file.ts')

// The .mddoc file directory structure
//
// ├─┬ root
// │ ├─┬ doc
// │ │ ├── index.md
// │ │ ├─┬ media
// │ │ │ ├── img/video...
// │ │ │ └── ...
// │ │ ├─┬ theme
// │ │ │ ├── theme1.json
// │ │ │ ├── theme2.json
// │ │ │ └── ...
// │ │ ├── setting.json
// │ │ ├── _rels(reserved directory)
// │ │ ├── embeddings(reserved directory)
// │ │ └── ...
// │ ├─┬ docProps (文档属性)
// │ │ ├── app.json
// │ │ ├── core.json
// │ │ └── custom.json
// │ ├─┬ customJson(reserved directory)
// │ │ └── ...
// │ ├─┬ _rels(reserved directory)
// │ │ └── ...

export enum FixRelativePath {
  dDoc = 'doc',
  dDocProps = 'docProps',
  dCustomJson = 'customJson',
  dMedia = 'doc/media',
  dTheme = 'doc/theme',
  dEmbeddings = 'doc/embeddings',
  fIndex = 'doc/index.md',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  fdoc = 'doc/index.md',
  fSetting = 'doc/setting.json',
  fAppDocProps = 'docProps/app.json',
  fCoreDocProps = 'docProps/core.json',
  fCustomDocProps = 'docProps/custom.json',
}
type ThemeRelativePath = `theme${number}.json`
type RelativePath = FixRelativePath | ThemeRelativePath | string
type MddocOptions = Omit<DocxOptions, 'output' | 'imageResolver'>
interface CoreDocProps {
  title: string
  subject: string
  creator: string // "作者1; 作者2; 作者3"
  keywords: string // "关键字1; 关键字2; 关键字3"
  description: string
  lastModifiedBy: string
  revision: number
  lastPrinted: string
  created: string // 2016-11-01T00:50:00Z
  modified: string // 2021-12-21T08:17:00Z
  category: string // "分类1; 分类2; 分类3"
  contentStatus: string
  language: string
  version: string
}

interface AppDocProps {
  temmplate: string // "Normal.dotm"
  totalTime: number // 总编辑时间，单位分钟
  pages: number // 总页数
  words: number // 总字数
  characters: number // 总字符数
  application: string // "Microsoft Macintosh Word"
  docSecurity: number // 0
  lines: number // 总行数
  paragraphs: number // 总段落数
  scaleCrop: string // 'false' | 'true'
  manager: string // "管理员"
  company: string // "公司"
  linksUpToDate: string // 'false' | 'true'
  charactersWithSpaces: number // 总字符数（包括空格）
  sharedDoc: string // 'false' | 'true'
  hyperlinksChanged: string // 'false' | 'true'
  appVersion: string // "16.0000"
}

interface Hooks {
  'before:init': () => void
  'init': () => void
  'after:init': () => void
  'getData': (fullRelativePath: RelativePath) => void
  'before:setData': (fullRelativePath: string, data: Uint8Array) => void
  'setData': (fullRelativePath: string, data: Uint8Array) => void
  'after:setData': (fullRelativePath: string, data: Uint8Array) => void
  'saveZip': (relativePath: RelativePath) => void
}

type Options = Parameters<typeof fflate.unzipSync>[1]

export class DocFile extends Hookable<Hooks> {
  constructor(data?: Uint8Array, options?: Options) {
    super()
    this.init(data, options)
  }

  private zip: fflate.Unzipped = {}
  hooks = createHooks()

  init(data?: Uint8Array, options?: Options) {
    let d = data
    if (!d)
      d = DocFile.createBlankDocFile()
    this.zip = fflate.unzipSync(d, options)
  }

  static createBlankDocFile() {
    return fflate.zipSync({ 'doc/index.md': fflate.strToU8('') })
  }

  /**
   * 判断是否为 {@link FixRelativePath} 类型
   * @param value any
   * @returns
   */
  static isFixRelativePath(value: any): value is FixRelativePath {
    return Object.values(FixRelativePath).includes(value as FixRelativePath)
  }

  /**
   * 判断是否为 {@link ThemeRelativePath} 类型
   * @param value
   * @returns
   */
  static isThemeRelativePath(value: any): value is ThemeRelativePath {
    return /\/?theme\d+\.json$/.test(value)
  }

  /**
   * 判断是否为为完整的 media 相对路径
   * @param value
   * @returns
   */
  static isFullMediaRelativePath(value: any): value is string {
    const regStr = '^doc/media/.*$'
    return new RegExp(regStr).test(value)
  }

  /**
   * 根据给定路径，返回完整的相对路径及其文件的类型
   * @param relativePath // 相对路径
   * @returns
   */
  static relativePath(relativePath: RelativePath, fixPath = true) {
    if (!fixPath)
      return path.join(relativePath)

    let ret = ''
    if (DocFile.isFixRelativePath(relativePath))
      ret = path.join(relativePath)

    else if (DocFile.isThemeRelativePath(relativePath))
      ret = path.join(FixRelativePath.dTheme, relativePath)

    else
      ret = path.join(FixRelativePath.dMedia, relativePath)

    return ret
  }

  async get(relativePath: RelativePath) {
    const fullRelativePath = DocFile.relativePath(relativePath)
    return await this.getData(fullRelativePath)
  }

  /**
   * 获取指定路径的值
   * @param fullRelativePath
   * @returns string | ArrayBuffer
   */
  async getData(fullRelativePath: string) {
    this.hooks.callHook('getData', fullRelativePath)
    return this.zip[fullRelativePath]
  }

  async set(relativePath: RelativePath, data: Uint8Array) {
    const fullRelativePath = DocFile.relativePath(relativePath)
    await this.setData(fullRelativePath, data)
  }

  /**
   * 重置指定路径的值
   * @param fullRelativePath
   * @param data
   */
  async setData(fullRelativePath: string, data: Uint8Array) {
    this.hooks.callHook('before:setData', fullRelativePath, data)
    this.hooks.callHook('setData', fullRelativePath, data)
    this.zip[fullRelativePath] = data
    this.hooks.callHook('after:setData', fullRelativePath, data)
  }

  async del(relativePath: RelativePath) {
    const fullRelativePath = DocFile.relativePath(relativePath)
    await this.delData(fullRelativePath)
  }

  async delData(fullRelativePath: string) {
    this.hooks.callHook('delData', fullRelativePath)
    delete this.zip[fullRelativePath]
  }

  async saveZip(output: 'buffer'): Promise<Buffer>
  async saveZip(output: 'arraybuffer'): Promise<ArrayBuffer>
  async saveZip(output?: 'uint8array'): Promise<Uint8Array>
  /**
   * 保存 zip 文件
   * @returns
   */
  async saveZip(output?: 'buffer' | 'uint8array' | 'arraybuffer') {
    this.hooks.callHook('saveZip')
    const u8 = fflate.zipSync(this.zip)
    switch (output) {
      case 'buffer':
        return u8
      case 'arraybuffer':
        return Buffer.from(u8)
      default:
        return u8
    }
  }

  async unzip(dir: string) {
    // for (const [key, value] of Object.entries(this.zip)) {
    //   const fullPath = path.join(dir, key)
    //   // await fs.ensureDir(path.dirname(fullPath))
    //   // fs.writeFileSync(fullPath, fflate.strFromU8(value))
    // }

    // this.zip.forEach(async (value, key) => {
    //   const fullPath = path.join(dir, key)
    //   logger.info('fullPath', fullPath)
    //   await fs.ensureDir(path.dirname(fullPath))
    //   if (typeof value === 'string')
    //     fs.writeFileSync(fullPath, value)
    //   else
    //     fs.writeFileSync(fullPath, Buffer.from(value))
    // })
  }
}
