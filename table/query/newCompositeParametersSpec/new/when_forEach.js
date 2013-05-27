var when = require('a_test').when;
var c = {};

when('./forEach',c)
	.it('forwards to collection.forEach').assertDoesNotThrow(c.collection.forEach.verify);
