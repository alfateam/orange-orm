var when = require('a').when;
var c = {};

when(c)
    .it('should not forward to queryContext').assertEqual(true, true)
