var when = require('a').when;
var c = {};

when(c).
	it('should set table').assertEqual(c.table,c.returned.table).
	it('should add consigneeLeg and orderLinesLeg').assertDoesNotThrow(c.legs.add.verify).
	it('should add product leg to orderLinesLegs').assertDoesNotThrow(c.addProductLeg.verify);
