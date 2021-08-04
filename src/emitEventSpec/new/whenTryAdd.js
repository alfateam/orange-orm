var when = require('a').when;
var c = {};

when(c)
	.it('forward to add').assertDoesNotThrow(c.sut.add.verify);