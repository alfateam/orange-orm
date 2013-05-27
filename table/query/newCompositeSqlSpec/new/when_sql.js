var when = require('a_test').when;
var c = {};

when('./sql',c)
	.it('returns empty').assertEqual('',c.returned);
