export const videoTemplate = `
<video class="video-background video-element" data-background="video" muted loop playsinline></video>
`

export interface VideoTemplateOptions {
  videoUrl: string
}

export function createVideoElement(options: VideoTemplateOptions): HTMLElement {
  const template = document.createElement('template')
  template.innerHTML = videoTemplate.trim()

  const element = template.content.firstElementChild!.cloneNode(true) as HTMLElement
  const video = element as HTMLVideoElement

  if (video && options.videoUrl) {
    video.src = options.videoUrl
    video.crossOrigin = 'anonymous'
  }

  return element
}
