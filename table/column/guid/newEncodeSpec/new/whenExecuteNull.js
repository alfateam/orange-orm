var when = require('a').when;
var c = {};

when('./executeNull',c).
	it('should negotiate guidformat').assertDoesNotThrow(c.negotiateGuidFormat.verify).
	it('shold return quoted dbNull').assertStrictEqual(c.expected,c.returned);