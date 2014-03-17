var when = require('a').when;
var c = {};

when(c)
	.it('should have related column a').assertEqual(c.a,c.sut.a)
	.it('should have related column b').assertEqual(c.b,c.sut.b)
	.it('exists returns existsFilter').assertEqual(c.existsFilter,c.sut.exists())
	;
