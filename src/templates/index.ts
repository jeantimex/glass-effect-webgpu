export { articleTemplate, createArticleElement, type ArticleTemplateOptions } from './article'

import { createArticleElement, type ArticleTemplateOptions } from './article'
import type { BackgroundType } from '../webgpu/types'

export interface BackgroundTemplateOptions {
  article?: ArticleTemplateOptions
}

export function createBackgroundElement(
  type: BackgroundType,
  options: BackgroundTemplateOptions = {}
): HTMLElement | null {
  switch (type) {
    case 'article':
      return createArticleElement(options.article ?? { imageUrl: '' })
    default:
      return null
  }
}

export function isTemplateBackground(type: BackgroundType): boolean {
  return type === 'article'
}
