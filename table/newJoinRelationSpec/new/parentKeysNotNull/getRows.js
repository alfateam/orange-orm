function act(c){
	var parentRow = {},
		fooKey = {},
		barKey = {};

	parentRow[c.fooColumnName]	= fooKey;
	parentRow[c.barColumnName]	= barKey;
	c.relatedRows = {};
	
	c.getById.apply = c.mock();
	c.getById.apply.expect(null, [c.childTable, fooKey, barKey]).return(c.relatedRows);

	c.returned = c.sut.getRows(parentRow);
}
act.base = '../../new.js';
module.exports = act;