var when = require('a').when;
var c = {};

when(c)
	.it('should add relation to relations').assertEqual(c.manyRelation,c.parentTable._relations.child)
	.it('should set rightAlias').assertEqual('child', c.joinRelation.rightAlias)
	