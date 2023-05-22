![RDB](./docs/logo-sm.jpg)  
RDB is an Object Relational Mapper for nodejs.  
Supports postgres, msSql, mySql, Sybase SAP and sqlite.  

## Installation
`npm install rdb`  

## Features
Simple, flexible mapper.  
Transaction with commit and rollback.  
Persistence ignorance - no need for explicit saving, everything is handled by transaction.  
Eager or lazy loading.  
Based on promises.  
[Documentation and examples](https://github.com/alfateam/rdb/blob/master/docs/docs.md)  

## Release notes
__3.1.10__  
Bugfix when parsing port number in connection string for tedious.  
__3.1.9__  
Improved typescript support for notNullable props on row.  
__3.1.8__  
Improved typescript definitions for notNull() and validate().  
__3.1.7__  
Chainable column.validate() and column.JSONSchema().  
column.notNull().  
__3.1.6__  
Tedious: return first error if AggregatError    
__3.1.5__  
Improved performance for ms sql  
__3.1.4__  
import type to satisfy Type-Only imports/exports  in compilers  
__3.1.3__  
Added eslint-disable no-explicit-any in generated typescript  
__3.1.2__  
Tedious as default driver for msSql.    
__3.1.1__  
Typescript as dev dependency  
__3.1.0__  
Date is mapped to ISO string. Any date input will map 'casted' to ISO string on save.  
__3.0.33__  
ts ignore.  
__3.0.32__  
More compact typescript generation.  
__3.0.31__  
Bugfix json patching.  
__3.0.30__  
Removed dependency rfc6902.  
__3.0.29__  
Overload in typescript for getById.  
__3.0.28__  
Removed dependency rdb-client.  
__3.0.27__  
Query without transaction did not release connection on error.  
__3.0.26__  
Improve typescript code generation.  
__3.0.25__  
Improve typescript code generation.  
__3.0.24__  
Bugfixed related to wathcing JSON column when value is null.  
__3.0.23__  
Still some bugfix related to: [Converting date to ISO sometimes gives incorrect milliseconds part](https://github.com/alfateam/rdb/issues/29).  
__3.0.22__  
Bugfix: [Converting date to ISO sometimes gives incorrect milliseconds part](https://github.com/alfateam/rdb/issues/29).  
__3.0.21__  
Fix typescript generation for Express.  
__3.0.20__  
Throw if empty connection string.
Lazy load dependency node-cls to improve performance and memory usage  
__3.0.19__  
Bugfix when patching many-relationship from rdb-client  
__3.0.17__  
Upgraded dependency uuid  
__3.0.13__  
Upgraded dependency uuid  
__3.0.12__  
Avoid page locking in ms sql in extreme concurrency situations when using patchTable  
__3.0.11__  
Null parameters are replaced with sql 'null' value. This is practical when calling stored procedures with raw sql.    
__3.0.10__  
PeerDependencies as optional with npm 7 and above - using peerDependenciesMeta.  
__3.0.9__  
Support for query without transaction.  
__3.0.8__  
Support for all, any and none filters.  
__3.0.7__  
Hosting in express with typescript support.  
__3.0.6__  
insertAndForget() for situations where you INSERT privileges, but no SELECT privileges.  
__3.0.5__  
Fixed typescript methods: insert-methods should be async and return Promise<..>  
__3.0.4__  
Support for offset  
__3.0.3__  
Exposed typescript methods for [rdb-client](https://npmjs.com/package/rdb-client): query, insert and bulk deletes.  
__3.0.2__  
Binary as base64.  
__3.0.1__  
Small fixes.  
__3.0.0__  
Support for Sybase SAP and MsSql.  
__2.6.28__  
Support for rdb in the browser. Docs will come later.  
__2.6.27__  
Bugfix: JSON patching could result in duplicate DTO when run in same transaction.  
__2.6.26__  
Bugfix: changing a dto on nested property would also change the jsonb column.  
Default value accepts function  
__2.6.25__  
Possible to indirectly update JSONB column by setting a nested property  
__2.6.24__  
Temporary lock with func as an alternative to transaction locks (pg only)  
__2.6.23__  
Bugfix when JSON patching nested relations.  
__2.6.22__  
Bugfix JSON patch.  
__2.6.21__  
Added JSON patch strategy 'skipOnConflict' to skip update if conflict.  
__2.6.20__  
Upgraded to pg@8.  
__2.6.19__  
Wrong location of module.  
__2.6.18__  
Using domains instead of async_hooks for continution local context because async_hooks is unstable and experimental.  
__2.6.17__  
More bugfixes with array patching.  
__2.6.16__  
Bugfix. Did not properly apply json patch with new arrays.  
__2.6.15__  
Downgraded to pg@7 because pg@8 messes up async hooks  
__2.6.14__  
Possible to send in types for custom parsing  
__2.6.13__  
Upgraded to pg@8.  
__2.6.12__  
Bugfix. Delete many relations in JSON patch did delete all.  
__2.6.11__  
Bugfix. Delete related row in JSON patch.  
__2.6.10__  
Bugfix. Did not apply patch properly on arrays inside json.  
__2.6.9__  
Bugfix. Inserts inside update hooks did not execute when last command in transaction.  
__2.6.8__  
Bugfix. Update hooks were sometimes incomplete.  
__2.6.7__  
Hooks on insert, update and delete.  
__2.6.6__  
Return status 204 instead of 200  when json patching.  
__2.6.5__  
Make this version the latest in npm.  
__2.6.4__  
Patching on row no longer modifies patch, but uses a clone instead.  
__2.6.3__  
Bugfix in JSON patching when null on object.  
__2.6.2__  
Bugfix in JSON patching with many relations.  
__2.6.1__  
Experimental JSON patching: patch returns dto of last operation.  
__2.6.0__  
Experimental JSON patching with metadata and single row patching.  
__2.5.1__  
Experimental JSON patching with concurrency strategy.  
__2.5.0__  
Experimental JSON patching and express adapter.  
__2.4.0__  
Supporting native bindings for postgres. The package [pg-native](https://www.npmjs.com/package/node-cls) must be installed as a peer dependency  
__2.3.0__  
Added column validation with JSON Schema or plain validator.  
__2.2.0__  
Throw meaningful error when getById gives no match.  
__2.1.1__  
Bugfix with insert and hasOne relation.  
__2.1.0__  
Pooling is disabled when there is no pool option object sent in. Previously, a pool with default size 10 was always created.  
__2.0.1__  
Ignoring tests when packing for npm  
__2.0.0__  
Domains are replaced by [node-cls](https://www.npmjs.com/package/node-cls) which is based upon [async_hooks](https://nodejs.org/api/async_hooks.html#async_hooks_async_hooks). Beware that async_hooks are still experimental. Requires node >= 8.  
__1.9.0__  
Throw meaningful error when getById gives no match.  
__1.8.1__  
Bugfix with insert and hasOne relation.  
__1.8.0__  
Pooling is disabled when there is no pool option object sent in. Previously, a pool with default size 10 was always created.  
__1.7.7__  
Commit/rollback are implicit if sending a callback to the transaction function. [See example](https://github.com/alfateam/rdb/blob/await/src/docs/docs.md#_connecttopostgres)  
The callback must return a promise or be an async function.  
__1.7.6__  
Order By now supports jsonb-fields.  
__1.7.5__  
GetManyDto bugfix: crashing on empty result.  
__1.7.4__  
GetManyDto strips nulls.  
__1.7.3__  
GetManyDto. For read-only scenario. A lot faster than getMany.  
__1.7.2__  
Upgraded to pg@7.4.3 and pg-query-stream@1.1.1    
__1.7.1__  
Support for schemas (postgres only).  
__1.7.0__  
sqlite3 is now a peer dependency. Add it to your own package.json if you intend to use it.  
__1.6.9__  
Bugfix: [one-to-many relation returns empty if strategy is included](https://github.com/alfateam/rdb/issues/22).  
__1.6.8__  
Bugfix: [one-to-many relation returns empty if insert/update is done earlier in transaction](https://github.com/alfateam/rdb/issues/21).  
__1.6.7__  
Bugfix in relations.  
__1.6.6__  
Bugfix.  
__1.6.5__  
Improved performance on relations.  
__1.6.4__  
Bugfix.  
__1.6.3__  
Bugfix: potential incorrect timeZoneOffset when serializing date to JSON. Got timeZoneOffset from now() instead of on actual date.  
__1.6.2__  
Removed es6 syntax to ensure backwards compatability.  
Fixed global var leak.  
__1.6.1__  
Now supporting sqlite.  
__1.6.0__  
Bugfix: potential ambigous column error when using limit and relating to other tables.  
__1.5.9__  
Bugfix: using multipleStatements in mySql could sometimes cause an error when updates are run right before a select.  
Improved performance on limit when relating to other tables.  
Using uuid instead of node-uuid  
Updated all dependencies but generic-pool to latest. (Generic-pool has some breaking changes in latest. I will update it in next release.)  
__1.5.8__  
Cleanup line breaks in documentation.  
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
[orderBy](https://github.com/alfateam/rdb/blob/master/src/docs/docs.md#_todtowithorderby) in toDto().  
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
