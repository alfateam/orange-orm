var parentRow = {};

function act(c){	
	c.result = 'res';

	c.foreignKeyFilter = {};
	c.newForeignKeyFilter.expect(c.joinRelation, parentRow).return(c.foreignKeyFilter);

	c.farPromise = c.then();
	c.farResult = {};
	c.farPromise(c.farResult);
	c.getFarRelatives.expect(parentRow, c.joinRelation).return(c.farPromise);

	c.resultPromise = c.then();
	c.resultPromise(c.result);
	c.childTable.tryGetFirst = c.mock();
	c.childTable.tryGetFirst.expect(c.foreignKeyFilter).return(c.resultPromise);

	c.expanderCache.tryGet.expect(parentRow).return(null);
	c.expanderCache.tryAdd.expect(parentRow);
	c.sut.getRows(parentRow).then(onRows);

	function onRows(result) {
		c.returned = result;	
	}
}
act.base = '../../new';
module.exports = act;