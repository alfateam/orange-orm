function act(c){
	var parentRow = {},
		fooKey = 'foo',
		barKey = 'bar';

	parentRow[c.fooAlias]	= fooKey;
	parentRow[c.barAlias]	= barKey;
	c.relatedRows = {};
	
	c.getById.expect(c.childTable, fooKey, barKey).return(c.relatedRows);

	c.returned = c.sut.getFromDb(parentRow);
}
act.base = '../../new.js';
module.exports = act;