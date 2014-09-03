var arg = {},
	alias = {};

function act(c){
	c.expected = {};
	c.iEndsWith.expect(c.column,arg,alias).return(c.expected);
	c.returned = c.column.iEndsWith(arg,alias);
}

module.exports = act;