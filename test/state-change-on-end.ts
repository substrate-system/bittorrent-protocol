import { test } from '@substrate-system/tapzero'
import Protocol from '../src/index.js'

test('State changes correctly on wire "end"', async t => {
    t.plan(11)

    const wire = await Protocol.create()
    return new Promise<void>(resolve => {
        let n = 0
        wire.on('error', err => t.fail(err))
        wire.pipe(wire)

        wire.handshake(
            Buffer.from('01234567890123456789'),
            Buffer.from('12345678901234567890')
        )

        t.ok(wire.amChoking)
        t.ok(wire.peerChoking)
        n += 2

        wire.on('unchoke', () => {
            t.ok(!wire.amChoking)
            t.ok(!wire.peerChoking)
            n += 2
            if (n === 11) resolve()
            wire.interested()
        })

        wire.on('interested', () => {
            t.ok(wire.peerInterested)
            n++
            if (n === 11) resolve()
            destroy()
        })

        function destroy () {
            wire.on('choke', () => {
                t.ok(true, 'wire got choke event')
                n++
                if (n === 11) resolve()
            })
            wire.on('uninterested', () => {
                t.ok(true, 'wire got uninterested event')
                n++
                if (n === 11) resolve()
            })

            wire.on('end', () => {
                t.ok(wire.peerChoking)
                t.ok(!wire.peerInterested)
                n += 2
                if (n === 11) resolve()
            })

            wire.on('finish', () => {
                t.ok(wire.peerChoking)
                t.ok(!wire.peerInterested)
                n += 2
                if (n === 12) resolve()
            })

            wire.destroy()
        }

        wire.unchoke()
    })
})
