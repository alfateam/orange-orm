var when = require('a').when;
var c = {};

when(c)
	.it('should set rows').assertDeepEqual([], c.sut.rows)
