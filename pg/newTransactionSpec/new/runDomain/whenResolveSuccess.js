var when = require('a').when;
var c = {};

when(c)
    .it('should attach db client to domain').assertStrictEqual(c.client, c.domain.dbClient)
    .it('should attach done callback to domain').assertStrictEqual(c.done, c.domain.dbClientDone)
    .it('should attach rdb to domain').assertOk(c.domain.rdb)
    .it('should invoke success callback').assertDoesNotThrow(c.onSuccess.verify)
