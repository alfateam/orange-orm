var when = require('a').when;
var c = {};

when(c)
    .it('should throw with unknown column name').assertEqual('Unknown column: someColumn', c.thrownMessage)