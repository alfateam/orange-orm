var when  = require('a_test').when;
var c = {};

when('./get',c).
	it('should return expected').assertEqual(c.expected,c.returned);