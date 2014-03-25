function act(c){
	c.expected = {};
	c.column1 = {};
	c.alias1 = 'joined1';
	c.column1.alias = c.alias1;
	c.joined1Value = 'value1';
	
	c.column2 = {};
	c.alias2 = 'joined2';
	c.column2.alias = c.alias2;
	c.joined2Value = 'value2';


	c.childTable = {};
	c.childTable._cache = c.cache;
	c.relation = {};
	c.relation.columns = [c.column1, c.column2];
	c.relation.childTable = c.childTable;

	c.parentRow = {};
	c.parentRow[c.alias1] = c.joined1Value;
	c.parentRow[c.alias2] = c.joined2Value;

	c.tryGetByIdSync.expect(c.childTable, c.joined1Value, c.joined2Value).return(c.expected);

	c.returned = c.sut(c.relation, c.parentRow);
}

module.exports = act;