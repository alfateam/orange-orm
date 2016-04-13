var when = require('a').when;
var c = {};

when('./execute',c).
	it('shold return value deserialized').assertDeepEqual(c.expected,c.returned);