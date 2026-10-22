import { DurableObject } from 'cloudflare:workers';
export class GuideAllowance extends DurableObject {
 constructor(ctx,env){
  super(ctx,env);this.ctx=ctx;
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS allowance (id INTEGER PRIMARY KEY, reserved REAL NOT NULL)');
  ctx.storage.sql.exec('INSERT OR IGNORE INTO allowance VALUES (1,0)');
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS holds (id TEXT PRIMARY KEY, amount REAL NOT NULL)');
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS charges (id TEXT PRIMARY KEY)');
  ctx.storage.transactionSync(()=>{const r=ctx.storage.sql.exec("INSERT OR IGNORE INTO charges VALUES ('direct-verification-20') RETURNING id").toArray();if(r.length)ctx.storage.sql.exec('UPDATE allowance SET reserved=reserved+20 WHERE id=1');});
 }
 reserve(){return this.ctx.storage.transactionSync(()=>{const rows=this.ctx.storage.sql.exec('UPDATE allowance SET reserved=reserved+200 WHERE id=1 AND reserved+200<=1000 RETURNING reserved').toArray();if(!rows.length)return {ok:false,limit:1000};const id=crypto.randomUUID();this.ctx.storage.sql.exec('INSERT INTO holds VALUES (?,200)',id);return {ok:true,id,reserved:rows[0].reserved,limit:1000};});}
 settle(id,actual){return this.ctx.storage.transactionSync(()=>{const r=this.ctx.storage.sql.exec('DELETE FROM holds WHERE id=? RETURNING amount',id).toArray();if(r.length&&Number.isFinite(actual)&&actual>=0&&actual<=200)this.ctx.storage.sql.exec('UPDATE allowance SET reserved=reserved-? WHERE id=1',200-actual);return this.status();});}
 status(){return this.ctx.storage.sql.exec('SELECT reserved FROM allowance WHERE id=1').one();}
}