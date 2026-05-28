export const bannerTemplate = `
<div class="banner-background" data-background="banner">
  <img class="banner-img" alt="Banner" />
  <div class="banner-copy">
    <p class="banner-category"><span class="category-line"></span>LIQUID OPTICS</p>
    <h1 class="banner-title">Liquid Glass</h1>
    <p class="banner-body">A signed distance field defines the glass shape, while the displacement map and bevel profile bend background pixels through thickness, refraction, and magnification controls.</p>
    <p class="banner-body">Progressive blur, chromatic offset, specular rims, and spring-driven deformation combine to make the surface feel fluid under pointer input.</p>
  </div>
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
