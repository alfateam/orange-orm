var c = {};
var when = require('a').when;

when('./hasOne', c).
	it('should return expected').assertEqual(c.expected,c.returned);	
