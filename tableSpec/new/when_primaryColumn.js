var c = {};
var when = require('a_test').when;

when('./primaryColumn', c).
	it('should return expected').assertEqual(c.expected,c.returned);	
