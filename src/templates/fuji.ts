export const fujiTemplate = `
<div class="fuji-background" data-background="fuji">
  <div class="fuji-banner">
    <img class="fuji-img" alt="Mount Fuji" />
  </div>
  <div class="fuji-content">
    <h1 class="fuji-title">Mount Fuji</h1>
    <p class="fuji-body">When seen at a distance, Mount Fuji presents a beautiful, nearly symmetric, often snow-capped profile and is Japan's tallest and most iconic mountain. The volcanic cone rises gracefully up to slightly more than 12,000 feet. On clear days, the mountain is visible as far away as Tokyo. Despite its seemingly peaceful distant existence, Mount Fuji is an active volcano. Its last eruption was in 1707.</p>
    <p class="fuji-body">Similar to other exceptionally tall mountains, Fuji-san is home to many ecological zones from its base to its summit. In the lower elevations, deciduous and coniferous trees such as the Japanese oak and cedars are common. As you climb in elevation, the climate becomes harsher and plant life transitions to alpine plants and shrubs that have adapted to colder temperatures. At the highest altitudes, a volcanic desert environment exists.</p>
    <p class="fuji-body">Many mammals and birds are found in the forests on Mount Fuji. Black bears live there, although squirrels and fox are more likely to be seen. The Japanese serow is a rare and protected species of goat-antelope that roams secretively through dense forests. High altitude birds such as the Iwahibari and Hoshigarasu are found above 8,200 feet, while several species of warblers, flycatchers, and Ural and scops owls live in lower altitudes.</p>
  </div>
</div>
`

export interface FujiTemplateOptions {
  imageUrl: string
}

export function createFujiElement(options: FujiTemplateOptions): HTMLElement {
  const template = document.createElement('template')
  template.innerHTML = fujiTemplate.trim()

  const element = template.content.firstElementChild!.cloneNode(true) as HTMLElement

  const img = element.querySelector('.fuji-img') as HTMLImageElement
  if (img && options.imageUrl) {
    img.src = options.imageUrl
  }

  return element
}
