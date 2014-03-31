var when = require('a').when;
var c = {};

when(c)
    .it('should return resultPromise from db').assertEqual(c.expected, c.returned)
    .it('resultPromise has result').assertEqual(c.result, c.returnedResult)
    .it('should add parentRow to expanderCache').assertDoesNotThrow(c.expanderCache.add.verify);