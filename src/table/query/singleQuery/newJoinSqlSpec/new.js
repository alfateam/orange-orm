var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

var joinLegToJoinSql = requireMock('./joinSql/joinLegToJoinSql');
var oneLegToJoinSql = requireMock('./joinSql/oneLegToJoinSql');

var joinSql = '<joinSql>';
var oneSql = '<oneSql>';
var expected = joinSql + oneSql;
var span = {};
var legs = {};
var joinLeg = {};
var oneLeg = {};
var manyLeg = {};
var alias = '_0';
var joinAlias = '_0_0';
var oneAlias = '_0_1';

span.legs = legs;

function act(c) {
	stubLegs();
	joinLegToJoinSql.expect(joinLeg,alias,joinAlias).return(joinSql);
	oneLegToJoinSql.expect(oneLeg,alias,oneAlias).return(oneSql);

	c.returned = require('../newJoinSql')(span,alias);
	c.expected = expected;

	function stubLegs() {

		var forEachLeg = mock();
		legs.forEach = forEachLeg;
		forEachLeg.expectAnything().whenCalled(onForEach).return();
	
		function onForEach(callback) {
			callback(joinLeg);
			callback(oneLeg);
			callback(manyLeg);
		}

		joinLeg.accept = mock();
		joinLeg.accept.expectAnything().whenCalled(onAcceptJoinLeg).return();

		oneLeg.accept = mock();
		oneLeg.accept.expectAnything().whenCalled(onAcceptOneLeg).return();

		manyLeg.accept = mock();
		manyLeg.accept.expectAnything().whenCalled(onAcceptManyLeg).return();			
	}
	
	function onAcceptJoinLeg(visitor) {
		visitor.visitJoin(joinLeg);
	}

	function onAcceptOneLeg(visitor) {
		visitor.visitOne(oneLeg);	
	}

	function onAcceptManyLeg(visitor) {
		visitor.visitMany(manyLeg);
	}
}

module.exports = act;
