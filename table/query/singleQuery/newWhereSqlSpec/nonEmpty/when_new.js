var when = require('a_test').when;
var c = {};

when('./new',c)
	.it('should return empty string').assertEqual('',c.returned);