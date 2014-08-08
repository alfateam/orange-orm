var arg = {},
	alias = {};

function act(c){
	c.expected = {};
	c.iContains.expect(c.column,arg,alias).return(c.expected);
	c.returned = c.column.iContains(arg,alias);
}

module.exports = act;