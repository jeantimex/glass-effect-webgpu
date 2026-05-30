export { articleTemplate, createArticleElement, type ArticleTemplateOptions } from './article'
export { bannerTemplate, createBannerElement, type BannerTemplateOptions } from './banner'
export { cssAnimationTemplate, createCssAnimationElement } from './css-animation'
export { fujiTemplate, createFujiElement, type FujiTemplateOptions } from './fuji'

import { createArticleElement, type ArticleTemplateOptions } from './article'
import { createBannerElement, type BannerTemplateOptions } from './banner'
import { createCssAnimationElement } from './css-animation'
import { createFujiElement, type FujiTemplateOptions } from './fuji'
import type { BackgroundType } from '../webgpu/types'

export interface BackgroundTemplateOptions {
  article?: ArticleTemplateOptions
  banner?: BannerTemplateOptions
  fuji?: FujiTemplateOptions
}

export function createBackgroundElement(
  type: BackgroundType,
  options: BackgroundTemplateOptions = {}
): HTMLElement | null {
  switch (type) {
    case 'grid':
      return createCssAnimationElement()
    case 'article':
      return createArticleElement(options.article ?? { imageUrl: '' })
    case 'banner':
      return createBannerElement(options.banner ?? { imageUrl: '' })
    case 'fuji':
      return createFujiElement(options.fuji ?? { imageUrl: '' })
    default:
      return null
  }
}

export function isTemplateBackground(type: BackgroundType): boolean {
  return type === 'grid' || type === 'article' || type === 'banner' || type === 'fuji'
}
