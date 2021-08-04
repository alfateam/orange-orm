var arg = {};

function act(c){
	c.expected = {};
	c.iContains.expect(c.column,arg,c.alias).return(c.expected);
	c.returned = c.column.iContains(arg,c.optionalAlias);
}

module.exports = act;