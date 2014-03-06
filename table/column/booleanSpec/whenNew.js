var when = require('a').when;
var c = {};

when(c)
.it('should set encode').assertEqual(c.encode, c.column.encode)
.it('should set decode').assertEqual(c.decode, c.column.decode);
