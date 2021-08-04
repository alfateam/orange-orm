var when = require('a').when;
var c = {};

when(c)
	.it('should return child table').assertEqual(c.childTable, c.returnedChild)
	.it('should return child table2').assertEqual(c.childTable2, c.returnedChild2)
	;
