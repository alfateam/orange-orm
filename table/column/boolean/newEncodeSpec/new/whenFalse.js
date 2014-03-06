var when = require('a').when;
var c = {};

when('./false',c).
	it('shold return expected').assertEqual(c.expected,c.returned);