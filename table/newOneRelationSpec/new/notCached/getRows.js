var parentRow = {};

function act(c){	
	c.result = {};
	c.expected = {};
	c.resultPromise = {};
	c.resultPromise.then = c.mock();
	c.resultPromise.then.expectAnything().whenCalled(onResult).return(c.expected);

	function onResult(cb) {
		c.returnedResult = cb(c.result);
	}

	c.foreignKeyFilter = {};
	c.newForeignKeyFilter.expect(c.joinRelation, parentRow).return(c.foreignKeyFilter);

	c.childTable.tryGetFirst = c.mock();
	c.childTable.tryGetFirst.expect(c.foreignKeyFilter).return(c.resultPromise);

	c.expanderCache.tryGet.expect(parentRow).return(null);
	c.expanderCache.tryAdd.expect(parentRow);
	c.returned = c.sut.getRows(parentRow);
}
act.base = '../../new';
module.exports = act;