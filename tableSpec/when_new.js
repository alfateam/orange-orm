var c = {};
var when = require('a').when

when('./new', c).
	it('should set dbName').assertEqual(c.name,c.sut.dbName).
	it('should set columns to empty array').assertEqual(0,c.sut.columns.length).
	it('should set primaryColumns to empty array').assertEqual(0,c.sut.primaryColumns.length).
	it('should set columnDiscriminators to empty array').assertEqual(0,c.sut.columnDiscriminators.length).
	it('should set formulaDiscriminators to empty array').assertEqual(0,c.sut.formulaDiscriminators.length);
