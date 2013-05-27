var when = require('a_test').when;
var c = {};

when('./encode_float',c).
	it('should return expected').assertEqual(c.expected,c.returned);