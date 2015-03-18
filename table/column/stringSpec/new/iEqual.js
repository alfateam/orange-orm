var arg = {},
	alias = {};

function act(c){
	c.expected = {};
	c.iEqual.expect(c.column,arg,alias).return(c.expected);
	c.returned = c.column.iEqual(arg,alias);
}

module.exports = act;