var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.extractParentKey = requireMock('./extractParentKey');
	c.mock = mock;	
	c.manyCache = {};
	c.joinRelation = {};
	c.parent = {};
	c.initialChild	 = {};
	
	
	c.alias1 = "alias1";
	c.alias2 = "alias2";
	c.column1 = {};
	c.column2 = {};
	c.column1.alias = c.alias1;
	c.column2.alias = c.alias2;
	
	c.initialChild.subscribeChanged = c.mock();
	c.initialChild.subscribeChanged.expectAnything().expect(c.alias1).whenCalled(onSubscribe1);
	c.initialChild.subscribeChanged.expectAnything().expect(c.alias2).whenCalled(onSubscribe2);
	
	c.raiseChanged1 = function() {};
	function onSubscribe1(cb, ignore) {
		c.raiseChanged1 = cb;
	}

	c.raiseChanged2 = function() {};
	function onSubscribe2(cb, ignore) {
		c.raiseChanged2 = cb;
	}

	c.joinRelation.columns = [c.column1, c.column2];

	c.sut = require('../synchronizeChanged')(c.manyCache, c.joinRelation, c.parent, c.initialChild);
}

module.exports = act;