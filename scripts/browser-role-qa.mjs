import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const baseUrl = (process.env.DRISHTIRECRUIT_BASE_URL || "http://127.0.0.1:3100").replace(/\/$/, "");
const debugPort = Number(process.env.CHROMIUM_DEBUG_PORT || 9223);
const password = process.env.DRISHTIRECRUIT_DEMO_PASSWORD || "DrishtiRecruit123!";
const roles = [
  { name: "Candidate", email: "candidate@drishtirecruit.local", route: "/candidate/dashboard", marker: "Candidate dashboard" },
  { name: "Recruiter", email: "recruiter@drishtirecruit.local", route: "/recruiter/dashboard", marker: "Recruiter dashboard" },
  { name: "Hiring Manager", email: "manager@drishtirecruit.local", route: "/recruiter/dashboard", marker: "Recruiter dashboard" },
  { name: "Interviewer", email: "interviewer@drishtirecruit.local", route: "/interviewer/interviews", marker: "Interviewer workspace" },
  { name: "Admin", email: "admin@drishtirecruit.local", route: "/admin", marker: "Platform administration" },
];

function commandExists(command) {
  if (path.isAbsolute(command) && fs.existsSync(command)) return true;
  const probe = process.platform === "win32" ? spawnSync("where", [command], { stdio: "ignore" }) : spawnSync("sh", ["-lc", `command -v ${command}`], { stdio: "ignore" });
  return probe.status === 0;
}
function chromiumPath() {
  const candidates = [process.env.CHROMIUM_PATH, "chromium", "chromium-browser", "google-chrome", "google-chrome-stable"].filter(Boolean);
  return candidates.find(commandExists);
}
async function waitJson(url, timeoutMs=15_000) {
  const started=Date.now(); let last;
  while(Date.now()-started<timeoutMs){ try { const response=await fetch(url); if(response.ok) return await response.json(); last=`HTTP ${response.status}`; } catch(error){ last=error.message; } await new Promise(r=>setTimeout(r,250)); }
  throw new Error(`Timed out waiting for ${url}: ${last}`);
}
class Cdp {
  constructor(url){ this.url=url; this.id=0; this.pending=new Map(); }
  async connect(){ this.ws=new WebSocket(this.url); await new Promise((resolve,reject)=>{ this.ws.onopen=resolve; this.ws.onerror=reject; }); this.ws.onmessage=(event)=>{ const msg=JSON.parse(event.data); if(msg.id && this.pending.has(msg.id)){ const {resolve,reject}=this.pending.get(msg.id); this.pending.delete(msg.id); msg.error?reject(new Error(msg.error.message)):resolve(msg.result); } }; }
  send(method, params={}, sessionId){ const id=++this.id; const msg={id,method,params}; if(sessionId) msg.sessionId=sessionId; return new Promise((resolve,reject)=>{ this.pending.set(id,{resolve,reject}); this.ws.send(JSON.stringify(msg)); }); }
  close(){ try{this.ws?.close();}catch{} }
}
async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
async function navigate(cdp, sessionId, url){ await cdp.send("Page.navigate",{url},sessionId); for(let i=0;i<120;i++){ const probe=await cdp.send("Runtime.evaluate",{expression:"({ready:document.readyState,url:location.href})",returnByValue:true},sessionId); const value=probe.result?.value; if(value?.ready==="complete" && value?.url?.startsWith(url)) return; await sleep(100); } throw new Error(`Navigation did not complete: ${url}`); }
async function evaluate(cdp,sessionId,expression){ const result=await cdp.send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true},sessionId); if(result.exceptionDetails) throw new Error(result.exceptionDetails.text || "browser evaluation failed"); return result.result?.value; }

const chrome = chromiumPath();
if(!chrome) throw new Error("Chrome/Chromium not found. Set CHROMIUM_PATH.");
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"drishtirecruit-browser-qa-"));
const child=spawn(chrome,["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","--no-sandbox",`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,"about:blank"],{stdio:"ignore"});
let cdp;
try{
  const version=await waitJson(`http://127.0.0.1:${debugPort}/json/version`);
  cdp=new Cdp(version.webSocketDebuggerUrl); await cdp.connect();
  for(const role of roles){
    const {browserContextId}=await cdp.send("Target.createBrowserContext");
    try{
      const {targetId}=await cdp.send("Target.createTarget",{url:`${baseUrl}/login`,browserContextId});
      const {sessionId}=await cdp.send("Target.attachToTarget",{targetId,flatten:true});
      await cdp.send("Page.enable",{},sessionId); await cdp.send("Runtime.enable",{},sessionId);
      await navigate(cdp,sessionId,`${baseUrl}/login`);
      const loginPayload = JSON.stringify({ email: role.email, password });
      const loginExpression = `fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:${JSON.stringify(loginPayload)}}).then(async r=>({status:r.status,body:await r.json()}))`;
      const login=await evaluate(cdp,sessionId,loginExpression);
      if(login.status!==200 || login.body?.ok!==true || login.body?.data?.requiresTwoFactor) throw new Error(`${role.name} login failed: ${JSON.stringify(login)}`);
      await navigate(cdp,sessionId,`${baseUrl}${role.route}`);
      const page=await evaluate(cdp,sessionId,"({url:location.href,text:document.body.innerText})");
      if(!page.url.startsWith(`${baseUrl}${role.route}`)) throw new Error(`${role.name} redirected unexpectedly to ${page.url}`);
      if(!page.text.includes(role.marker)) throw new Error(`${role.name} page missing marker '${role.marker}'`);
      console.log(`PASS ${role.name.padEnd(15)} ${role.route}`);
    } finally { await cdp.send("Target.disposeBrowserContext",{browserContextId}).catch(()=>{}); }
  }
  console.log(`PASS five-role Chromium QA against ${baseUrl}`);
} finally {
  cdp?.close(); child.kill("SIGTERM"); fs.rmSync(profile,{recursive:true,force:true});
}
