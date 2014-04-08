var when = require('a').when;
var c = {};

when(c)
	.it('not forward to add').assertDoesNotThrow(c.sut.add.verify);