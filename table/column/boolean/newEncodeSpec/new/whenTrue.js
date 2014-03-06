var when = require('a').when;
var c = {};

when('./true',c).
	it('shold return expected').assertEqual(c.expected,c.returned);