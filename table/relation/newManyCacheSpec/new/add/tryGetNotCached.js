var parentRow = {};

function act(c){
	parentRow[c.alias] = c.cachedValue;
	parentRow[c.alias2] = 'bar';

	c.returned = c.sut.tryGet(parentRow);
}

module.exports = act;