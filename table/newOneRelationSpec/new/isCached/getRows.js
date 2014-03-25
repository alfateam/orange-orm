var parentRow = {};

function act(c){	
	c.cachedResult = {};
	
	c.oneCache.tryGet.expect(parentRow).return(c.cachedResult);
	c.returned = c.sut.getRows(parentRow);
}
act.base = '../../new';
module.exports = act;