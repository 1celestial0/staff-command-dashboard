#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,"..");
const config=JSON.parse(fs.readFileSync(path.join(root,"public","config.json"),"utf8"));
const statusPath=path.join(root,"public","status.json");
function parseArgs(argv){const out={};for(let i=0;i<argv.length;i++){const a=argv[i];if(!a.startsWith("--"))continue;const key=a.slice(2);const val=argv[i+1]&&!argv[i+1].startsWith("--")?argv[++i]:true;out[key]=val}return out}
function parseCsv(text){const rows=[];let row=[],cur="",inQ=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(inQ){if(c==='"'&&n==='"'){cur+='"';i++}else if(c==='"')inQ=false;else cur+=c}else{if(c==='"')inQ=true;else if(c===","){row.push(cur);cur=""}else if(c==="\n"){row.push(cur);rows.push(row);row=[];cur=""}else if(c!=="\r")cur+=c}}if(cur.length||row.length){row.push(cur);rows.push(row)}const headers=rows[0].map(h=>h.trim());return rows.slice(1).filter(r=>r.some(c=>String(c).trim())).map(r=>{const obj={};headers.forEach((h,i)=>obj[h]=(r[i]??"").trim());return obj})}
function slugify(name){return String(name||"").toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}
const args=parseArgs(process.argv.slice(2));
let text;if(args.file){text=fs.readFileSync(path.resolve(root,args.file),"utf8")}else{const url=args.url||config.sheetsCsvUrl;const res=await fetch(url);text=await res.text();if(text.includes("ServiceLogin")||text.trim().startsWith("<!")){console.error("Sheet not public. Share Anyone with link (Viewer), or use --file seed/StaffNow.csv");process.exit(1)}}
const rows=parseCsv(text);
const staff=rows.map(r=>({id:slugify(r.Staff),name:r.Staff,lane:r.Lane,priority:r.Priority,status:r.Status,now:r.Now,target:r.Target,startedAt:r.StartedAt||"",lastUpdated:r.UpdatedAt||"",effortMins:Number(r.EffortMins||0)||0,outcome:r.Outcome||"",notes:r.Notes||""}));
const payload={updatedAt:new Date().toISOString(),timezone:"Asia/Calcutta",source:args.file?"csv-file":"google-sheets-sync",sheetId:config.sheetId,staff};
fs.writeFileSync(statusPath,JSON.stringify(payload,null,2)+"\n");
fs.writeFileSync(path.join(root,"status.json"),JSON.stringify(payload,null,2)+"\n");
console.log(`Synced ${staff.length} staff → ${statusPath}`);
