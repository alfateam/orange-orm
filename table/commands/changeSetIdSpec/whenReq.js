var when = require('a').when;
var c = {};

when(c)
	.it('should return id').assertEqual(c.id, c.returned)
	.it('should return same id second time').assertEqual(c.id, c.returned2)
	;
