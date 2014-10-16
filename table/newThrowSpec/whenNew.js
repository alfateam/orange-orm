var when = require('a').when;
var c = {};

when(c)
    .it('should return promise').assertEqual(c.expected, c.returned)
    .it('should throw received error on success').assertEqual(c.error, c.thrownError)
    .it('should throw received error on failure').assertEqual(c.throwFunc, c.throwFunc2)
    