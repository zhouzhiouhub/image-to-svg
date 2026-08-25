export type InputKind = 'raster' | 'svg'

export function useFileValidate() {
  function validate(_file: File): InputKind {
    return 'raster'
  }

  return { validate }
}
