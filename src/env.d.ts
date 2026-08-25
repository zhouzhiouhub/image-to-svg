/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE?: string
  readonly VITE_APP_TITLE?: string
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.wasm' {
  const src: string
  export default src
}

declare module 'imagetracerjs' {
  export type ImageTracerOptions = {
    ltres?: number
    qtres?: number
    pathomit?: number
    rightangleenhance?: boolean
    colorsampling?: number
    numberofcolors?: number
    mincolorratio?: number
    colorquantcycles?: number
    layering?: number
    strokewidth?: number
    linefilter?: boolean
    scale?: number
    roundcoords?: number
    viewbox?: boolean
    desc?: boolean
    blurradius?: number
    blurdelta?: number
  }

  type ImageTracerInput = ImageData | { width: number; height: number; data: ArrayLike<number> }

  const ImageTracer: {
    imagedataToSVG(imageData: ImageTracerInput, options?: ImageTracerOptions | string): string
  }

  export default ImageTracer
}
