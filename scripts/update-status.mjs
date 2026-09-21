#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const statusPath = path.join(root, "public", "status.json");
function parseArgs(argv){const out={};for(let i=0;i<argv.length;i++){const a=argv[i];if(!a.startsWith("--"))continue;const key=a.slice(2);const val=argv[i+1]&&!argv[i+1].startsWith("--")?argv[++i]:true;out[key]=val}return out}
function nowIST(){const fmt=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Calcutta",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});const parts=Object.fromEntries(fmt.formatToParts(new Date()).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+05:30`}
const args=parseArgs(process.argv.slice(2));
const data=JSON.parse(fs.readFileSync(statusPath,"utf8"));
if(args.list){for(const s of data.staff)console.log(`${s.id}\t${s.status}\t${s.name}`);process.exit(0)}
if(!args.id){console.error("Required: --id <staff-id> (use --list)");process.exit(1)}
const staff=data.staff.find(s=>s.id===args.id||s.name===args.id);
if(!staff){console.error("Staff not found:",args.id);process.exit(1)}
const stamp=nowIST();
if(args.status)staff.status=args.status;
if(args.now)staff.now=args.now;
if(args.target)staff.target=args.target;
if(args.lane)staff.lane=args.lane;
if(args.priority)staff.priority=args.priority;
if(args.outcome)staff.outcome=args.outcome;
if(args.notes)staff.notes=args.notes;
if(args.effort!=null)staff.effortMins=Number(args.effort);
if(args.started)staff.startedAt=args.started;
if(args.status==="In Progress"&&!staff.startedAt)staff.startedAt=stamp;
staff.lastUpdated=stamp;data.updatedAt=stamp;data.source="status.json";
fs.writeFileSync(statusPath,JSON.stringify(data,null,2)+"\n");
fs.writeFileSync(path.join(root,"status.json"),JSON.stringify(data,null,2)+"\n");
console.log(`Updated ${staff.name} → ${staff.status} @ ${stamp}`);
