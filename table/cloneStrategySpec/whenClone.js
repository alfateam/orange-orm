var when = require('a').when;
var c = {};

when(c)
    .it('should clone simple').assertDeepEqual({}, c.sut({}))
    .it('should clone simple 2').assertDeepEqual({}, c.sut({}))
    .it('should medium complex').assertDeepEqual({ a: '1', b: 2, c: undefined}, c.sut({ a: '1', b: 2, c: undefined }))
    .it('should very complex').assertDeepEqual({
        a: '1',
        b: 2,
        c: { foo: 1 },
        d: [{ bar: { f: 'fly' } }, 2]
    }, c.sut({
        a: '1',
        b: 2,
        c: { foo: 1 },
        d: [{ bar: { f: 'fly' } }, 2]
    }))
