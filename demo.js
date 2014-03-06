var pg = require('pg');
var dbName = 'test';
var conStringPri = 'postgres://postgres:postgres@localhost/postgres';
var conString = 'postgres://postgres:postgres@localhost/' + dbName;

pg.connect(conStringPri, function(err, client, done) { 
    if (err)
        console.log('Error while connecting: ' + err); 
    client.query('CREATE DATABASE ' + dbName, function(err) {
        if (err) 
            console.log(err); 
        client.end(); 

        
        pg.connect(conString, function(err, client, done) {
            if (err) 
                console.log(err); 
            else
                console.log('success'); 
            client.end();
            // create the table
            /*client.query('CREATE TABLE IF NOT EXISTS ' + tableName + ' ' +
                    '(...some sql...)';*/
        });
    });
});