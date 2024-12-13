import { test } from '@substrate-system/tapzero'
import Protocol from '../src/index.js'

test('Handshake', async t => {
    t.plan(4)

    const wire = await Protocol.create()

    return new Promise<void>(resolve => {
        wire.on('error', err => { t.fail(err) })
        wire.pipe(wire)

        wire.on('handshake', (infoHash, peerId) => {
            t.equal(Buffer.from(infoHash, 'hex').length, 20)
            t.equal(Buffer.from(infoHash, 'hex').toString(), '01234567890123456789')
            t.equal(Buffer.from(peerId, 'hex').length, 20)
            t.equal(Buffer.from(peerId, 'hex').toString(), '12345678901234567890')
            resolve()
        })

        wire.handshake(
            Buffer.from('01234567890123456789'),
            Buffer.from('12345678901234567890')
        )
    })
})

test('Handshake (with string args)', async t => {
    t.plan(4)

    const wire = await Protocol.create()

    return new Promise<void>(resolve => {
        wire.on('error', err => { t.fail(err) })
        wire.pipe(wire)

        wire.on('handshake', (infoHash, peerId) => {
            t.equal(Buffer.from(infoHash, 'hex').length, 20)
            t.equal(Buffer.from(infoHash, 'hex').toString(), '01234567890123456789')
            t.equal(Buffer.from(peerId, 'hex').length, 20)
            t.equal(Buffer.from(peerId, 'hex').toString(), '12345678901234567890')
            resolve()
        })

        wire.handshake(
            '3031323334353637383930313233343536373839',
            '3132333435363738393031323334353637383930'
        )
    })
})

test('Asynchronous handshake + extended handshake', async t => {
    t.plan(9)
    const eventLog:string[] = []

    const wire1 = await Protocol.create()  // outgoing
    const wire2 = await Protocol.create()  // incoming
    wire1.pipe(wire2).pipe(wire1)
    wire1.on('error', err => { t.fail(err) })
    wire2.on('error', err => { t.fail(err) })

    return new Promise<void>(resolve => {
        let n = 0

        wire1.on('handshake', (infoHash, peerId, extensions) => {
            n++
            eventLog.push('w1 hs')
            t.equal(Buffer.from(infoHash, 'hex').toString(), '01234567890123456789')
            t.equal(Buffer.from(peerId, 'hex').toString(), '12345678901234567890')
            t.equal(extensions.extended, true)
            if (n === 4) resolve()
        })

        wire1.on('extended', (ext, obj) => {
            n++
            if (ext === 'handshake') {
                eventLog.push('w1 ex')
                t.ok(obj, 'should get an argument')

                queueMicrotask(() => {
                    // Last step: ensure handshakes came before extension protocol
                    t.deepEqual(eventLog, ['w2 hs', 'w1 hs', 'w1 ex', 'w2 ex'])
                })
            }
            if (n === 4) resolve()
        })

        wire2.on('handshake', (infoHash, peerId, extensions) => {
            n++
            eventLog.push('w2 hs')
            t.equal(Buffer.from(infoHash, 'hex').toString(), '01234567890123456789')
            t.equal(Buffer.from(peerId, 'hex').toString(), '12345678901234567890')
            t.equal(extensions.extended, true)

            // Respond asynchronously
            queueMicrotask(() => {
                wire2.handshake(infoHash, peerId)
            })
            if (n === 4) resolve()
        })

        wire2.on('extended', (ext, obj) => {
            if (ext === 'handshake') {
                n++
                eventLog.push('w2 ex')
                t.ok(obj, 'wire2 extended event')
                if (n === 4) resolve()
            }
        })

        wire1.handshake(
            '3031323334353637383930313233343536373839',
            '3132333435363738393031323334353637383930'
        )
    })
})

