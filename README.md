__rdb__
=========
ORM for nodejs / iojs.  
Supports postgres and mySql.  

## Installation
`npm install rdb`
## Features
Simple, flexible mapper.  
Transaction with commit and rollback.  
Persistence ignorance - no need for explicit saving, everything is handled by transaction.  
Eager or lazy loading.  
Based on promises.  
[Documentation and examples](docs/docs.md)  
## Release notes
__1.5.7__  
Bugfix: getById.exclusive and tryGetById.exclusive did not lock if row was cached.  
Improved performance on tryGetFirst.  
__1.5.6__  
Raw sql filters can accept sql both as string and as function.  E.g. var filter = {sql: function() {return 'foo > 1';}}.  
__1.5.5__  
Optional locks for getMany, tryGetFirst and tryGetById. Instead of calling getMany(params) just call getMany.exclusive(params). Same syntax goes for tryGetFirst and tryGetById. This will result in  SELECT FOR UPDATE.  
Bugfix: bulk deletes now accepts raw sql filters too.  
__1.5.4__  
Transaction locks. Postgres only.  
__1.5.3__  
Upgraded to pg 6.0.3  
__1.5.2__  
Improved performance and reduced memory footprint.  
__1.5.1__  
Documented JSON column type. [Bug fix: Insert and foreign key violation](https://github.com/alfateam/rdb/issues/19).  
__1.5.0__  
JSON column type. Postgres json type does not support rdb filters.  
__1.4.1__  
[Empty filter would sometimes cause invalid filter.](https://github.com/alfateam/rdb/issues/18)  
__1.4.0__  
Raw SQL query.  
__1.3.0__  
getMany() now supports limit and orderBy - same syntax as in streaming.  
__1.2.3__  
Bugfix: [iEqual gave incorrect sql when parameterized.](https://github.com/alfateam/rdb/issues/17)  
__1.2.2__  
Exlusive no longer returns a clone of table. It has changes current table to exclusive locking.  
__1.2.1__  
Bugfix: Exclusive row locks  
__1.2.0__  
Exclusive row locks  
__1.1.0__  
Now supporting streaming.  Requires postgres or MySQL >=5.7.7  
__1.0.8__  
README fixup.  
__1.0.7__  
Better performance on insert and update.  
__1.0.6__  
Bugfix: Transaction domain should not forward rdb singleton from old domain.  
__1.0.5__  
Documentation cleanup.  
__1.0.4__  
[orderBy](https://github.com/alfateam/rdb/blob/master/docs/docs.md#_todtowithorderby) in toDto().  
__1.0.3__  
toDto() using next tick on every thousandth row to avoid maximum call stack size exceeded.  
__1.0.2__  
Reduced number of simultaneous promises in order to avoid maximum call stack size exceeded.  
__1.0.1__  
Bugfix: Incorrect insert/updates on timestamp without timezone. The time was converted utc instead of stripping the timezone.  
__1.0.0__  
Transaction domain forwards properties from old domain.  
Semantic versioning from now on.  
__0.5.1__  
Improved performance  
__0.5.0__  
[Logging](https://github.com/alfateam/rdb-demo/blob/master/logging.js): rdb.log(someFunc) logs sql and parameters.  
[Raw sql filters.](https://github.com/alfateam/rdb-demo/blob/master/filtering/rawSqlFilter.js)  
__0.4.9__  
New method: tryGetById.  
New filter: iEqual, postgres only.  
Bugfix: rows.toJSON() without strategy did not include any children.  
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
