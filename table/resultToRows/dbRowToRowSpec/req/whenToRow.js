var when = require('a').when;
var c = {};

when(c)
.it('should create next row').assertDoesNotThrow(c.nextDbRowToRow.verify)
.it('should negotiate add to queryContext').assertDoesNotThrow(c.negotiateQueryContext.verify)
.it('should set queryContext on initial row').assertEqual(c.queryContext, c.initialRow.queryContext)
.it('should try add row to cache').assertDoesNotThrow(c.cache.tryAdd.verify)
.it('should expand oneLeg').assertDoesNotThrow(c.oneLeg.expand.verify)
.it('should expand manyLeg').assertDoesNotThrow(c.manyLeg.expand.verify)
.it('should expand joinLeg').assertDoesNotThrow(c.joinLeg.expand.verify)
.it('should return row').assertEqual(c.row, c.returned)
;
