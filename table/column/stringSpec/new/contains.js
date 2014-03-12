var arg = {},
	alias = {};

function act(c){
	c.expected = {};
	c.contains.expect(c.column,arg,alias).return(c.expected);
	c.returned = c.column.contains(arg,alias);
}

module.exports = act;