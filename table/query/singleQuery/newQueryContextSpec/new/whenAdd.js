var when = require('a').when;
var c = {};

when(c)
	.it('should add row').assertDeepEqual([c.row, c.row2] ,c.sut.rows)
