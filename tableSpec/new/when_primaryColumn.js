var c = {};
var when = require('a').when;

when('./primaryColumn', c).
	it('should add primaryColumn to table._primaryColumns').assertEqual(c.columnDef,c.sut._primaryColumns[0]).
	it('should return expected').assertEqual(c.expected,c.returned);	
