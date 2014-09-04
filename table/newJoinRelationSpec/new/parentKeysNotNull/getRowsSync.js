function act(c){
	var parentRow = {},
		fooKey = 'foo',
		barKey = 'bar';

	parentRow[c.fooAlias]	= fooKey;
	parentRow[c.barAlias]	= barKey;
	c.relatedRows = {};
	
	c.tryGetFromCacheById.expect(c.childTable, fooKey, barKey).return(c.relatedRows);

	c.returned = c.sut.getRowsSync(parentRow);
}
act.base = '../../new.js';
module.exports = act;