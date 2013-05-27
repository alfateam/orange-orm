var c = {};
var when = require('a_test').when;

when('./getById', c).
	it('should return expected').assertEqual(c.expected,c.returned);	
