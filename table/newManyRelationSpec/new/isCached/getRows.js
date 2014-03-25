var parentRow = {};

function act(c){	
	c.cachedResult = {};
	
	c.manyCache.tryGet.expect(parentRow).return(c.cachedResult);
	c.returned = c.sut.getRows(parentRow);
}
act.base = '../../new';
module.exports = act;