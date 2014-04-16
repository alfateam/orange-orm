var when = require('a').when;
var c = {};

when(c)
.it('should set purify').assertEqual(c.purify, c.column.purify)
.it('sets default to zero').assertEqual(0, c.column.default)
.it('should set encode').assertEqual(c.encode, c.column.encode)
.it('should set decode').assertEqual(c.decode, c.column.decode);
