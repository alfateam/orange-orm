var arg = {},
	alias = {};

function act(c){
	c.expected = {};
	c.startsWith.expect(c.column,arg,alias).return(c.expected);
	c.returned = c.column.startsWith(arg,alias);
}

module.exports = act;