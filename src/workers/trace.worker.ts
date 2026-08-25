addEventListener('message', (event: MessageEvent<{ type?: string }>) => {
  if (event.data.type === 'ping') {
    postMessage({ type: 'pong' })
  }
})
