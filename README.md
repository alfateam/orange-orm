__rdb__
=========
ORM for postgres and mySql.  

Simple, flexible mapper.  
Transaction with commit and rollback.  
Persistence ignorance - no need for explicit saving, everything is handled by transaction.  
Eager or lazy loading.  
Based on promises.  
[Documentation and examples](docs/docs.md)  
## Release notes
__0.4.8__  
Explicit pooling with size and end().  
Bugfix: mySql did not release client to pool.  
__0.4.7__  
Upgraded to pg 4.3.0  
Upgraded to mysql 2.5.5  
__0.4.6__  
Upgraded pg 4.2.0.  
__0.4.5__  
Oops. Forgot to use pg.js instead of pg.  
__0.4.4__  
Upgraded all dependencies to latest. Using pg.js instead of pg.  
__0.4.3__  
[Can ignore columns when serializing to dto](https://github.com/alfateam/rdb-demo/blob/master/serializable.js).  
__0.4.2__  
Bugfix: [update on a row crashes when a delete occurs earlier in same transaction](https://github.com/alfateam/rdb/issues/12).  
__0.4.1__  
Bugfix: more global leaks.  
__0.4.0__  
Bugfix: global leak.  
__0.3.9__  
Bugfix: eager loading joins/hasOne with non unique column names was not handled correctly.  
__0.3.8__  
Supports mySql.  
Bulk deletes.  
__0.3.7__  
Bugfix: eager loading manyRelation on a join/hasOne returned empty array #11  
__0.3.6__  
Fixed sql injection vulnerability.  
__0.3.5__  
Built-in fetching strategies for lazy loading. Works best in readonly scenarios.  
__0.3.4__  
Docs and examples split moved to separate file.  
__0.3.3__  
Fixed documentation layout again.  
__0.3.2__  
Fixed documentation layout.  
__0.3.1__  
Case insensitive filters: iStartsWith, iEndsWith and iContains.  
__0.3.0__  
Fix broken links in docs.  
__0.2.9__  
Support for row.delete().  
Rollback only throws when error is present.  
__0.2.8__  
Guid accepts uppercase letters.  
Bugfix: null inserts on guid columns yielded wrong sql.  
__0.2.7__  
New method, toDto(), converts row to data transfer object.  
Bugfix: toJSON returned incorrect string on hasMany relations.  
__0.2.6__  
Fixed incorrect links in README.  
__0.2.5__  
Bugfix: caching on composite keys could give a crash #7. 
Improved sql compression on insert/update.  
__0.2.4__  
Bugfix: getMany with many-strategy and shallowFilter yields incorrect query #6.  
__0.2.3__  
Reformatted documentation. No code changes.  