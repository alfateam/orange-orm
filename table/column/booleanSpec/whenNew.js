var when = require('a').when;
var c = {};

when(c)
.it('sets default to false').assertStrictEqual(false, c.column.default)
.it('should set encode').assertEqual(c.encode, c.column.encode)
.it('should set decode').assertEqual(c.decode, c.column.decode);
