var c = {};
var when = require('a').when;

when('./column', c).
	it('should return expected').assertEqual(c.expected,c.returned);	
