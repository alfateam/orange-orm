var a = require('a');
function act(c){
	c.cache.tryAdd.expect(c.initialRow).return(c.row);
	c.returned = c.sut(c.span, c.dbRow, c.queryContext);
}

module.exports = act;