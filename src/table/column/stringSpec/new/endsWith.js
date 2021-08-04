var arg = {};

function act(c){
	c.expected = {};
	c.endsWith.expect(c.column,arg,c.alias).return(c.expected);
	c.returned = c.column.endsWith(arg,c.optionalAlias);
}

module.exports = act;