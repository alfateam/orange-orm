var when = require('a').when;
var c = {};

when(c)
    .it('should set domain.rdb').assertOk(c.domain.rdb)
    .it('should set rdb.dbClient').assertStrictEqual(c.client, c.domain.rdb.dbClient)
    .it('should set done to rdb.dbClientDone').assertStrictEqual(c.done, c.domain.rdb.dbClientDone)
    .it('should set rdb.encodeBuffer').assertEqual(c.encodeBuffer, c.domain.rdb.encodeBuffer)
    .it('should set rdb.encodeDate').assertEqual(c.encodeDate, c.domain.rdb.encodeDate)
    .it('should set rdb.deleteFromSql').assertEqual(c.deleteFromSql, c.domain.rdb.deleteFromSql)
    .it('should set rdb.selectForUpdateSql').assertEqual(c.selectForUpdateSql, c.domain.rdb.selectForUpdateSql)
    .it('should invoke success callback').assertDoesNotThrow(c.onSuccess.verify)
    .it('should set executeQuery').assertEqual(c.wrappedQuery, c.client.executeQuery)
    .it('should set streamQuery').assertEqual(c.wrappedQueryStream, c.client.streamQuery)