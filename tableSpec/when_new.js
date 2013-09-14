var c = {};
var when = require('a').when

when('./new', c).
	it('should set name').assertEqual(c.name,c.sut.name).
	it('should set columns to empty array').assertEqual(0,c.sut.columns).
	it('should set primaryColumns to empty array').assertEqual(0,c.sut.primaryColumns);
