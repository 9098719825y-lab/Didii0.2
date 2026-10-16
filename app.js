(() => {
  const $ = id => document.getElementById(id);
  const chat = $("chat"), form = $("chatForm"), input = $("message");
  const status = $("status"), dialog = $("settingsDialog");
  let voiceOn = true, recognition = null, installPrompt = null;
  const STORE = "shubhra-ai-settings-v1";
  const defaults = {
    endpoint: "", model: "", apiKey: "",
    systemPrompt: "तुम SHUBHRA नाम की मददगार Hindi/Hinglish voice assistant हो। साफ, सही और सुरक्षित जवाब दो। अगर किसी बात का भरोसेमंद ज्ञान नहीं है तो साफ बताओ।"
  };
  let settings = loadSettings();
  function loadSettings(){ try{return {...defaults,...JSON.parse(localStorage.getItem(STORE)||"{}")}}catch{return {...defaults}} }
  function saveSettings(){ try{localStorage.setItem(STORE,JSON.stringify(settings));return true}catch{return false} }
  function setStatus(s){status.textContent=s}
  function addBubble(who,text){
    const el=document.createElement("div"); el.className="bubble "+who;
    const b=document.createElement("b"); b.textContent=who==="user"?"TUM":"SHUBHRA";
    const p=document.createElement("p"); p.textContent=text;
    el.append(b,p); chat.appendChild(el); chat.scrollTop=chat.scrollHeight; return el;
  }
  function speak(text){
    if(!voiceOn || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text); u.lang="hi-IN"; u.rate=1;
    window.speechSynthesis.speak(u);
  }
  function demoReply(q){
    const s=q.toLowerCase();
    if(/namaste|नमस्ते|hello|hi\b/.test(s)) return "नमस्ते! बताओ, आज किस चीज़ में मदद करूँ?";
    if(/samay|time|समय|टाइम/.test(s)) return "अभी तुम्हारे डिवाइस का समय "+new Date().toLocaleTimeString("hi-IN",{hour:"2-digit",minute:"2-digit"})+" है।";
    if(/tarikh|date|तारीख|दिनांक/.test(s)) return "आज "+new Date().toLocaleDateString("hi-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})+" है।";
    if(/kaun|who are you|तुम कौन|kya kar/.test(s)) return "मैं SHUBHRA हूँ—Hindi/Hinglish voice assistant का prototype। AI mode के लिए Settings में compatible API configure करनी होगी।";
    return "मैं अभी demo mode में हूँ, इसलिए इस सवाल का AI जवाब नहीं बना सकती। ⚙️ AI Settings खोलकर compatible API endpoint, model और key configure करो; फिर मैं उससे जवाब लेने की कोशिश करूँगी।";
  }
  async function askAI(messages){
    if(!settings.endpoint) throw new Error("AI endpoint set नहीं है। ⚙️ AI Settings में endpoint, model और जरूरत हो तो API key भरो।");
    const headers={"Content-Type":"application/json"};
    if(settings.apiKey) headers.Authorization="Bearer "+settings.apiKey;
    const body={messages:[{role:"system",content:settings.systemPrompt},...messages]};
    if(settings.model) body.model=settings.model;
    const res=await fetch(settings.endpoint,{method:"POST",headers,body:JSON.stringify(body)});
    if(!res.ok) throw new Error("AI service ने HTTP "+res.status+" दिया। Endpoint, key, model और CORS settings जाँचो।");
    const data=await res.json();
    const answer=data?.choices?.[0]?.message?.content ?? data?.output_text ?? data?.response ?? data?.message;
    if(typeof answer!=="string" || !answer.trim()) throw new Error("Response format पहचाना नहीं गया। यह endpoint OpenAI-compatible chat-completions format नहीं दे रहा हो सकता है।");
    return answer.trim();
  }
  let history=[];
  async function sendMessage(q){
    q=q.trim(); if(!q)return;
    addBubble("user",q); input.value=""; setStatus("सोच रही हूँ…");
    try{
      let answer;
      if(settings.endpoint){
        history.push({role:"user",content:q});
        if(history.length>16) history=history.slice(-16);
        answer=await askAI(history);
        history.push({role:"assistant",content:answer});
      } else answer=demoReply(q);
      addBubble("assistant",answer); speak(answer); setStatus(settings.endpoint?"AI connected":"Demo mode");
    }catch(e){
      const msg="AI से जवाब नहीं मिला: "+(e?.message||"Unknown error")+"\nअभी demo mode में basic commands काम करेंगी।";
      addBubble("assistant",msg); setStatus("Setup needed");
    }
  }
  form.addEventListener("submit",e=>{e.preventDefault();sendMessage(input.value)});
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
  $("settingsBtn").addEventListener("click",()=>{
    $("endpoint").value=settings.endpoint; $("model").value=settings.model;
    $("apiKey").value=settings.apiKey; $("systemPrompt").value=settings.systemPrompt;
    $("settingsStatus").textContent=""; $("settingsStatus").className="settingsStatus";
    dialog.showModal();
  });
  $("closeSettings").addEventListener("click",()=>dialog.close());
  function readSettings(){return {endpoint:$("endpoint").value.trim(),model:$("model").value.trim(),apiKey:$("apiKey").value.trim(),systemPrompt:$("systemPrompt").value.trim()||defaults.systemPrompt}}
  $("saveSettings").addEventListener("click",()=>{
    const next=readSettings();
    if(next.endpoint && !/^https?:\/\//i.test(next.endpoint)){ $("settingsStatus").textContent="Endpoint http:// या https:// से शुरू होना चाहिए।";return; }
    settings=next; const ok=saveSettings(); history=[];
    $("settingsStatus").textContent=ok?"Settings save हो गईं। अब सवाल भेजकर जाँचो।":"Browser storage उपलब्ध नहीं है; settings save नहीं हुईं।";
    $("settingsStatus").className=ok?"settingsStatus ok":"settingsStatus err";
    setStatus(settings.endpoint?"AI configured":"Demo mode");
  });
  $("testBtn").addEventListener("click",async()=>{
    const old=settings; settings=readSettings();
    $("settingsStatus").textContent="Connection test चल रहा है…"; $("settingsStatus").className="settingsStatus";
    try{const answer=await askAI([{role:"user",content:"Reply with exactly: SHUBHRA TEST OK"}]);
      $("settingsStatus").textContent="Connection सफल! जवाब: "+answer; $("settingsStatus").className="settingsStatus ok";
    }catch(e){$("settingsStatus").textContent="Test failed: "+e.message; $("settingsStatus").className="settingsStatus err";}
    finally{settings=old;}
  });
  $("voiceBtn").addEventListener("click",()=>{voiceOn=!voiceOn;$("voiceBtn").textContent=voiceOn?"🔊 आवाज़: चालू":"🔇 आवाज़: बंद";if(!voiceOn&&window.speechSynthesis)window.speechSynthesis.cancel()});
  $("clearBtn").addEventListener("click",()=>{chat.replaceChildren();history=[];addBubble("assistant","Chat साफ़ कर दी गई। अब नया सवाल पूछो।")});
  $("micBtn").addEventListener("click",()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){addBubble("assistant","इस browser में voice recognition उपलब्ध नहीं है। Chrome में try करो या सवाल टाइप करो।");return;}
    if(recognition){try{recognition.stop()}catch{}}
    recognition=new SR(); recognition.lang="hi-IN"; recognition.interimResults=false; recognition.maxAlternatives=1;
    recognition.onstart=()=>setStatus("सुन रही हूँ…");
    recognition.onerror=e=>{setStatus("Mic unavailable");addBubble("assistant","माइक काम नहीं कर पाया ("+e.error+")। Mic permission जाँचो या टाइप करो।")};
    recognition.onresult=e=>{input.value=e.results[0][0].transcript;form.requestSubmit()};
    recognition.onend=()=>{if(!settings.endpoint)setStatus("Demo mode")};
    try{recognition.start()}catch(e){addBubble("assistant","माइक शुरू नहीं हुआ। दोबारा try करो या टाइप करो।")}
  });
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("installBtn").classList.remove("hidden")});
  $("installBtn").addEventListener("click",async()=>{if(!installPrompt){addBubble("assistant","Chrome menu से Add to Home screen चुनो।");return}installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("installBtn").classList.add("hidden")});
  if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost")){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }
  setStatus(settings.endpoint?"AI configured":"Demo mode");
})();