test('Unchoke', async t => {
    t.plan(4)

    const wire = await Protocol.create()
    return new Promise<void>(resolve => {
        wire.on('error', err => { t.fail(err) })
        wire.pipe(wire)
        wire.handshake(
            Buffer.from('01234567890123456789'),
            Buffer.from('12345678901234567890')
        )

        t.ok(wire.amChoking)
        t.ok(wire.peerChoking)

        let n = 0
        wire.on('unchoke', () => {
            n++
            t.ok(!wire.peerChoking)
            if (n === 2) resolve()
        })

        wire.unchoke()
        n++
        t.ok(!wire.amChoking)
        if (n === 2) resolve()
    })
})

test('Interested', async t => {
    t.plan(4)

    const wire = await Protocol.create()
    return new Promise<void>(resolve => {
        let n = 0
        wire.on('error', err => t.fail(err))
        wire.pipe(wire)
        wire.handshake(
            Buffer.from('01234567890123456789'),
            Buffer.from('12345678901234567890')
        )

        t.ok(!wire.amInterested)
        n++
        t.ok(!wire.peerInterested)
        n++

        wire.on('interested', () => {
            t.ok(wire.peerInterested)
            n++
            if (n === 4) resolve()
        })

        wire.interested()
        t.ok(wire.amInterested)
        n++
        if (n === 4) resolve()
    })
})

test('Request a piece', async t => {
    t.plan(12)

    let n = 0
    const wire = await Protocol.create()
    return new Promise<void>(resolve => {
        wire.on('error', err => t.fail(err))
        wire.pipe(wire)
        wire.handshake(
            Buffer.from('01234567890123456789'),
            Buffer.from('12345678901234567890')
        )

        t.equal(wire.requests.length, 0)
        t.equal(wire.peerRequests.length, 0)
        n += 2
        if (n === 12) resolve()

        wire.on('request', (i, offset, length, callback) => {
            t.equal(wire.requests.length, 1)
            t.equal(wire.peerRequests.length, 1)
            t.equal(i, 0)
            t.equal(offset, 1)
            t.equal(length, 11)
            n += 5
            if (n === 12) resolve()
            callback(null, Buffer.from('hello world'))
        })

        wire.once('unchoke', () => {
            t.equal(wire.requests.length, 0)
            n++
            wire.request(0, 1, 11, (err, buffer) => {
                t.equal(wire.requests.length, 0)
                t.ok(!err)
                t.equal(Buffer.from(buffer).toString(), 'hello world')
                n += 3
                if (n === 12) resolve()
            })
            t.equal(wire.requests.length, 1)
            n++
            if (n === 12) resolve()
        })

        wire.unchoke()
    })
})

test('No duplicate `have` events for same piece', async t => {
    t.plan(5)

    const wire = await Protocol.create()
    wire.on('error', err => t.fail(err))
    wire.pipe(wire)

    return new Promise<void>(resolve => {
        wire.handshake(
            '3031323334353637383930313233343536373839',
            '3132333435363738393031323334353637383930'
        )

        let haveEvents = 0
        wire.on('have', () => {
            haveEvents += 1
        })
        t.equal(haveEvents, 0)
        t.equal(!!wire.peerPieces.get(0), false)
        wire.have(0)

        setTimeout(() => {
            t.equal(haveEvents, 1, 'emitted event for new piece')
            wire.have(0)
            setTimeout(() => {
                t.equal(haveEvents, 1, 'not emitted for preexisting piece')
                t.equal(!!wire.peerPieces.get(0), true)
                resolve()
            }, 0)
        }, 0)
    })
})

