var when = require('a').when;
var c = {};

when(c)
	.it('should expose emptyFilter as filter').assertEqual(c.emptyFilter, c.sut.filter)
	;
