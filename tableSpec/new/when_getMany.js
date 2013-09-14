var c = {};
var when = require('a').when;

when('./getMany', c).
	it('should return expected').assertEqual(c.expected,c.returned);	
