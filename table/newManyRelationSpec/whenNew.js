var when = require('a').when;
var c = {};

when(c)
    .it('should have joinRelation').assertEqual(c.joinRelation, c.sut.joinRelation)
    .it('should set childTable').assertEqual(c.childTable, c.sut.childTable)
    .it('should set expand to expanderCache.tryAdd').assertStrictEqual(c.expanderCache.tryAdd, c.sut.expand)
    .it('should set getRowsSync to manyCache.tryGet').assertEqual(c.manyCache.tryGet, c.sut.getRowsSync)
    .it('should set isExpanded to expanderCache.tryGet').assertEqual(c.expanderCache.tryGet, c.sut.isExpanded)
    
    