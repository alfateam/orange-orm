var when = require('a').when;
var c = {};

when(c)
.it('should return same as input').assertEqual(c.sqlFunction, c.returned)