test('Fast Extension: handshake when unsupported', async t => {
    t.plan(4)

    const wire1 = await Protocol.create()
    const wire2 = await Protocol.create()

    return new Promise<void>(resolve => {
        let n = 0
        wire1.pipe(wire2).pipe(wire1)
        wire1.on('error', err => t.fail(err))
        wire2.on('error', err => t.fail(err))

        wire1.on('handshake', (_infoHash, _peerId, extensions) => {
            t.equal(extensions.fast, false)
            t.equal(wire1.hasFast, false)
            t.equal(wire2.hasFast, false)
            n += 3
            if (n === 4) resolve()
        })

        wire2.on('handshake', (infoHash, peerId, extensions) => {
            t.equal(extensions.fast, true)
            n++
            if (n === 4) resolve()

            // Respond asynchronously
            setTimeout(() => {
                wire2.handshake(infoHash, peerId, { fast: false }) // no support
            }, 0)
        })

        wire1.handshake(
            Buffer.from('01234567890123456789'),
            Buffer.from('12345678901234567890'), { fast: true }
        )
    })
})

test('Fast Extension: handshake when supported', async t => {
    t.plan(4)

    const wire1 = await Protocol.create()
    const wire2 = await Protocol.create()

    return new Promise<void>(resolve => {
        wire1.pipe(wire2).pipe(wire1)
        wire1.on('error', err => t.fail(err))
        wire2.on('error', err => t.fail(err))

        let n = 0
        wire1.on('handshake', (infoHash, peerId, extensions) => {
            t.equal(extensions.fast, true)
            t.equal(wire1.hasFast, true)
            t.equal(wire2.hasFast, true)
            n += 3
            if (n === 4) resolve()
        })

        wire2.on('handshake', (infoHash, peerId, extensions) => {
            t.equal(extensions.fast, true)
            n++
            if (n === 4) resolve()
            // Respond asynchronously
            queueMicrotask(() => {
                wire2.handshake(infoHash, peerId, { fast: true })
            })
        })

        wire1.handshake(
            Buffer.from('01234567890123456789'),
            Buffer.from('12345678901234567890'), { fast: true }
        )
    })
})

test('Fast Extension: have-all', async t => {
    t.plan(2)

    const wire = await Protocol.create()

    return new Promise<void>(resolve => {
        wire.on('error', err => t.fail(err))
        wire.pipe(wire)

        let n = 0
        wire.once('handshake', (_infoHash, _peerId, _extensions) => {
            t.equal(wire.hasFast, true, 'should have `wire.hasFast`')
            n++
            if (n === 2) resolve()
            wire.haveAll()
        })

        wire.once('have-all', () => {
            t.ok(true, 'got "have-all" event')
            n++
            if (n === 2) resolve()
        })

        wire.handshake(
            Buffer.from('01234567890123456789'),
            Buffer.from('12345678901234567890'), { fast: true }
        )
    })
})

test('Fast Extension: have-none', async t => {
    t.plan(2)

    const wire = await Protocol.create()
    return new Promise<void>(resolve => {
        wire.on('error', err => t.fail(err))
        wire.pipe(wire)

        let n = 0
        wire.once('handshake', (_infoHash, _peerId, _extensions) => {
            t.equal(wire.hasFast, true)
            n++
            wire.haveNone()
            if (n === 2) resolve()
        })

        wire.once('have-none', () => {
            t.ok(true)
            n++
            if (n === 2) resolve()
        })

        wire.handshake(
            Buffer.from('01234567890123456789'),
            Buffer.from('12345678901234567890'), { fast: true }
        )
    })
})

test('Fast Extension: suggest', async t => {
    t.plan(2)

    const wire = await Protocol.create()
    return new Promise<void>(resolve => {
        wire.on('error', err => t.fail(err))
        wire.pipe(wire)
        let n = 0

        wire.once('handshake', (_infoHash, _peerId, _extensions) => {
            t.equal(wire.hasFast, true)
            n++
            if (n === 2) resolve()
            wire.suggest(42)
        })

        wire.once('suggest', (index) => {
            t.equal(index, 42, 'should callback with the correct number')
            n++
            if (n === 2) resolve()
        })

        wire.handshake(
            Buffer.from('01234567890123456789'),
            Buffer.from('12345678901234567890'), { fast: true }
        )
    })
})

