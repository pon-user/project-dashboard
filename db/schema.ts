import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const snapshot=sqliteTable('snapshot',{id:integer('id').primaryKey(),payload:text('payload'),status:text('status').notNull(),attempt:text('attempt').notNull(),success:text('success'),error:text('error'),revision:integer('revision').notNull().default(0)});
