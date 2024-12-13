import { test } from '@substrate-system/tapzero'
import Protocol from '../src/index.js'

test('Timeout and destroy when peer does not respond', async t => {
    t.plan(4)

    let timeouts = 0
    const wire = await Protocol.create()

    return new Promise<void>(resolve => {
        let n = 0
        wire.on('error', err => t.fail(err))
        wire.pipe(wire)
        wire.setTimeout(1000)
        wire.handshake(
            Buffer.from('01234567890123456789'),
            Buffer.from('12345678901234567890')
        )

        wire.on('unchoke', () => {
            wire.request(0, 0, 0, err => {
                t.ok(err)
                n++
                if (n === 4) resolve()
            })

            wire.request(0, 0, 0, err => {
                t.ok(err)
                n++
                if (n === 4) resolve()
            })

            wire.request(0, 0, 0, err => {
                t.ok(err)
                n++
                if (n === 4) resolve()
            })
        })

        wire.on('timeout', () => {
            t.equal(++timeouts, 1)
            wire.end()
            n++
            if (n === 4) resolve()
        })

        wire.unchoke()
    })
})
