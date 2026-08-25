export function useTrace() {
  async function trace(): Promise<string> {
    throw new Error('Not implemented')
  }

  return { trace }
}
