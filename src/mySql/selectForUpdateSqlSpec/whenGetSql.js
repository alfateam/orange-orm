var when = require('a').when;
var c = {};

when(c)
.it('should return sql').assertEqual(' FOR UPDATE', c.returned)
