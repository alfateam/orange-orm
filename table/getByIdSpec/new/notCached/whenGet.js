var when  = require('a').when;
var c = {};

when('./get',c).
	it('should return expected').assertEqual(c.expected,c.returned);