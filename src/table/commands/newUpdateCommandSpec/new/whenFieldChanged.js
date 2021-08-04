var when = require('a').when;
var c = {};

when(c)
	.it('should add column to columnList').assertEqual(c.otherColumn, c.columnList[c.otherAlias])
	;