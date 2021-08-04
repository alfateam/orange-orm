var when = require('a').when;
var c = {};

when(c)
	.it('should return changeSet').assertEqual(c.changeSet, c.returned)
	;
