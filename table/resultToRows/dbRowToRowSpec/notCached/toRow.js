var a = require('a');
function act(c){
	c.cache.tryAdd.expect(c.row).return(true);
	c.returned = c.sut(c.span, c.dbRow);
}

module.exports = act;