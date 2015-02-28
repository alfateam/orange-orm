function endPool(connectionString, pgPool, pg, done) {
    pgPool.drain(onDrained);

    function onDrained() {
        pgPool.destroyAllNow();
        var key = JSON.stringify(connectionString);
        delete pg.pools.all[key];
        done();
    }
}

module.exports = endPool;
