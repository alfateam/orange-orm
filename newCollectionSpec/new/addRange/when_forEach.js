var when = require('a_test').when;
var c = {};

when('./forEach',c)
	.it('enumerates range1').assertDoesNotThrow(c.range1.forEach.verify);