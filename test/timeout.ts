import { test } from '@substrate-system/tapzero'
import Protocol from '../src/index.js'

test('Timeout when peer does not respond', async t => {
    t.plan(9)

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
            let requests = 0

            wire.request(0, 0, 0, err => {
                t.ok(err)
                t.ok(++requests === 1)
                n += 2
                if (n === 9) resolve()
            })

            wire.request(0, 0, 0, err => {
                t.ok(err)
                t.ok(++requests === 2)
                n += 2
                if (n === 9) resolve()
            })

            wire.request(0, 0, 0, err => {
                t.ok(err)
                t.ok(++requests === 3)
                n += 2
                if (n === 9) resolve()
            })
        })

        wire.on('timeout', () => {
            t.ok(++timeouts <= 3) // should get called 3 times
            n++
            if (n === 9) resolve()
        })

        wire.unchoke()
    })
})
