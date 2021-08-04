var when = require('a').when;
var c = {};

when(c)
.it('should return sql').assertEqual(' FOR UPDATE OF alias', c.returned)
