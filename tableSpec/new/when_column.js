var c = {};
var when = require('a_test').when;

when('./column', c).
	it('should return expected').assertEqual(c.expected,c.returned);	
