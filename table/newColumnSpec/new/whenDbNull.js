var when = require('a_test').when;
var c = {};

when('./dbNull',c).
	it('should set nullValue on sut').assertEqual(c.nullValue,c.sut.nullValue).
	it('should return self').assertStrictEqual(c.sut,c.returned);