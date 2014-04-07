var a = require('a');
function act(c){
	c.cachedRow = {};
	c.cache.tryAdd.expect(c.row).return(false);
	c.cache.tryGet = c.mock();
	c.cache.tryGet.expect(c.row).return(c.cachedRow);
	c.returned = c.sut(c.span, c.dbRow);
}

module.exports = act;