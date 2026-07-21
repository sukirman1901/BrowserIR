export type ContentType = 'article' | 'documentation' | 'api' | 'blog' | 'tutorial' | 'forum' | 'unknown'

export interface ContentResult {
  type: ContentType
  title: string
  content: string
  markdown: string
  structure: ContentSection[]
  metadata: ContentMetadata
  links: ContentLink[]
  codeBlocks: CodeBlock[]
}

export interface ContentSection {
  level: number
  heading: string
  content: string
  type: 'text' | 'code' | 'list' | 'table' | 'image'
}

export interface ContentMetadata {
  author?: string
  publishDate?: string
  description?: string
  keywords?: string[]
  readingTime?: number
  wordCount: number
}

export interface ContentLink {
  text: string
  url: string
  type: 'internal' | 'external' | 'anchor'
}

export interface CodeBlock {
  language: string
  code: string
  filename?: string
}
