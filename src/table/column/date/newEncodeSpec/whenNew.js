var when = require('a').when;
var c = {};

when(c)
	.it('should set encodeSafe').assertEqual(c.encodeSafe, c.sut.safe)
