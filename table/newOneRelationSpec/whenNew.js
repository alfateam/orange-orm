var when = require('a').when;
var c = {};

when(c)
.it('should have joinRelation').assertEqual(c.joinRelation, c.sut.joinRelation);
