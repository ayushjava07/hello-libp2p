import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { multiaddr } from 'multiaddr'
import { ping } from '@libp2p/ping'
import { peerIdFromString } from '@libp2p/peer-id'
const main = async () => {
  const node = await createLibp2p({
    addresses: {
      listen: ['/ip4/127.0.0.1/tcp/0']
    },
    transports: [tcp()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      ping: ping({
        protocolPrefix: 'ipfs'
      })
    }
  })

  await node.start()

  console.log('libp2p has started')
  console.log('listening on addresses:')

  node.getMultiaddrs().forEach((addr) => {
    console.log(addr.toString())
  })

  if (process.argv.length >= 3) {
    const ma = multiaddr(process.argv[2])
    console.log(`pinging remote peer at ${process.argv[2]}`)
	await node.dial(ma)
	const peerId=peerIdFromString(ma.getPeerId())
    const latency = await node.services.ping.ping(peerId)
    console.log(`pinged in ${latency / 1000000}ms`)
  } else {
    console.log('no remote peer address given, skipping ping')
  }

  // graceful shutdown
  const stop = async () => {
    await node.stop()
    console.log('libp2p has stopped')
    process.exit(0)
  }

  process.on('SIGTERM', stop)
  process.on('SIGINT', stop)

  // keep alive
  process.stdin.resume()
}

main().catch(console.error)
