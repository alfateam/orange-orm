var when = require('a').when;
var c = {};

when(c)
	.it('should set table').assertEqual(c.table,c.returned.table)	
	.it('should add consigneeLeg and orderLinesLeg').assertDoesNotThrow(c.legs.add.verify)
	.it('should add product leg to orderLinesLegs').assertDoesNotThrow(c.addProductLeg.verify)
	.it('should set limit').assertEqual(c.strategy.limit, c.returned.limit)
	.it('should set orderBy').assertEqual(c.strategy.orderBy, c.returned.orderBy)
	.it('should set limit on lines').assertEqual(c.strategy.orderLines.limit, c.orderLinesSpan.limit)
	.it('should set orderBy on lines').assertEqual(c.strategy.orderLines.orderBy, c.orderLinesSpan.orderBy)
	
