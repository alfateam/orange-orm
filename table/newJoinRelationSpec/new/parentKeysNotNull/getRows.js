function act(c){
	var parentRow = {},
		fooKey = 'foo',
		barKey = 'bar';

	parentRow[c.fooColumnName]	= fooKey;
	parentRow[c.barColumnName]	= barKey;
	c.relatedRows = {};
	
	c.getByIdSync.expect(c.childTable, fooKey, barKey).return(c.relatedRows);

	c.returned = c.sut.getRows(parentRow);
}
act.base = '../../new.js';
module.exports = act;