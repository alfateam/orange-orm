var pg = require('pg.js');
var begin = require('./table/begin');

function newResolveTransaction(domain, connectionString) {

    return function(onSuccess, onError) {
        var connectionError;
        domain.run(onRun);

        function onRun() {
            begin();
            pg.connect(connectionString, onConnected);
        }

        function onConnected() {
            
        }
        // function onConnected(err, client, done) {
        //     if (err) {
        //         connectionError = err;
        //         done();
        //         return;
        //     }
        //     domain.dbClient = client;
        //     domain.done = done;
        // }


        // if (connectionError)
        //     onError(connectionError);
        // else
        //     onSuccess();
    };
};

module.exports = newResolveTransaction;
