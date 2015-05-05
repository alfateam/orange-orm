function act(c) {
    var parentRow = {},
        fooKey = null,
        barKey = 'bar';

    parentRow[c.fooAlias] = fooKey;
    parentRow[c.barAlias] = barKey;
    c.relatedRows = {};

    c.returned = c.sut.getRowsSync(parentRow);

}
act.base = '../../new.js';
module.exports = act;
