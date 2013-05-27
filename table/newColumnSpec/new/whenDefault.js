var when = require('a_test').when;
var c = {};

when('./default',c).
	it('should set defaultValue on sut').assertEqual(c.defaultValue,c.sut.defaultValue).
	it('should return self').assertStrictEqual(c.sut,c.returned);