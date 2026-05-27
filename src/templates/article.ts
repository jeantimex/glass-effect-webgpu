export const articleTemplate = `
<div class="article-background" data-background="article">
  <div class="article-content">
    <div class="article-text">
      <p class="article-category"><span class="category-line"></span>OPTICS STUDY</p>
      <h1 class="article-title">Liquid Glass<span class="title-line"></span><br>Precision Lens</h1>
      <p class="article-body">Drag the capsule to bend the page. This lens is a compact SVG displacement rig that refracts whatever sits beneath it.</p>
      <p class="article-body">The field comes from a rounded bezel profile; pixels are pushed along its gradient, then topped with a subtle specular bloom for depth.</p>
      <p class="article-body">Sweep across strong edges—high contrast makes the bend snap.</p>
    </div>
    <div class="article-image">
      <img class="article-img" alt="Tree frog" />
      <p class="article-credit">PHOTO: STEPHANIE LEBLANC / UNSPLASH</p>
    </div>
  </div>
</div>
`

export interface ArticleTemplateOptions {
  imageUrl: string
}

export function createArticleElement(options: ArticleTemplateOptions): HTMLElement {
  const template = document.createElement('template')
  template.innerHTML = articleTemplate.trim()

  const element = template.content.firstElementChild!.cloneNode(true) as HTMLElement

  const img = element.querySelector('.article-img') as HTMLImageElement
  if (img && options.imageUrl) {
    img.src = options.imageUrl
  }

  return element
}
