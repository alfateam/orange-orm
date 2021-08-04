var when = require('a').when;
var c = {};

when(c).then(function(it) {
    it('throws not found').assertEqual('Row not found.', c.thrownMsg);
})
