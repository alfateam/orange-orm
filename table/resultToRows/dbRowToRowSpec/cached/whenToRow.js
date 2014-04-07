var when = require('a').when;
var c = {};

when(c)
.it('should create next row').assertDoesNotThrow(c.nextDbRowToRow.verify)
.it('should try add row to cache').assertDoesNotThrow(c.cache.tryAdd.verify)
.it('should expand oneLeg').assertDoesNotThrow(c.oneLeg.expand.verify)
.it('should expand manyLeg').assertDoesNotThrow(c.manyLeg.expand.verify)
.it('should return cached row').assertEqual(c.cachedRow, c.returned)
;
