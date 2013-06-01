var when = require('a_test').when;
var c = {};

when('./default',c).
	it('should set default on column').assertEqual(c.default,c.column.default).
	it('should return self').assertStrictEqual(c.sut,c.returned);