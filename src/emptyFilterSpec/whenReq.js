var when = require('a').when;
var c = {};

when(c)
	.it('parameters points at parameterized.parameters').assertEqual( c.parameters, c.sut.parameters)
	.it('sql points at parameterized.sql').assertEqual( c.sql, c.sut.sql)
	.it('not returns self').assertEqual( c.sut, c.sut.not())