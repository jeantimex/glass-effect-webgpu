export { articleTemplate, createArticleElement, type ArticleTemplateOptions } from './article'
export { leavesTemplate, createLeavesElement, type LeavesTemplateOptions } from './leaves'

import { createArticleElement, type ArticleTemplateOptions } from './article'
import { createLeavesElement, type LeavesTemplateOptions } from './leaves'
import type { BackgroundType } from '../webgpu/types'

export interface BackgroundTemplateOptions {
  article?: ArticleTemplateOptions
  leaves?: LeavesTemplateOptions
}

export function createBackgroundElement(
  type: BackgroundType,
  options: BackgroundTemplateOptions = {}
): HTMLElement | null {
  switch (type) {
    case 'article':
      return createArticleElement(options.article ?? { imageUrl: '' })
    case 'leaves':
      return createLeavesElement(options.leaves ?? { imageUrl: '' })
    default:
      return null
  }
}

export function isTemplateBackground(type: BackgroundType): boolean {
  return type === 'article' || type === 'leaves'
}
