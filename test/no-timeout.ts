import { test } from '@substrate-system/tapzero'
import Protocol from '../src/index.js'

test('No timeout when peer is good', async t => {
    t.plan(3)

    const wire = await Protocol.create()
    wire.on('error', err => { t.fail(err) })
    wire.pipe(wire)
    wire.setTimeout(1000)
    wire.handshake(
        Buffer.from('01234567890123456789'),
        Buffer.from('12345678901234567890')
    )

    return new Promise<void>(resolve => {
        let n = 0

        wire.on('unchoke', () => {
            wire.request(0, 0, 11, err => {
                t.ok(!err, 'should not return error')
                n++
                if (n === 3) resolve()
            })

            wire.request(0, 0, 11, err => {
                t.ok(!err, '.request should not throw, 2nd time')
                n++
                if (n === 3) resolve()
            })

            wire.request(0, 0, 11, err => {
                t.ok(!err, '.request should not throw, 3rd time')
                n++
                if (n === 3) resolve()
            })
        })

        wire.on('request', (i, offset, length, callback) => {
            callback(null, Buffer.from('hello world'))
        })

        // there should never be a timeout
        wire.on('timeout', () => {
            t.fail('Timed out')
        })

        wire.unchoke()
    })
})
