var when = require('a').when;
var c = {};

when(c)
.it('should return sql with numbered dollars').assertEqual(c.sql, c.returned)
