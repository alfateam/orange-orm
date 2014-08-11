__rdb__
=========
ORM for postgres. 

Simple, flexible mapper.  
Transaction with commit and rollback.  
Persistence ignorance - no need for explicit saving, everything is handled by transaction.  
Eager or lazy loading.  
Based on promises.  
[Docs and examples](docs/docs.md)  
[Release notes](#_releasenotes)  
<a name="_releasenotes"></a>
### Release notes
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