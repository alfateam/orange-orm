var c = {};
var when = require('a').when;

when('./hasMany', c).
	it('should return expected').assertEqual(c.expected,c.returned);	
