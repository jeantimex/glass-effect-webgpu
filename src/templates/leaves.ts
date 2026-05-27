export const leavesTemplate = `
<div class="leaves-background" data-background="leaves">
  <img class="leaves-img" alt="Leaves" />
</div>
`

export interface LeavesTemplateOptions {
  imageUrl: string
}

export function createLeavesElement(options: LeavesTemplateOptions): HTMLElement {
  const template = document.createElement('template')
  template.innerHTML = leavesTemplate.trim()

  const element = template.content.firstElementChild!.cloneNode(true) as HTMLElement

  const img = element.querySelector('.leaves-img') as HTMLImageElement
  if (img && options.imageUrl) {
    img.src = options.imageUrl
  }

  return element
}
