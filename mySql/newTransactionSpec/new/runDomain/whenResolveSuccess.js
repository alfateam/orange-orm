var when = require('a').when;
var c = {};

when(c)
    .it('should attach connection to domain').assertStrictEqual(c.connection, c.domain.dbClient)
    .it('should attach release callback to domain').assertStrictEqual(c.release, c.domain.dbClientDone)
    .it('should attach rdb to domain').assertOk(c.domain.rdb)
    .it('should attach escape to domain.rdb.encodeBuffer').assertEqual(c.boundEscape, c.domain.rdb.encodeBuffer)
    .it('should attach deleteFromSql').assertEqual(c.deleteFromSql, c.domain.rdb.deleteFromSql)    
    .it('should invoke success callback').assertDoesNotThrow(c.onSuccess.verify)
    .it('should set wrappedQuery').assertEqual(c.wrappedQuery, c.connection.executeQuery)
    
