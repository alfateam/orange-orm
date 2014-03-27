var when = require('a').when;
var c = {};

when(c)
	.it('should remove manyCache from domain').assertEqual(null, c.domain[c.key])
	;
