addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return new Response('WebSocket endpoint only', { status: 400 })
    }

    const mcServer = 'ws://TrioUniverse.aternos.me'

    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)
    server.accept()
    client.accept()

    const upstream = new WebSocket(mcServer)
    upstream.addEventListener('open', () => {
        server.addEventListener('message', msg => upstream.send(msg.data))
        upstream.addEventListener('message', msg => server.send(msg.data))
    })

    upstream.addEventListener('close', () => server.close())
    server.addEventListener('close', () => upstream.close())

    // Free keepalive
    setInterval(() => {
        if (upstream.readyState === WebSocket.OPEN) {
            upstream.send(JSON.stringify({ keepalive: true }))
        }
    }, 15000)

    return new Response(null, { status: 101, webSocket: client })
}
