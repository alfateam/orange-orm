var when = require('a').when;
var c = {};

when(c)
    .it('should set domain.rdb').assertOk(c.domain.rdb)
    .it('should set rdb.dbClient').assertStrictEqual(c.client, c.domain.rdb.dbClient)
    .it('should set done to rdb.dbClientDone').assertStrictEqual(c.done, c.domain.rdb.dbClientDone)
    .it('should set rdb.encodeBuffer').assertEqual(c.encodeBuffer, c.domain.rdb.encodeBuffer)
    .it('should set rdb.deleteFromSql').assertEqual(c.deleteFromSql, c.domain.rdb.deleteFromSql)
    .it('should invoke success callback').assertDoesNotThrow(c.onSuccess.verify)
    .it('should set wrappedQuery').assertEqual(c.wrappedQuery, c.client.executeQuery)