var arg = {},
	alias = {};

function act(c){
	c.expected = {};
	c.endsWith.expect(c.column,arg,alias).return(c.expected);
	c.returned = c.column.endsWith(arg,alias);
}

module.exports = act;