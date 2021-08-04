var mock = require('a').mock;
var requireMock = require('a').requireMock;
var joinLegToColumnSql = requireMock('./joinLegToColumnSql');

var alias = '_0';
var span = {};
var expected = ',_0_0.a,_0_0.b,_0_1.c,_0_1.d';
var joinLeg = {};
var oneLeg = {};
var manyLeg ={};
var joinLegSql = ',_0_0.a,_0_0.b';
var oneLegSql = ',_0_1.c,_0_1.d';

function act(c) {
	stubJoinLegToColumnSql();
	stubSpan();
	c.returned = require('../newJoinedColumnSql')(span,alias);
	c.expected = expected;

	function stubJoinLegToColumnSql() {
		joinLegToColumnSql.expect(joinLeg,'_0_0').return(joinLegSql);
		joinLegToColumnSql.expect(oneLeg,'_0_1').return(oneLegSql);
	}

	function stubSpan() {
		var manyLeg = {};
		stubJoinLeg();
		stubOneLeg();
		stubManyLeg();

		function stubJoinLeg() {
			var accept = mock();
			joinLeg.accept = accept;
			accept.expectAnything().whenCalled(onAccept).return();

			function onAccept(visitor) {
				visitor.visitJoin(joinLeg);
			}
		}

		function stubOneLeg() {
			var accept = mock();
			oneLeg.accept = accept;
			accept.expectAnything().whenCalled(onAccept).return();

			function onAccept(visitor) {
				visitor.visitOne(oneLeg);
			}
		}


		function stubManyLeg() {
			var accept = mock();
			manyLeg.accept = accept;
			accept.expectAnything().whenCalled(onAccept).return();

			function onAccept(visitor) {
				visitor.visitMany(manyLeg);
			}
		}

		var forEach = mock();
		var legs = {};
		forEach.expectAnything().whenCalled(onForEach).return();
		legs.forEach = forEach;
		span.legs = legs;

		function onForEach(callBack) {
			callBack(joinLeg);
			callBack(oneLeg);
			callBack(manyLeg);
		}
	}	

}

module.exports = act;