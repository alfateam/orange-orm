var when = require('a').when;
var c = {};

when(c)
	.it('should return new object').assertEqual('object', typeof c.returned)
	;
