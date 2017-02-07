var when = require('a').when;
var c = {};

when(c)
    .it('should attach rdb to domain').assertOk(c.domain.rdb)
    .it('should attach connection to rdb').assertStrictEqual(c.connection, c.domain.rdb.dbClient)
    .it('should attach release callback to rdb').assertStrictEqual(c.boundRelease, c.domain.rdb.dbClientDone)
    .it('should attach escape to rdb.encodeBoolean').assertEqual(c.boundEscape, c.domain.rdb.encodeBoolean)
    .it('should attach encodeDate to rdb.encodeDate').assertEqual(c.encodeDate, c.domain.rdb.encodeDate)
    .it('should attach deleteFromSql to rdb').assertEqual(c.deleteFromSql, c.domain.rdb.deleteFromSql)    
    .it('should attach selectForUpdateSql to rdb').assertEqual(c.selectForUpdateSql, c.domain.rdb.selectForUpdateSql)    
    .it('should attach multipleStatements true').assertEqual(true, c.domain.rdb.multipleStatements)
    .it('should invoke success callback').assertDoesNotThrow(c.onSuccess.verify)
    .it('should set wrappedQuery').assertEqual(c.wrappedQuery, c.connection.executeQuery)