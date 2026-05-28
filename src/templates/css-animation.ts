export const cssAnimationTemplate = `
<div class="css-animation-background" data-background="grid">
  <div class="css-animation-grid"></div>
</div>
`

export function createCssAnimationElement(): HTMLElement {
  const template = document.createElement('template')
  template.innerHTML = cssAnimationTemplate.trim()

  return template.content.firstElementChild!.cloneNode(true) as HTMLElement
}
