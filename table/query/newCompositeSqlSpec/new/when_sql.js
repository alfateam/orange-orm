var when = require('a').when;
var c = {};

when('./sql',c)
	.it('returns empty').assertEqual('',c.returned);
