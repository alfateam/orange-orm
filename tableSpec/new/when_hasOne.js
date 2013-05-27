var c = {};
var when = require('a_test').when;

when('./hasOne', c).
	it('should return expected').assertEqual(c.expected,c.returned);	
