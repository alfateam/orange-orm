var getChangeSet = require('./getChangeSet');
var flush = require('./flush');

module.exports = function negotiateFlush() {
    var changeSet = getChangeSet();
    if (changeSet.length < changeSet.batchSize)
        return;
    if (changeSet.queryCount > changeSet.prevQueryCount)
        changeSet.batchSize = changeSet.batchSize * 2;
    else if (changeSet.queryCount < changeSet.prevQueryCount)
        changeSet.batchSize = changeSet.batchSize / 2;
    changeSet.prevQueryCount = changeSet.queryCount;
    flush();
}
