var c = {};
var when = require('a').when;

when('./primaryColumn', c).
	it('should return expected').assertEqual(c.expected,c.returned);	
