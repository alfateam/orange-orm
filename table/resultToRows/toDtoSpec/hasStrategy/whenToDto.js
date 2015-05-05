var when = require('a').when;
var c = {};

when(c)
    .it('should return dto').assertEqual(c.dto, c.returned)
    .it('should map foo').assertEqual(c.fooDto, c.dto.foo)
    .it('should map bar').assertEqual(c.barDto, c.dto.bar)