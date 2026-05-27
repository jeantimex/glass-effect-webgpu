export const bannerTemplate = `
<div class="banner-background" data-background="banner">
  <img class="banner-img" alt="Banner" />
</div>
`

export interface BannerTemplateOptions {
  imageUrl: string
}

export function createBannerElement(options: BannerTemplateOptions): HTMLElement {
  const template = document.createElement('template')
  template.innerHTML = bannerTemplate.trim()

  const element = template.content.firstElementChild!.cloneNode(true) as HTMLElement

  const img = element.querySelector('.banner-img') as HTMLImageElement
  if (img && options.imageUrl) {
    img.src = options.imageUrl
  }

  return element
}
