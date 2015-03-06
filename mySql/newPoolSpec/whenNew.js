var when = require('a').when;
var c = {};

when(c)
    .it('should negotiate pool options').assertDoesNotThrow(c.negotiatePoolOptions.verify)
    .it('should set end').assertEqual(c.denodeifiedEndPool, c.sut.end)
    .it('should set connect').assertEqual(c.boundGetConnection, c.sut.connect)
    .it('should add pool to pools').assertDeepEqual(c.pools[c.id], c.sut)
