import { test } from '@substrate-system/tapzero'
import Protocol from '../src/index.js'

test('Extension.prototype.name', async t => {
    t.plan(2)

    const wire = await Protocol.create()

    function NoNameExtension () {}

    t.throws(() => {
        wire.use(NoNameExtension)
    }, 'throws when Extension.prototype.name is undefined')

    function NamedExtension () {}
    NamedExtension.prototype.name = 'named_extension'
    try {
        wire.use(NamedExtension)
        t.ok(true, 'does not throw when Extension.prototype.name is defined')
    } catch (err) {
        t.ok(!err, 'should now throw')
    }
})

test('Extension.onHandshake', async t => {
    t.plan(4)

    return new Promise<void>((resolve) => {
        const TestExtension = noop
        TestExtension.prototype.name = 'test_extension'
        TestExtension.prototype.onHandshake = (infoHash, peerId) => {
            t.equal(Buffer.from(infoHash, 'hex').length, 20)
            t.equal(Buffer.from(infoHash, 'hex').toString(), '01234567890123456789')
            t.equal(Buffer.from(peerId, 'hex').length, 20)
            t.equal(Buffer.from(peerId, 'hex').toString(), '12345678901234567890')
            resolve()
        }

        (async () => {
            const wire = await Protocol.create()
            wire.on('error', err => {
                t.fail('' + err)
            })
            wire.pipe(wire)

            wire.use(TestExtension)

            wire.handshake(
                Buffer.from('01234567890123456789'),
                Buffer.from('12345678901234567890')
            )
        })()
    })
})

test('Extension.onExtendedHandshake', async t => {
    t.plan(3)

    class TestExtension {
        // this passes the prototype check
        get name ():string {
            return 'test_extension'
        }

        constructor (wire) {
            wire.extendedHandshake = {
                hello: 'world!'
            }
        }

        onExtendedHandshake (handshake) {
            t.ok(handshake.m.test_extension,
                'peer extended handshake includes extension name')
            t.equal(Buffer.from(handshake.hello).toString(), 'world!',
                'peer extended handshake includes extension-defined parameters')
        }
    }

    return new Promise<void>(resolve => {
        (async () => {
            const wire = await Protocol.create() // incoming
            wire.on('error', err => {
                t.fail('' + err)
            })
            wire.pipe(wire)

            // @ts-expect-error events???
            wire.once('handshake', (_infoHash, _peerId, extensions) => {
                t.equal(extensions.extended, true)
                resolve()
            })
            wire.use(TestExtension)

            wire.handshake(
                '3031323334353637383930313233343536373839',
                '3132333435363738393031323334353637383930'
            )
        })()
    })
})

test('Extension.onMessage', async t => {
    t.plan(1)

    class TestExtension {
        wire
        name = 'test_extension'

        constructor (wire) {
            this.wire = wire
        }

        onMessage (message) {
            t.equal(Buffer.from(message).toString(), 'hello world!',
                'receives message sent with wire.extended()')
        }
    }

    const wire = await Protocol.create()  // outgoing
    wire.on('error', err => { t.fail(err) })
    wire.pipe(wire)

    wire.use(TestExtension)

    wire.handshake(
        '3031323334353637383930313233343536373839',
        '3132333435363738393031323334353637383930'
    )

    // @ts-expect-error events ???
    wire.once('extended', () => {
        wire.extended('test_extension', Buffer.from('hello world!'))
    })
})

function noop () {}
