var when = require('a').when;
var c = {};

when(c)
    .it('should attach rdb to domain').assertOk(c.domain.rdb)
    .it('should attach connection to rdb').assertStrictEqual(c.connection, c.domain.rdb.dbClient)
    .it('should attach release callback to rdb').assertStrictEqual(c.boundRelease, c.domain.rdb.dbClientDone)
    .it('should attach escape to rdb.encodeBuffer').assertEqual(c.boundEscape, c.domain.rdb.encodeBuffer)
    .it('should attach encodeDate to rdb.encodeDate').assertEqual(c.encodeDate, c.domain.rdb.encodeDate)
    .it('should attach deleteFromSql to rdb').assertEqual(c.deleteFromSql, c.domain.rdb.deleteFromSql)    
    .it('should invoke success callback').assertDoesNotThrow(c.onSuccess.verify)
    .it('should set wrappedQuery').assertEqual(c.wrappedQuery, c.connection.executeQuery)