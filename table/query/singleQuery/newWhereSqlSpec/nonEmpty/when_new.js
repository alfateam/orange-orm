var when = require('a').when;
var c = {};

when('./new',c)
	.it('should return empty string').assertEqual('',c.returned);