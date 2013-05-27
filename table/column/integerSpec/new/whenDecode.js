var when = require('a_test').when;
var c = {};

when('./decode',c).
	it('should return value unchanged').assertEqual(c.value,c.returned);