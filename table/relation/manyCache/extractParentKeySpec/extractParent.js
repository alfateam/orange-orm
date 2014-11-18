var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var joinRelation = {},
    child = {};

function act(c) {
    c.mock = mock;
    c.joinColumn1 = {};
    c.joinColumn2 = {};
    c.joinAlias1 = "joinColumn1";
    c.joinAlias2 = "joinColumn2";
    c.joinColumn1.alias = c.joinAlias1;
    c.joinColumn2.alias = c.joinAlias2;
    c.childTable = {};

    c.childValue1 = {};
    c.childValue2 = {};
    child[c.joinAlias1] = c.childValue1;
    child[c.joinAlias2] = c.childValue2;
    child.foo = {};

    c.primaryColumn1 = {};
    c.primaryColumn2 = {};
    c.primaryColumn1.alias = "pk1";
    c.primaryColumn2.alias = "pk2";

    c.childTable._primaryColumns = [c.primaryColumn1, c.primaryColumn2];
    joinRelation.childTable = c.childTable;
    c.expected = {
        "pk1": c.childValue1,
        "pk2": c.childValue2
    };

    joinRelation.columns = [c.joinColumn1, c.joinColumn2];

    c.returned = require('../extractParentKey')(joinRelation, child);
}

module.exports = act;