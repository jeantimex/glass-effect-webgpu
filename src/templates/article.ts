export const articleTemplate = `
<div class="article-background" data-background="article">
  <div class="article-content">
    <div class="article-text">
      <p class="article-category"><span class="category-line"></span>HTML-IN-CANVAS</p>
      <h1 class="article-title">Liquid Glass<span class="title-line"></span><br>Live DOM Lens</h1>
      <p class="article-body">This page is real HTML content copied into a WebGPU texture with HTML-in-Canvas, then refracted by the liquid glass shader.</p>
      <p class="article-body">The DOM stays available for layout and hit testing while the lens bends the rendered pixels with thickness, blur, and specular highlights.</p>
      <p class="article-body">Drag the glass across text and imagery to see CSS layout, selectable content, and WebGPU distortion share the same surface.</p>
    </div>
    <div class="article-image">
      <img class="article-img" alt="Leaves" />
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
