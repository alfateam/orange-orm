var requireMock = require('a_mock').requireMock;
var mock = require('a_mock').mock;

var newCompositeSql = requireMock('./newCompositeSql');
var newCompositeParameters = requireMock('./newCompositeParameters');
var compositeSql = {};
var compositeParameters = {};

function act(c) {
	c.compositeSql = compositeSql;
	c.compositeParameters = compositeParameters;

	newCompositeSql.expect().return(compositeSql);
	newCompositeParameters.expect().return(compositeParameters);

	c.sut = require('../newCompositeQuery')();
}

module.exports = act;