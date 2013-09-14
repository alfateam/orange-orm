var when = require('a').when;
var c = {};

when('./add',c)
	.it('adds sql to compositeSql').assertDoesNotThrow(c.compositeSql.add.verify)
	.it('adds parameters to compositeParameters').assertDoesNotThrow(c.compositeParameters.add.verify)
	.it('returns self').assertEqual(c.sut,c.returned)
