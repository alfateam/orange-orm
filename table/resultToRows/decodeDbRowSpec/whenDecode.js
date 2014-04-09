var when = require('a').when;
var c = {};

when(c)
.it('should have value1').assertEqual(c.value1, c.returned.alias1)
.it('should have value2').assertEqual(c.value2, c.returned.alias2)
.it('should not have dbPropertyName1 on dbRow').assertEqual(false, 'dbValue1' in c.dbRow)
.it('should not have dbPropertyName2 on dbRow').assertEqual(false, 'dbValue2' in c.dbRow)
.it('should still have dbPropertyName3 on dbRow').assertEqual(c.dbValue3, c.dbRow.dbValue3)
;