test('Fast Extension: allowed-fast', async t => {
    t.plan(6)

    const wire = await Protocol.create()
    return new Promise<void>(resolve => {
        wire.on('error', err => t.fail(err))
        wire.pipe(wire)

        let n = 0
        wire.once('handshake', (_infoHash, _peerId, _extensions) => {
            t.equal(wire.hasFast, true)
            t.deepEqual(wire.allowedFastSet, [])
            wire.allowedFast(6)
            t.deepEqual(wire.allowedFastSet, [6])
            t.deepEqual(wire.peerAllowedFastSet, [])
            n += 4
            if (n === 6) resolve()
        })

        wire.on('allowed-fast', (index) => {
            t.equal(index, 6)
            t.deepEqual(wire.peerAllowedFastSet, [6])
            n += 2
            if (n === 6) resolve()
        })

        wire.handshake(
            Buffer.from('01234567890123456789'),
            Buffer.from('12345678901234567890'), { fast: true }
        )
    })
})

test('Fast Extension: reject on choke', async t => {
    t.plan(14)

    const wire = await Protocol.create()
    wire.on('error', err => t.fail(err))
    wire.pipe(wire)

    return new Promise<void>(resolve => {
        let n = 0
        wire.once('handshake', (_infoHash, _peerId, _extensions) => {
            t.equal(wire.extensions.fast, true)
            t.equal(wire.peerExtensions.fast, true)
            t.equal(wire.hasFast, true)
            n += 3
            if (n === 14) resolve()
            wire.unchoke()
        })

        wire.once('unchoke', () => {
            t.equal(wire.requests.length, 0)
            wire.request(0, 2, 22, (err, _buffer) => {
                t.ok(err)
                n++
                if (n === 14) resolve()
            })
            t.equal(wire.requests.length, 1)
            t.equal(wire.peerRequests.length, 0)
            n += 3
            if (n === 14) resolve()
        })

        wire.on('request', (i, offset, length) => {
            t.equal(wire.peerRequests.length, 1)
            t.equal(i, 0)
            t.equal(offset, 2)
            t.equal(length, 22)

            wire.choke()
            t.equal(wire.peerRequests.length, 0)  // rejected
            n += 5
            if (n === 14) resolve()
        })

        wire.on('choke', () => {
            t.equal(wire.requests.length, 1) // not implicitly cancelled
            n++
            if (n === 14) resolve()
        })

        wire.on('reject', () => {
            t.equal(wire.requests.length, 0)
            n++
            if (n === 14) resolve()
        })

        wire.handshake(
            Buffer.from('01234567890123456789'),
            Buffer.from('12345678901234567890'), { fast: true }
        )
    })
})

test('Fast Extension: don\'t reject allowed-fast on choke', async t => {
    t.plan(11)

    const wire = await Protocol.create()
    return new Promise<void>(resolve => {
        let n = 0
        wire.on('error', err => t.fail(err))
        wire.pipe(wire)

        wire.once('handshake', () => {
            t.equal(wire.extensions.fast, true)
            t.equal(wire.peerExtensions.fast, true)
            t.equal(wire.hasFast, true)
            n += 3
            if (n === 11) resolve()
            wire.allowedFast(6)
            wire.unchoke()
        })

        wire.once('unchoke', () => {
            t.equal(wire.requests.length, 0)
            wire.request(6, 66, 666, (err) => {
                t.fail(err)
            })
            t.equal(wire.requests.length, 1)
            t.equal(wire.peerRequests.length, 0)
            n += 3
            if (n === 11) resolve()
        })

        wire.on('request', (i, offset, length) => {
            t.equal(wire.peerRequests.length, 1)
            t.equal(i, 6)
            t.equal(offset, 66)
            t.equal(length, 666)

            wire.choke()
            t.equal(wire.peerRequests.length, 1) // NOT rejected
            n += 5
            if (n === 11) resolve()
        })

        wire.handshake(Buffer.from('01234567890123456789'), Buffer.from('12345678901234567890'), { fast: true })
    })
})

