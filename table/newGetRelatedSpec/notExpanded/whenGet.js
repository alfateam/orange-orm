var when = require('a').when;
var c = {};

when(c)
    .it('should return rows from db').assertEqual(c.expected, c.returned)
    .it('should set expanded').assertEqual(true, c.sut.expanded)
