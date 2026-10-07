const KEY="scouterFullV1";
const defaults={
  variants:[
    {subject:"Quick question, {name}",body:"Hi {name},\n\nI came across your store and wanted to share a quick idea that may help improve visibility and conversions.\n\nWould you be open to seeing the idea?\n\nBest regards"},
    {subject:"A quick idea for {domain}",body:"Hello {name},\n\nI noticed your brand while researching stores in your space. I have a practical growth idea that could be worth testing.\n\nCan I send you the details?\n\nBest regards"},
    {subject:"Partnership idea for {name}",body:"Hi {name},\n\nI work with eCommerce brands on visibility and conversion improvements. I believe there may be an opportunity worth exploring for your store.\n\nWould you like me to share it?\n\nBest regards"}
  ],
  recipients:[],generated:[],templates:[],theme:"light"
};
let state=JSON.parse(localStorage.getItem(KEY)||"null")||structuredClone(defaults);
let selectedFile=null;

const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function emailValid(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}
function extractRecipients(text){
  const tokens=text.split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean), out=[];
  for(const token of tokens){
    const match=token.match(/^(.*?)\s*<([^>]+)>$/);
    const email=(match?match[2]:token).trim();
    const name=(match?match[1]:email.split("@")[0]).trim();
    if(!out.some(x=>x.email.toLowerCase()===email.toLowerCase())) out.push({name,email,valid:emailValid(email)});
  }
  return out;
}
function syncRecipientsFromInput(){
  const parsed=extractRecipients($("recipientInput").value);
  state.recipients=parsed;
  save(); renderRecipients();
}
function renderRecipients(){
  const r=state.recipients, valid=r.filter(x=>x.valid).length;
  $("validCount").textContent=valid;$("invalidCount").textContent=r.length-valid;$("totalCount").textContent=r.length;
  $("recipientPreview").innerHTML=r.slice(0,30).map(x=>`<div class="recipient-row ${x.valid?"":"invalid"}"><span>${esc(x.name)}</span><span>${esc(x.email)} ${x.valid?"":"— invalid"}</span></div>`).join("");
}
function renderVariants(){
  $("variantGrid").innerHTML=state.variants.map((v,i)=>`
    <div class="variant">
      <div class="variant-head"><strong>Variant ${i+1}</strong><button class="ghost-btn remove-variant" data-i="${i}" ${state.variants.length<=1?"disabled":""}>Remove</button></div>
      <label>Subject Line<input class="variant-subject" data-i="${i}" maxlength="200" value="${esc(v.subject)}"></label>
      <label>Message Body<textarea class="variant-body" data-i="${i}" maxlength="2000">${esc(v.body)}</textarea></label>
    </div>`).join("");
  document.querySelectorAll(".variant-subject").forEach(el=>el.oninput=e=>{state.variants[+e.target.dataset.i].subject=e.target.value;save()});
  document.querySelectorAll(".variant-body").forEach(el=>el.oninput=e=>{state.variants[+e.target.dataset.i].body=e.target.value;save()});
  document.querySelectorAll(".remove-variant").forEach(el=>el.onclick=()=>{state.variants.splice(+el.dataset.i,1);save();renderVariants()});
  if(state.variants.length<3){
    const b=document.createElement("button");b.className="secondary-btn";b.textContent="+ Add Variant";
    b.onclick=()=>{state.variants.push({subject:"",body:""});save();renderVariants()};$("variantGrid").appendChild(b);
  }
}
function personalize(text,r){
  const domain=r.email.split("@")[1]||"";
  return text.replaceAll("{name}",r.name||r.email.split("@")[0]).replaceAll("{email}",r.email).replaceAll("{domain}",domain);
}
function randomVariant(){
  return state.variants[Math.floor(Math.random()*state.variants.length)];
}
function generate(){
  syncRecipientsFromInput();
  const recipients=state.recipients.filter(x=>x.valid);
  if(!recipients.length){alert("Add at least one valid recipient.");return}
  const shuffle=$("shuffleToggle").checked;
  const generated=recipients.map((r,i)=>{
    const v=shuffle?randomVariant():state.variants[i%state.variants.length];
    return {id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+i),recipient:r,variantIndex:state.variants.indexOf(v),subject:personalize(v.subject,r),body:personalize(v.body,r),clicked:false,createdAt:Date.now()};
  });
  state.generated=[...generated,...state.generated];
  save();renderAll();document.querySelector('[data-section="generated"]').click();
}
function mailto(item){
  item.clicked=true;item.clickedAt=Date.now();save();renderAll();
  window.location.href=`mailto:${encodeURIComponent(item.recipient.email)}?subject=${encodeURIComponent(item.subject)}&body=${encodeURIComponent(item.body)}`;
}
function copy(text){navigator.clipboard?.writeText(text).then(()=>alert("Copied to clipboard."))}
function exportCSV(items){
  const rows=[["Email","Name","Subject","Body","Status","Created"]];
  items.forEach(x=>rows.push([x.recipient.email,x.recipient.name,x.subject,x.body,x.clicked?"Sent/Clicked":"Pending",new Date(x.createdAt).toISOString()]));
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="scouter-emails.csv";a.click();URL.revokeObjectURL(a.href);
}
function renderEmailList(){
  const list=state.generated.slice(0,60);
  $("emailList").innerHTML=list.map(x=>`<div class="email-item" data-id="${x.id}">
    <div class="email-top"><span class="email-address">${esc(x.recipient.email)}</span><span class="badge ${x.clicked?"sent":""}">${x.clicked?"Clicked":"Pending"}</span></div>
    <div class="email-subject">${esc(x.subject)}</div><div class="email-preview">${esc(x.body.replace(/\n/g," "))}</div>
  </div>`).join("");
  $("emptyEmails").style.display=list.length?"none":"block";
  document.querySelectorAll(".email-item").forEach(el=>el.onclick=()=>{const x=state.generated.find(a=>a.id===el.dataset.id);if(x)mailto(x)});
}
function renderStats(){
  const total=state.generated.length,sent=state.generated.filter(x=>x.clicked).length,remaining=total-sent;
  const recent=state.generated.filter(x=>x.clicked&&Date.now()-x.clickedAt<86400000).length;
  $("sentStat").textContent=sent;$("remainingStat").textContent=remaining;$("generatedStat").textContent=total;$("sent24Stat").textContent=recent;
  $("progressBar").style.width=(total?sent/total*100:0)+"%";$("progressText").textContent=`${total?Math.round(sent/total*100):0}% Complete`;
}
function renderTable(){
  const q=($("emailSearch").value||"").toLowerCase(),f=$("statusFilter").value;
  const list=state.generated.filter(x=>(x.recipient.email+x.recipient.name+x.subject).toLowerCase().includes(q)&&(f==="all"||(f==="sent"?x.clicked:!x.clicked)));
  $("generatedTable").innerHTML=`<div class="table-wrap"><table><thead><tr><th>Email</th><th>Subject</th><th>Variant</th><th>Status</th><th>Created</th><th>Action</th></tr></thead><tbody>${list.map(x=>`<tr><td>${esc(x.recipient.email)}</td><td>${esc(x.subject)}</td><td>${x.variantIndex+1}</td><td>${x.clicked?"Clicked":"Pending"}</td><td>${new Date(x.createdAt).toLocaleString()}</td><td><button class="secondary-btn open-row" data-id="${x.id}">Open</button></td></tr>`).join("")}</tbody></table></div>${list.length?"":"<div class='empty-state'>No matching emails.</div>"}`;
  document.querySelectorAll(".open-row").forEach(b=>b.onclick=()=>{const x=state.generated.find(a=>a.id===b.dataset.id);if(x)mailto(x)});
}
function renderAnalytics(){
  const total=state.generated.length,sent=state.generated.filter(x=>x.clicked).length;
  $("analyticsSent").textContent=sent;$("analyticsRemaining").textContent=total-sent;$("clickRate").textContent=(total?Math.round(sent/total*100):0)+"%";$("analyticsRecipients").textContent=state.recipients.length;
  const domains={};state.generated.forEach(x=>{const d=x.recipient.email.split("@")[1]||"unknown";domains[d]=(domains[d]||0)+1});
  const arr=Object.entries(domains).sort((a,b)=>b[1]-a[1]).slice(0,8),max=arr[0]?.[1]||1;
  $("domainChart").innerHTML=arr.map(([d,n])=>`<div class="domain-row"><span>${esc(d)}</span><div class="domain-bar"><span style="width:${n/max*100}%"></span></div><b>${n}</b></div>`).join("")||"<div class='empty-state'>No data available</div>";
}
function renderTemplates(){
  $("templateList").innerHTML=state.templates.map((t,i)=>`<div class="template-card"><h3>${esc(t.name)}</h3><p>${t.variants.length} subject/body variants</p><button class="secondary-btn load-template" data-i="${i}">Use Template</button><button class="secondary-btn delete-template" data-i="${i}">Delete</button></div>`).join("")||"<div class='empty-state'>No saved templates.</div>";
  document.querySelectorAll(".load-template").forEach(b=>b.onclick=()=>{state.variants=structuredClone(state.templates[+b.dataset.i].variants);save();renderVariants();document.querySelector('[data-section="outreach"]').click()});
  document.querySelectorAll(".delete-template").forEach(b=>b.onclick=()=>{state.templates.splice(+b.dataset.i,1);save();renderTemplates()});
}
function renderAll(){renderRecipients();renderVariants();renderEmailList();renderStats();renderTable();renderAnalytics();renderTemplates()}
function importFile(){
  if(!selectedFile)return alert("Choose a CSV or TXT file first.");
  const reader=new FileReader();reader.onload=()=>{$("recipientInput").value=reader.result;syncRecipientsFromInput()};reader.readAsText(selectedFile);
}
function addRecipient(){
  const name=$("singleName").value.trim(),email=$("singleEmail").value.trim();
  if(!emailValid(email))return alert("Enter a valid email.");
  if(state.recipients.some(x=>x.email.toLowerCase()===email.toLowerCase()))return alert("That email is already in the list.");
  state.recipients.push({name:name||email.split("@")[0],email,valid:true});$("recipientInput").value=state.recipients.map(x=>x.name?`${x.name} <${x.email}>`:x.email).join("\n");save();renderRecipients();$("recipientModal").classList.remove("show");
}
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".section").forEach(s=>s.classList.remove("active-section"));$(b.dataset.section+"Section").classList.add("active-section")});
$("recipientInput").addEventListener("input",()=>{clearTimeout(window.rt);window.rt=setTimeout(syncRecipientsFromInput,250)});
$("recipientFile").onchange=e=>{selectedFile=e.target.files[0];$("fileName").textContent=selectedFile?.name||"No file selected"};
$("parseFileBtn").onclick=importFile;$("generateBtn").onclick=generate;
$("copyAllBtn").onclick=()=>copy(state.generated.map(x=>`To: ${x.recipient.email}\nSubject: ${x.subject}\n\n${x.body}`).join("\n\n---\n\n"));
$("exportAllBtn").onclick=()=>exportCSV(state.generated);$("exportRemainingBtn").onclick=()=>exportCSV(state.generated.filter(x=>!x.clicked));
$("clearGeneratedBtn").onclick=()=>{if(confirm("Clear all generated emails?")){state.generated=[];save();renderAll()}};
$("emailSearch").oninput=renderTable;$("statusFilter").onchange=renderTable;
$("themeBtn").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";document.body.classList.toggle("dark",state.theme==="dark");save()};
$("clearDataBtn").onclick=()=>{if(confirm("Clear all local data, including recipients, generated emails and templates?")){localStorage.removeItem(KEY);location.reload()}};
$("scheduleToggle").onchange=()=>{$("scheduleDate").disabled=!$("scheduleToggle").checked;$("scheduleTime").disabled=!$("scheduleToggle").checked};
$("scheduleDate").disabled=true;$("scheduleTime").disabled=true;
$("addRecipientBtn").onclick=()=>{$("recipientModal").classList.add("show");$("singleName").value="";$("singleEmail").value=""};
document.querySelector(".close-modal").onclick=()=>$("recipientModal").classList.remove("show");
$("saveRecipientBtn").onclick=addRecipient;
$("saveTemplateBtn").onclick=()=>{const name=prompt("Template name:");if(!name)return;state.templates.push({name,variants:structuredClone(state.variants)});save();renderTemplates()};
$("themeBtn").textContent=state.theme==="dark"?"☼  Light Mode":"◐  Dark Mode";document.body.classList.toggle("dark",state.theme==="dark");
renderAll();