test('Fast Extension: reject on error', async t => {
    t.plan(12)

    const wire = await Protocol.create()
    wire.on('error', err => t.fail(err))
    wire.pipe(wire)

    return new Promise<void>(resolve => {
        let n = 0
        wire.once('handshake', () => {
            t.equal(wire.extensions.fast, true)
            t.equal(wire.peerExtensions.fast, true)
            t.equal(wire.hasFast, true)
            n += 3
            if (n === 12) resolve()
            wire.unchoke()
        })

        wire.once('unchoke', () => {
            t.equal(wire.requests.length, 0)
            n++
            if (n === 12) resolve()
            wire.request(6, 66, 666, (err) => {
                t.ok(err)
                n++
                if (n === 12) resolve()
            })
            t.equal(wire.requests.length, 1)
            t.equal(wire.peerRequests.length, 0)
            n += 2
            if (n === 12) resolve()
        })

        wire.on('request', (i, offset, length, callback) => {
            t.equal(wire.peerRequests.length, 1)
            t.equal(i, 6)
            t.equal(offset, 66)
            t.equal(length, 666)
            n += 4
            if (n === 12) resolve()
            callback(new Error('cannot satisfy'), null)
        })

        wire.on('reject', () => {
            t.equal(wire.requests.length, 0)
            n++
            if (n === 12) resolve()
        })

        wire.handshake(Buffer.from('01234567890123456789'), Buffer.from('12345678901234567890'), { fast: true })
    })
})

test('Fast Extension disabled: have-all', async t => {
    t.plan(3)
    const wire = await Protocol.create()
    return new Promise<void>(resolve => {
        t.equal(wire.hasFast, false)
        t.throws(() => wire.haveAll())
        wire.on('have-all', () => {
            t.fail()
        })
        wire.on('close', () => {
            t.ok(true, 'got wire closed event')
            resolve()
        })

        wire._onHaveAll()
    })
})

test('Fast Extension disabled: have-none', async t => {
    t.plan(3)
    const wire = await Protocol.create()
    return new Promise<void>(resolve => {
        t.equal(wire.hasFast, false)
        t.throws(() => wire.haveNone())

        wire.on('have-none', () => {
            t.fail('got "have-none" event')
        })

        wire.on('close', () => {
            t.ok(true, 'got wire closed event')
            resolve()
        })

        wire._onHaveNone()
    })
})

test('Fast Extension disabled: suggest', async t => {
    t.plan(3)
    const wire = await Protocol.create()
    t.equal(wire.hasFast, false)
    t.throws(() => wire.suggest(42))
    return new Promise<void>(resolve => {
        wire.on('suggest', () => t.fail())
        wire.on('close', () => {
            t.ok(true, 'got "close" event')
            resolve()
        })
        wire._onSuggest(42)
    })
})

test('Fast Extension disabled: allowed-fast', async t => {
    t.plan(3)
    const wire = await Protocol.create()
    t.equal(wire.hasFast, false)
    t.throws(() => wire.allowedFast(42))

    return new Promise<void>(resolve => {
        wire.on('allowed-fast', () => t.fail())
        wire.on('close', () => {
            t.ok(true, 'got close event')
            resolve()
        })

        wire._onAllowedFast(42)
    })
})

test('Fast Extension disabled: reject', async t => {
    t.plan(3)
    const wire = await Protocol.create()
    t.equal(wire.hasFast, false)
    t.throws(() => wire.reject(42, 0, 99))
    return new Promise<void>(resolve => {
        wire.on('reject', () => t.fail())
        wire.on('close', () => {
            t.ok(true, 'got "close" event')
            resolve()
        })
        wire._onReject(42, 0, 99)
    })
})
