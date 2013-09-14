var c = {};
var when = require('a').when;

when('./join',c).
	it('should return expected').assertEqual(c.expected,c.returned);