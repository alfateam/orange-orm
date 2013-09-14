var c = {};
var when = require('a').when;

when('./getById', c).
	it('should return expected').assertEqual(c.expected,c.returned);	
