var arg = {};

function act(c){
	c.expected = {};
	c.startsWith.expect(c.column,arg,c.alias).return(c.expected);
	c.returned = c.column.startsWith(arg,c.optionalAlias);
}

module.exports = act;