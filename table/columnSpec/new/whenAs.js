var when = require('a').when;
var c = {};

when('./as',c).
	it('should set alias on column').assertEqual(c.alias,c.column.alias).
	it('should return self').assertDeepEqual(c.sut,c.returned);