var when = require('a').when;
var c = {};

when(c)
    .it('should get far relatives').assertDoesNotThrow(c.getFarRelatives.verify)
    .it('should return result from db').assertEqual(c.result, c.returned)
    .it('should add parentRow to expanderCache').assertDoesNotThrow(c.expanderCache.tryAdd.verify);