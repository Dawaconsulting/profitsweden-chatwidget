(() => {
  const script = document.currentScript;
  const ENDPOINT  = script?.dataset.endpoint || '';
  const BRAND     = script?.dataset.brand || 'ProFit AI';
  const PRIMARY   = script?.dataset.primary || '#27ae60';
  const WELCOME   = script?.dataset.welcome || 'Hej! Hur kan jag hjälpa dig idag?';
  const ORIGIN    = location.origin;

  // Theme
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('./widget.css', script.src).href;
  document.head.appendChild(css);
  document.documentElement.style.setProperty('--pf-primary', PRIMARY);

  // State
  const sid = getSessionId();
  const storeKey = 'pf_history_' + sid;
  let history = JSON.parse(localStorage.getItem(storeKey) || '[]');

  // UI
  const btn = el('button', { class:'pf-btn', ariaLabel:`Öppna ${BRAND}` }, [
    icon(), text(BRAND)
  ]);
  const panel = el('div', { class:'pf-wrap', role:'dialog', 'aria-label':`${BRAND} chat` });
  const header = el('div', { class:'pf-header' }, [
    el('b', {}, [ text(BRAND) ]),
    el('button', { title:'Stäng', onclick:toggle }, [ text('×') ])
  ]);
  const tip = el('div', { class:'pf-tip' }, [ text('⚠️ Svara inte med personliga uppgifter.') ]);
  const list = el('div', { class:'pf-list' });
  const input = el('div', { class:'pf-input' });
  const field = el('input', { type:'text', placeholder:'Skriv ett meddelande…', onkeydown:(e)=>{ if(e.key==='Enter') send(); }});
  const sendBtn = el('button', { onclick:send }, [ text('Skicka') ]);
  input.append(field, sendBtn);
  panel.append(header, tip, list, input);
  document.body.append(btn, panel);
  btn.addEventListener('click', toggle);

  if (history.length === 0) {
    addMessage('bot', WELCOME);
  } else {
    history.forEach(m => addMessage(m.role === 'user' ? 'user' : 'bot', m.content));
  }

  function toggle(){ panel.classList.toggle('open'); field.focus(); }

  async function send() {
    const msg = field.value.trim();
    if (!msg) return;
    field.value = '';
    addMessage('user', msg);
    save({ role:'user', content: msg });

    try {
      const { stream, reader } = await startStream(ENDPOINT + '/chat', {
        message: msg,
        history: history.slice(-12), // begränsa
        meta: { origin: ORIGIN }
      });

      let botBubble = addMessage('bot', '…');
      let acc = '';
      while(true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        acc += chunk;
        botBubble.textContent = acc;
        list.scrollTop = list.scrollHeight;
      }
      save({ role:'assistant', content: acc });
    } catch (err) {
      addMessage('bot', 'Tyvärr, något gick fel. Försök igen senare.');
      console.error(err);
    }
  }

  function addMessage(kind, textContent) {
    const bubble = el('div', { class:`pf-msg ${kind==='user' ? 'pf-user' : 'pf-bot'}` }, [ text(textContent) ]);
    list.append(bubble);
    list.scrollTop = list.scrollHeight;
    return bubble;
  }

  function save(m){ history.push(m); localStorage.setItem(storeKey, JSON.stringify(history)); }
  function icon(){ return el('span', { style:'display:inline-flex;align-items:center' }, [ text('💬') ]); }
  function text(t){ return document.createTextNode(t); }
  function el(tag, attrs={}, children=[]){ const n=document.createElement(tag); for(const k in attrs) n.setAttribute(k, attrs[k]); children.forEach(c=>n.append(c)); return n; }
  function getSessionId(){ const k='pf_sid'; let v=localStorage.getItem(k); if(!v){ v=crypto.randomUUID(); localStorage.setItem(k,v) } return v; }

  async function startStream(url, body) {
    const res = await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok || !res.body) throw new Error('No stream');
    return { stream: res.body, reader: res.body.getReader() };
  }
})();
