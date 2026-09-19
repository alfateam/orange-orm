import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import installSqliteWorker from '../sqliteOPFS/workerHandler.mjs';

installSqliteWorker(() => sqlite3InitModule());
