var a = require('a');
var requireMock = a.requireMock;
var tryGetFromDbById = requireMock('./tryGetFromDbById');

var table = {};
var id = {};
var strategy = {};

function act(c) {
    c.mock = a.mock;
    c.tryGetFromDbById = tryGetFromDbById;
    c.tryGetFromDbById.exclusive = a.mock();
    c.sut = require('../getFromDbById');
    c.get = get;
    c.getExclusive = getExclusive;
    c.table = table;
    c.id = id;
    c.strategy = strategy;

    function get() {
        return c.sut(table, id, strategy).then(onOk,onError);
	}
    function getExclusive() {
		return c.sut.exclusive(table, id, strategy).then(onOk,onError);
    }

    function onOk(returned) {
        c.returned = returned;
    }

    function onError(e) {
        c.thrownMsg = e.message;
    }

}

module.exports = act;
