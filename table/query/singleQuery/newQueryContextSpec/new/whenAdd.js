var when = require('a').when;
var c = {};

when(c)
	.it('should add row').assertDeepEqual([c.row] ,c.sut.rows)
