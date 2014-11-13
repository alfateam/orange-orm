var when = require('a').when;
var c = {};

when(c)
    .it('should expose emptyFilter as filter').assertEqual(c.emptyFilter, c.sut.filter)
    .it('should expose table').assertEqual(c.table, c.sut.table)
    .it('should expose command').assertEqual(c.command, c.sut.command)
    .it('should expose rollback').assertEqual(c.rollback, c.sut.rollback)
    .it('should set mySql').assertEqual(c.newMySqlDatabase, c.sut.mySql)
    .it('should set pg').assertEqual(c.newDatabase, c.sut.pg)