export { articleTemplate, createArticleElement, type ArticleTemplateOptions } from './article'
export { bannerTemplate, createBannerElement, type BannerTemplateOptions } from './banner'
export { leavesTemplate, createLeavesElement, type LeavesTemplateOptions } from './leaves'

import { createArticleElement, type ArticleTemplateOptions } from './article'
import { createBannerElement, type BannerTemplateOptions } from './banner'
import { createLeavesElement, type LeavesTemplateOptions } from './leaves'
import type { BackgroundType } from '../webgpu/types'

export interface BackgroundTemplateOptions {
  article?: ArticleTemplateOptions
  banner?: BannerTemplateOptions
  leaves?: LeavesTemplateOptions
}

export function createBackgroundElement(
  type: BackgroundType,
  options: BackgroundTemplateOptions = {}
): HTMLElement | null {
  switch (type) {
    case 'article':
      return createArticleElement(options.article ?? { imageUrl: '' })
    case 'banner':
      return createBannerElement(options.banner ?? { imageUrl: '' })
    case 'leaves':
      return createLeavesElement(options.leaves ?? { imageUrl: '' })
    default:
      return null
  }
}

export function isTemplateBackground(type: BackgroundType): boolean {
  return type === 'article' || type === 'banner' || type === 'leaves'
}
