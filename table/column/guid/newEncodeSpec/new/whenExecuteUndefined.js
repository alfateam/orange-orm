var when = require('a').when;
var c = {};

when('./executeUndefined',c)
	.it('should negotiate guidformat').assertDoesNotThrow(c.negotiateGuidFormat.verify)
	.it('shold return quoted dbNull').assertEqual(c.expected,c.returned);