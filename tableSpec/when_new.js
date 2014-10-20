var c = {};
var when = require('a').when

when('./new', c)
	.it('should set dbName').assertEqual(c.name,c.sut._dbName)
	.it('should set columns to empty array').assertEqual(0,c.sut._columns.length)
	.it('should set primaryColumns to empty array').assertEqual(0,c.sut._primaryColumns.length)
	.it('should set columnDiscriminators to empty array').assertEqual(0,c.sut._columnDiscriminators.length)
	.it('should set formulaDiscriminators to empty array').assertEqual(0,c.sut._formulaDiscriminators.length)
	.it('should set _relations to empty object').assertDoesNotThrow(c.verifyEmptyRelations)
	.it('should set _cache').assertEqual(c.cache, c.sut._cache)
	.it('should set context equal sut').assertEqual(c.context, c.sut)
	.it('should set delete').assertEqual(c.delete, c.sut.delete)
	.it('should set cascadeDelete').assertEqual(c.cascadeDelete, c.sut.cascadeDelete)
	
