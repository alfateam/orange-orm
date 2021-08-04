var when = require('a').when;
var c = {};

when(c)
.it('should return sql wrapped in function').assertEqual(c.sql, c.returned())