var when = require('a_test').when;
var c = {};

when('./encode_not_number',c).
	it('should throw with msg').assertEqual(c.expected,c.thrownMsg);