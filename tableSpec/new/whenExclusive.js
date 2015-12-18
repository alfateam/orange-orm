var when = require('a').when;
var c = {};

when(c)    
    .it('should return another table instance').assertStrictEqual(c.expected, c.returned)
    .it('should set _exclusive').assertEqual(true, c.expected._exclusive)
    .it('should set _dbName').assertEqual(c.sut._dbName, c.expected._dbName)
    .it('should set primaryColumns').assertEqual(c.sut.primaryColumns, c.expected.primaryColumns)
    .it('should set columns').assertEqual(c.sut.columns, c.expected.columns)
    .it('should set _columnDiscriminators').assertEqual(c.sut._columnDiscriminators, c.expected._columnDiscriminators)
    .it('should set _formulaDiscriminators').assertEqual(c.sut._formulaDiscriminators, c.expected._formulaDiscriminators)
    .it('should set _relations').assertEqual(c.sut._relations, c.expected._relations)
    .it('should set _cache').assertEqual(c.sut._cache, c.expected._cache)