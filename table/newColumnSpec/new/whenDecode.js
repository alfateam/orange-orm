var when = require('a_test').when;
var c = {};

when('./decode',c).
	it('should return expected').assertEqual(c.expected,c.returned);