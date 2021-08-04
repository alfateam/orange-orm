var when = require('a').when;
var c = {};

when(c)
	.it('should add column to table._columns').assertEqual(c.sut,c.columns[0])
	.it('should not add any other columns').assertEqual(1,c.columns.length)
	.it('should set dbName to name').assertEqual(c.name,c.sut._dbName)
	.it('should set alias to name').assertEqual(c.name,c.sut.alias)
	.it('should set dbNull to null').assertStrictEqual(null, c.sut.dbNull)	
	.it('eq is alias for equal').assertDeepEqual(c.sut.equal,c.sut.eq)
	.it('EQ is alias for equal').assertEqual(c.sut.equal,c.sut.EQ)
	.it('ne is alias for notEqual').assertEqual(c.sut.notEqual,c.sut.ne)
	.it('NE is alias for notEqual').assertEqual(c.sut.notEqual,c.sut.NE)
	.it('gt is alias for greaterThan').assertEqual(c.sut.greaterThan,c.sut.gt)
	.it('GT is alias for greaterThan').assertEqual(c.sut.greaterThan,c.sut.GT)
	.it('ge is alias for greaterThanOrEqual').assertEqual(c.sut.greaterThanOrEqual,c.sut.ge)
	.it('GE is alias for greaterThanOrEqual').assertEqual(c.sut.greaterThanOrEqual,c.sut.GE)
	.it('lt is alias for lessThan').assertEqual(c.sut.lessThan,c.sut.lt)
	.it('LT is alias for lessThan').assertEqual(c.sut.lessThan,c.sut.LT)
	.it('le is alias for lessThanOrEqual').assertEqual(c.sut.lessThanOrEqual,c.sut.le)
	.it('LE is alias for lessThanOrEqual').assertEqual(c.sut.lessThanOrEqual,c.sut.LE)
	.it('should set table.<columnName> to column').assertEqual(c.table.columnName,c.sut);
