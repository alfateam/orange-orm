var when = require('a').when;
var c = {};

when('./as',c)
	.it('should set alias on column').assertEqual(c.alias,c.column.alias)
	.it('should delete table.originalName').assertEqual(false,'originalName' in c.table)
	.it('should set table.newAlias').assertEqual(c.column,c.table.newAlias)
	.it('should return self').assertDeepEqual(c.sut,c.returned)
	;