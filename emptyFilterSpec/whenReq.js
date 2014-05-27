var when = require('a').when;
var c = {};

when(c)
	.it('parameters points at parameterized.parameters').assertEqual( c.parameters, c.sut.parameters)
	.it('sql points at parameterized.sql').assertEqual( c.sql, c.sut.sql)
	.it('and returns input').assertEqual( c.input, c.sut.and(c.input))
	.it('or returns input').assertEqual( c.input, c.sut.or(c.input))
	.it('not returns self').assertEqual( c.sut, c.sut.not())
;