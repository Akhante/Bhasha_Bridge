/* BhashaBridge: child app (P3). Plain JS, wrapped in a function so it never collides with store.js / rules.js / voice.js.
   Works standalone: if teammates' functions are missing it falls back to simple local versions. */
(() => {
  "use strict";
  const W = window,
    $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const ABORT = Symbol("abort"),
    GATES = ["understand", "express", "apply"];
  const EMOJI = [
    "🐘",
    "🦜",
    "🐠",
    "🥥",
    "🌴",
    "🐯",
    "🦋",
    "🐢",
    "🌺",
    "⭐",
    "🚣",
    "🥭",
  ];
  const S = {
    pack: null,
    kids: [],
    kid: null,
    sess: null,
    cancel: null,
    tick: 0,
    sw: null,
    install: null,
  };

  /* extra UI text (P1: please review the Malayalam; anything in pack.ui overrides these) */
  const X = {
    add_child: ["പുതിയ കുട്ടി", "Add a child"],
    choose_picture: ["ഒരു ചിത്രം തിരഞ്ഞെടുക്കൂ", "Choose a picture"],
    nickname: ["വിളിപ്പേര് (ഇഷ്ടമെങ്കിൽ)", "Nickname (optional)"],
    create_pin: ["4 അക്ക പിൻ ഉണ്ടാക്കൂ", "Make a 4-digit PIN"],
    confirm_pin: ["പിൻ ഒന്നുകൂടി നൽകൂ", "Enter the PIN again"],
    pin_mismatch: [
      "പിൻ ചേരുന്നില്ല. വീണ്ടും ശ്രമിക്കൂ.",
      "PINs don't match. Try again.",
    ],
    wrong_pin: ["തെറ്റായ പിൻ", "Wrong PIN"],
    hello: ["നമസ്കാരം", "Hello"],
    recommended: ["ഇന്ന് ശുപാർശ", "Suggested today"],
    passport: ["പാസ്പോർട്ട്", "Passport"],
    switch_child: ["മറ്റൊരു കുട്ടി", "Switch child"],
    settings: ["ക്രമീകരണങ്ങൾ", "Settings"],
    install_app: ["ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യൂ", "Install app"],
    offline_ready: ["ഓഫ്‌ലൈൻ തയ്യാർ", "Ready offline"],
    reset_all: [
      "ഈ ഫോണിലെ എല്ലാ വിവരങ്ങളും മായ്ക്കൂ",
      "Erase all data on this phone",
    ],
    sure: [
      "ഉറപ്പാണോ? ഇത് തിരിച്ചെടുക്കാനാവില്ല.",
      "Are you sure? This cannot be undone.",
    ],
    cancel: ["വേണ്ട", "Cancel"],
    erase: ["മായ്ക്കൂ", "Erase"],
    leave_title: ["പഠനം നിർത്തണോ?", "Leave this session?"],
    leave_text: [
      "ഇതുവരെയുള്ള ഉത്തരങ്ങൾ സേവ് ചെയ്തിട്ടുണ്ട്.",
      "Your answers so far are saved.",
    ],
    leave: ["നിർത്തൂ", "Leave"],
    stay: ["തുടരാം", "Keep going"],
    listening: ["കേൾക്കുന്നു…", "Listening…"],
    processing: ["എഴുതിയെടുക്കുന്നു…", "Writing it down…"],
    thinking: ["ആലോചിക്കുന്നു…", "Thinking…"],
    type_here: ["ഇവിടെ ടൈപ്പ് ചെയ്യൂ", "Type your answer here"],
    no_speech: [
      "ശബ്ദം കേട്ടില്ല. വീണ്ടും പറയൂ അല്ലെങ്കിൽ ടൈപ്പ് ചെയ്യൂ.",
      "Couldn't hear you. Try again or type.",
    ],
    mic_blocked: [
      "മൈക്ക് ഉപയോഗിക്കാൻ അനുമതി വേണം. ടൈപ്പ് ചെയ്യാം.",
      "Microphone is not available. You can type instead.",
    ],
    voice_net: [
      "ശബ്ദത്തിന് ഇന്റർനെറ്റ് വേണം. ടൈപ്പ് ചെയ്യാം.",
      "Voice needs internet. You can type instead.",
    ],
    explain_title: ["നമുക്ക് ഒരുമിച്ച് നോക്കാം", "Let's look at it together"],
    check_again: [
      "ഇനി ഒന്നുകൂടി നോക്കാം. ഏതാണ് ശരി?",
      "Let's check again. Which is right?",
    ],
    almost: ["ഏകദേശം ശരിയായി!", "Almost there!"],
    missing_words: ["ഈ വാക്കുകൾ കൂടി ഉപയോഗിക്കൂ", "Try using these words too"],
    model_answer: ["പരീക്ഷയിലെ ഉത്തരം ഇങ്ങനെയാകാം", "An exam-style answer"],
    right_idea: ["ശരിയായ ആശയം", "The right idea"],
    session_done: ["ഇന്നത്തെ പഠനം കഴിഞ്ഞു!", "Session complete!"],
    today: ["ഇന്ന് നിങ്ങൾ ചെയ്തത്", "What you did today"],
    see_passport: ["പാസ്പോർട്ട് കാണൂ", "See my Passport"],
    home: ["ഹോം", "Home"],
    low_note: [
      "ഇന്റർനെറ്റ് ഇല്ലാത്തപ്പോൾ കിട്ടിയ ഫലം താൽക്കാലികമാണ്.",
      "Results gathered offline are marked lower-confidence.",
    ],
    load_error: [
      "പാഠം ലോഡ് ചെയ്യാനായില്ല. ഒരിക്കൽ ഇന്റർനെറ്റിൽ ബന്ധിപ്പിക്കൂ.",
      "Couldn't load the lesson. Connect to the internet once.",
    ],
    ok: ["ശരി", "Got it"],
    offline: ["ഓഫ്‌ലൈൻ", "Offline"],
  };
  const NEXT_ML = {
    understand:
      "ഒരു പുതിയ ദൈനംദിന ഉദാഹരണം എടുത്ത് എന്ത് സംഭവിക്കുമെന്ന് പ്രവചിച്ചു നോക്കൂ.",
    express: "മലയാളം-ഇംഗ്ലീഷ് വാക്കുകൾ പഠിച്ച ശേഷം ഇംഗ്ലീഷിൽ ഉത്തരം പറയൂ.",
    apply: "സൂചനകൾ കുറച്ച് ഒരു പുതിയ സാഹചര്യം ചെയ്തുനോക്കൂ.",
  };
  const u = (k) =>
    S.pack?.ui?.[k] || (X[k] ? { ml: X[k][0], en: X[k][1] } : { ml: k, en: k });
  const bi = (o) =>
    `<span class="ml" lang="ml">${esc(o?.ml)}</span><span class="en" lang="en">${esc(o?.en)}</span>`;
  const plain = (o) =>
    (document.body.dataset.lang === "en" ? o?.en : o?.ml) || "";

  /* ---- bridges to teammates' code, with local fallbacks ---- */
  const ev = {
    load: (id) =>
      W.loadEvidence
        ? W.loadEvidence(id)
        : JSON.parse(localStorage.getItem("bb_evidence_" + id) || "[]"),
    save(id, it) {
      if (W.saveEvidence) return W.saveEvidence(id, it);
      const a = ev.load(id);
      a.push(it);
      localStorage.setItem("bb_evidence_" + id, JSON.stringify(a));
    },
  };
  const gstate = (e, c, g) => {
    if (W.gateState) return W.gateState(e, c, g);
    let p = 0,
      f = 0,
      n = 0;
    e.filter((x) => x.concept === c && x.gate === g).forEach((x) => {
      const w = x.confidence === "low" ? 0.5 : 1;
      x.result === "pass" ? (p += w) : (f += w);
      n++;
    });
    const est = (p + 1) / (p + f + 2);
    return {
      n,
      estimate: est,
      label:
        n < 3
          ? "not enough evidence yet"
          : est >= 0.7
            ? "strong"
            : est >= 0.45
              ? "developing"
              : "needs support",
    };
  };
  const nextAct = (e, c) => {
    if (W.nextActivity) return W.nextActivity(e, c);
    const w = GATES.map((g) => [g, gstate(e, c, g).estimate]).sort(
      (a, b) => a[1] - b[1],
    )[0][0];
    return {
      gate: w,
      text: {
        understand: "Try a new everyday example and predict what happens",
        express: "Learn the word pairs, then answer in English",
        apply: "Try a new situation with fewer hints",
      }[w],
    };
  };

  /* ---- small UI helpers ---- */
  let toastT;
  const toast = (m) => {
    const t = $("#toast");
    t.textContent = m;
    t.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("on"), 2600);
  };
  const player = new Audio();
  let unlocked = false;
  const SIL =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
  addEventListener("pointerdown", () => {
    if (unlocked) return;
    player.src = SIL;
    player
      .play()
      .then(() => {
        player.pause();
        unlocked = true;
      })
      .catch(() => {});
  });
  const play = (p) =>
    new Promise((r) => {
      if (!p) return r(false);
      player.onended = () => r(true);
      player.onerror = () => r(false);
      player.src = p;
      player.play().catch(() => r(false));
    });
  const liveCache = {};
  async function speak(file, text) {
    if (file && (await play(file))) return;      // pre-made file worked
    if (!text || text === "...") return;          // nothing real to say yet
    try {
      let src = liveCache[text];
      if (!src) {
        const r = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const d = await r.json();
        if (!d.audioBase64) return;
        src = "data:audio/wav;base64," + d.audioBase64;
        liveCache[text] = src;
      }
      await play(src);
    } catch (e) {}
  }
  const listen = (o) =>
    o && (o.audio || o.ml)
      ? `<button class="listen" data-audio="${esc(o.audio || "")}" data-text="${esc(o.ml || "")}" aria-label="Listen">🔊</button>`
      : "";
  const confetti = () => {
    const c = $("#confetti");
    if (!c) return;
    const col = ["#ffb400", "#ff7a45", "#2f8f6b", "#d6336c"];
    c.innerHTML = Array.from(
      { length: 34 },
      () =>
        `<i style="left:${Math.random() * 100}%;background:${col[(Math.random() * 4) | 0]};--dx:${Math.random() * 120 - 60}px;animation-delay:${Math.random() * 0.4}s"></i>`,
    ).join("");
    setTimeout(() => {
      c.innerHTML = "";
    }, 2600);
    navigator.vibrate?.(40);
  };
  const show = (id) => {
    clearInterval(S.tick);
    player.pause();
    $$(".screen").forEach((s) => (s.hidden = s.id !== id));
    $("#boot").hidden = true;
    scrollTo(0, 0);
  };
  const setLang = (l) => {
    document.body.dataset.lang = l;
    document.documentElement.lang = l === "en" ? "en" : "ml";
    localStorage.setItem("bb_lang", l);
  };
  const modal = (html) => {
    const m = $("#modal");
    m.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
    m.hidden = false;
  };
  const closeModal = () => {
    $("#modal").hidden = true;
  };
  const confirmBox = (title, text, yes, onYes) => {
    modal(
      `<h1>${bi(title)}</h1><p>${bi(text)}</p><div class="row"><button class="btn alt" data-m="no">${bi(u("cancel"))}</button><button class="btn" data-m="yes">${bi(yes)}</button></div>`,
    );
    $("[data-m=yes]").onclick = () => {
      closeModal();
      onYes();
    };
    $("[data-m=no]").onclick = closeModal;
  };
  const netChip = () => {
    const c = $("#net");
    c.hidden = navigator.onLine;
    c.innerHTML = bi(u("offline"));
  };

  /* ---- profiles: picture + PIN, stored only on this phone ---- */
  const saveKids = () =>
    localStorage.setItem("bb_children", JSON.stringify(S.kids));
  function viewKids() {
    S.kid = null;
    S.sess = null;
    $("#s-kids").innerHTML =
      `<h1>${bi(u("pick_child"))}</h1><div class="kids">${S.kids.map((k) => `<button class="kid" data-kid="${k.id}"><span class="av">${k.emoji}</span><b>${esc(k.nick)}</b></button>`).join("")}
    <button class="kid add" data-act="add"><span class="av">＋</span><b>${bi(u("add_child"))}</b></button></div>`;
    show("s-kids");
  }
  function pinPad(sec, head, done) {
    let buf = "";
    $(sec).innerHTML =
      `${head}<div class="dots" id="dots">${"<i></i>".repeat(4)}</div><div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k) => (k === "" ? "<span></span>" : `<button data-k="${k}">${k}</button>`)).join("")}</div>`;
    const paint = () =>
      $$("#dots i").forEach((d, i) => d.classList.toggle("on", i < buf.length));
    $$("[data-k]", $(sec)).forEach(
      (b) =>
        (b.onclick = () => {
          buf =
            b.dataset.k === "⌫"
              ? buf.slice(0, -1)
              : (buf + b.dataset.k).slice(0, 4);
          paint();
          if (buf.length === 4) {
            const ok = done(buf);
            if (ok === false) {
              $("#dots").classList.add("bad");
              navigator.vibrate?.(120);
              setTimeout(() => {
                buf = "";
                $("#dots")?.classList.remove("bad");
                paint();
              }, 450);
            }
          }
        }),
    );
  }
  function viewPin(k) {
    pinPad(
      "#s-pin",
      `<div class="center"><div class="av">${k.emoji}</div><h1>${esc(k.nick)}</h1><p class="note">${bi(u("enter_pin"))}</p></div>`,
      (pin) => {
        if (pin !== k.pin) {
          toast(plain(u("wrong_pin")));
          return false;
        }
        S.kid = k;
        viewHome();
      },
    );
    $("#s-pin").insertAdjacentHTML(
      "beforeend",
      `<button class="btn alt" data-act="kids">${bi(u("switch_child"))}</button>`,
    );
    show("s-pin");
  }
  function viewCreate() {
    let emoji = "",
      nick = "";
    $("#s-create").innerHTML =
      `<h1>${bi(u("add_child"))}</h1><div class="card"><p class="note">${bi(u("choose_picture"))}</p><div class="emo">${EMOJI.map((e) => `<button data-e="${e}">${e}</button>`).join("")}</div>
    <p class="note" style="margin-top:14px">${bi(u("nickname"))}</p><input id="nick" type="text" maxlength="12" autocomplete="off"></div>
    <button id="nx" class="btn" disabled>${bi(u("next"))}</button><button class="btn alt" data-act="kids">${bi(u("cancel"))}</button>`;
    $$("[data-e]").forEach(
      (b) =>
        (b.onclick = () => {
          emoji = b.dataset.e;
          $$("[data-e]").forEach((x) => x.classList.toggle("sel", x === b));
          $("#nx").disabled = false;
        }),
    );
    $("#nx").onclick = () => {
      nick = $("#nick").value.trim().slice(0, 12) || emoji;
      let first = "";
      pinPad(
        "#s-create",
        `<div class="center"><div class="av">${emoji}</div><p class="note">${bi(u("create_pin"))}</p></div>`,
        (p1) => {
          first = p1;
          pinPad(
            "#s-create",
            `<div class="center"><div class="av">${emoji}</div><p class="note">${bi(u("confirm_pin"))}</p></div>`,
            (p2) => {
              if (p2 !== first) {
                toast(plain(u("pin_mismatch")));
                return false;
              }
              const k = {
                id: "c" + Date.now().toString(36),
                emoji,
                nick,
                pin: p2,
              };
              S.kids.push(k);
              saveKids();
              S.kid = k;
              viewHome();
            },
          );
        },
      );
    };
    show("s-create");
  }

  /* ---- home ---- */
  function pill(e, c, g) {
    const s = gstate(e, c, g),
      k =
        s.n < 3
          ? ""
          : s.label === "strong"
            ? "good"
            : s.label === "developing"
              ? "mid"
              : "low";
    return `<span class="pill ${k}">${bi(u("gate_" + g))}<i>${s.n}</i></span>`;
  }
  function viewHome() {
    S.sess = null;
    const e = ev.load(S.kid.id),
      cs = S.pack.concepts;
    const tot = (c) => GATES.reduce((a, g) => a + gstate(e, c.id, g).n, 0),
      rec = cs.reduce((a, c) => (tot(c) < tot(a) ? c : a), cs[0]);
    $("#s-home").innerHTML =
      `<h1>${bi(u("hello"))}, ${esc(S.kid.nick)} ${S.kid.emoji}</h1>
    ${cs
      .map(
        (
          c,
        ) => `<div class="card cc">${c === rec ? `<span class="tag">${bi(u("recommended"))}</span>` : ""}<h2>${bi(c.title)}</h2><div class="pills">${GATES.map((g) => pill(e, c.id, g)).join("")}</div>
      <button class="btn ${c === rec ? "gold" : ""}" data-go="${c.id}">${bi(u("start_session"))}</button></div>`,
      )
      .join("")}
    <div class="row"><a class="btn alt" style="text-decoration:none;text-align:center;padding-top:12px" href="passport.html?child=${S.kid.id}">${bi(u("passport"))}</a>
    <a class="btn alt" style="text-decoration:none;text-align:center;padding-top:12px" href="pulse.html?child=${S.kid.id}">${bi(u("parent_pulse_title"))}</a></div>
    <button class="btn alt" data-act="kids">${bi(u("switch_child"))}</button>`;
    show("s-home");
  }

  /* ---- gate screens: every step is a promise, so the flow below reads top to bottom ---- */
  const stepper = (cur) =>
    `<div style="display:flex;align-items:center"><ol class="steps" style="flex:1">${GATES.map((g) => `<li class="${g === cur ? "on" : S.sess.res[g] ? "done" : ""}">${bi(u("gate_" + g))}</li>`).join("")}</ol><button class="x" data-act="leave" aria-label="Leave">✕</button></div>`;
  const screen = (gate, html, bind) =>
    new Promise((res, rej) => {
      S.cancel = rej;
      $("#s-gate").innerHTML = stepper(gate) + html;
      show("s-gate");
      bind && bind(res);
    });
  const qCard = (q) =>
    `<div class="card q"><p class="big">${bi(q)}</p>${listen(q)}</div>`;
  const info = (gate, html) =>
    screen(
      gate,
      `${html}<button id="go" class="btn">${bi(u("next"))}</button>`,
      (r) => {
        $("#go").onclick = () => r();
      },
    );
  const cheer = (gate, extra = "") => (
    confetti(),
    info(
      gate,
      `<div class="card"><p class="win">🎉</p><p class="big center">${bi(u("well_done"))}</p>${extra}</div>`,
    )
  );
  const explainCard = (title, o) =>
    `<div class="card q"><h2 style="margin:0 0 6px;font-size:1.1rem">${bi(title)}</h2><p class="big">${bi(o)}</p>${listen(o)}</div>`;

  const askOpen = (gate, q, lc) =>
    screen(gate, "", (res) => {
      const voice = !!(
        W.startRecording &&
        W.stopRecording &&
        navigator.mediaDevices &&
        W.MediaRecorder
      );
      const draw = () => {
        $("#s-gate").innerHTML =
          stepper(gate) +
          qCard(q) +
          `<div class="card ans">${voice && navigator.onLine ? `<button id="mic" class="mic" aria-label="Speak">🎤<span>${bi(u("record"))}</span></button>` : `<p class="note">${bi(u(voice ? "voice_net" : "mic_blocked"))}</p>`}
      <div id="stat" class="stat" aria-live="polite"></div><textarea id="typed" rows="3" placeholder="${esc(u("type_here").ml)}"></textarea></div><button id="go" class="btn" disabled>${bi(u("done"))}</button>`;
        const stat = (m) => {
            $("#stat").innerHTML = m;
          },
          typed = $("#typed");
        let rec = false,
          t0 = 0;
        typed.oninput = () => {
          $("#go").disabled = !typed.value.trim();
        };
        $("#go").onclick = () =>
          res({ text: typed.value.trim(), input: "typed" });
        const mic = $("#mic");
        if (!mic) return;
        mic.onclick = async () => {
          if (!rec) {
            try {
              await W.startRecording();
            } catch (e) {
              stat(bi(u("mic_blocked")));
              return;
            }
            rec = true;
            t0 = Date.now();
            mic.classList.add("rec");
            S.tick = setInterval(() => {
              const s = Math.floor((Date.now() - t0) / 1000);
              stat(`${bi(u("listening"))} 0:${String(s).padStart(2, "0")}`);
              if (s >= 30) mic.click();
            }, 250);
          } else {
            rec = false;
            clearInterval(S.tick);
            mic.classList.remove("rec");
            stat(bi(u("processing")));
            let text = "";
            try {
              text = ((await W.stopRecording(lc)) || "").trim();
            } catch (e) {}
            if (!text) return stat(bi(u("no_speech")));
            $("#s-gate").innerHTML =
              stepper(gate) +
              qCard(q) +
              `<div class="card"><p class="quote">“${esc(text)}”</p><p class="note">${bi(u("readback_question"))}</p>${listen(u("readback_question"))}</div>
          <button id="yes" class="btn">${bi(u("yes"))}</button><button id="no" class="btn alt">${bi(u("no_again"))}</button>`;
            play(u("readback_question").audio);
            $("#yes").onclick = () => res({ text, input: "voice" });
            $("#no").onclick =
              draw; /* only a confirmed transcript becomes an answer */
          }
        };
      };
      draw();
      play(q.audio);
    });
  const askChoice = (gate, head, opts) =>
    screen(
      gate,
      `${qCard(head)}<div class="opts">${opts.map((o, i) => `<div class="opt"><button class="pick" data-i="${i}">${bi(o)}</button>${listen(o)}</div>`).join("")}</div><button id="go" class="btn" disabled>${bi(u("done"))}</button>`,
      (res) => {
        let sel = -1;
        $$(".pick").forEach(
          (b) =>
            (b.onclick = () => {
              sel = +b.dataset.i;
              $$(".pick").forEach((x) => x.classList.toggle("sel", x === b));
              $("#go").disabled = false;
            }),
        );
        $("#go").onclick = () => res(sel);
      },
    );

  /* ---- session ---- */
  function rec(gate, pass, x = {}) {
    if (!pass) navigator.vibrate?.(60);
    ev.save(
      S.kid.id,
      Object.assign(
        {
          concept: S.sess.c.id,
          gate,
          result: pass ? "pass" : "fail",
          confidence: "high",
          source: navigator.onLine ? "online" : "offline",
          ts: Date.now(),
        },
        x,
      ),
    );
    S.sess.res[gate] = pass ? "pass" : "fail";
    if (x.confidence === "low" || !navigator.onLine) S.sess.low = true;
  }
  async function classify(c, text, labels) {
    if (!W.classifyAnswer || !navigator.onLine) return null;
    $("#s-gate").innerHTML =
      stepper("understand") +
      `<div class="card think"><i></i><i></i><i></i><p>${bi(u("thinking"))}</p></div>`;
    try {
      const r = await Promise.race([
        W.classifyAnswer(c.id, text, labels, c.correct_description_en),
        new Promise((_, j) => setTimeout(j, 15000)),
      ]);
      const ok = new Set([
        "correct",
        "unclear",
        "other",
        ...labels.map((m) => m.id),
      ]);
      return r && ok.has(r.label)
        ? r
        : { label: "unclear", confidence: 0, needs_followup: true };
    } catch (e) {
      return null;
    } /* null = AI unavailable, so fall back to guided choice */
  }
  const needMore = (r) =>
    r.needs_followup || r.label === "unclear" || (r.confidence ?? 0) < 0.6;
  async function runUnderstand(c) {
    const Un = c.understand,
      labels = S.pack.misconceptions.filter((m) => m.concept === c.id),
      off = !navigator.onLine;
    const a = await askOpen("understand", Un.question, "ml-IN");
    let res = await classify(c, a.text, labels),
      input = a.input,
      conf = "high";
    if (res && needMore(res)) {
      const b = await askOpen("understand", Un.followup, "ml-IN");
      res = await classify(c, a.text + " " + b.text, labels);
    }
    if (!res || needMore(res)) {
      /* offline, or still unsure: the child picks the closest sentence, which counts as lower-confidence */
      const i = await askChoice(
        "understand",
        u("choose_closest"),
        Un.choices.map((x) => x.text),
      );
      res = { label: Un.choices[i].misconception };
      conf = "low";
      input = "choice";
    }
    const pass = res.label === "correct",
      mis = ["correct", "unclear"].includes(res.label) ? undefined : res.label;
    rec("understand", pass, {
      confidence: conf,
      source: off ? "offline" : "online",
      misconception: mis,
      input,
    });
    if (pass) return cheer("understand");
    const m = S.pack.misconceptions.find((x) => x.id === res.label),
      right = Un.choices.find((x) => x.misconception === "correct").text;
    await info(
      "understand",
      m
        ? explainCard(u("explain_title"), m.explanation)
        : explainCard(u("right_idea"), right),
    );
    const i = await askChoice(
      "understand",
      u("check_again"),
      Un.choices
        .filter((x) => x.misconception !== "unclear")
        .map((x) => x.text),
    );
    const picked = Un.choices.filter((x) => x.misconception !== "unclear")[i];
    rec("understand", picked.misconception === "correct", {
      confidence: "low",
      input: "choice",
    }); /* recheck replaces the session result */
  }
  const missing = (req, txt) => {
    const t = txt.toLowerCase();
    return req.filter((r) => !r.split("|").some((a) => t.includes(a.trim())));
  };
  const termPair = (c, r) => {
    for (const a of r.split("|")) {
      const v = c.express.vocab_bridge.find((x) =>
        x.en.toLowerCase().includes(a.trim()),
      );
      if (v) return v;
    }
    return { en: r.split("|")[0], ml: "" };
  };
  async function runExpress(c) {
    const E = c.express;
    for (let tries = 1; tries <= 2; tries++) {
      const a = await askOpen("express", E.question, "en-IN"),
        miss = missing(E.required_terms, a.text),
        pass = !miss.length;
      rec("express", pass, { input: a.input });
      const model = `<div class="card"><p class="note">${bi(u("model_answer"))}</p><p class="big">${esc(E.model_answer.en)}</p></div>`;
      if (pass) return cheer("express", model);
      if (tries === 2) return info("express", model);
      await info(
        "express",
        `<div class="card"><p class="big">${bi(u("almost"))}</p><p class="note">${bi(u("missing_words"))}</p><div class="chips">${miss
          .map((r) => {
            const p = termPair(c, r);
            return `<span>${esc(p.en)}${p.ml ? " · " + esc(p.ml) : ""}</span>`;
          })
          .join("")}</div></div>`,
      );
      await info(
        "express",
        `<h1>${bi(u("vocab_bridge_title"))}</h1><div class="pairs">${E.vocab_bridge.map((v) => `<div class="card"><b lang="ml">${esc(v.ml)}</b><b lang="en">${esc(v.en)}</b>${listen(v)}</div>`).join("")}</div>`,
      );
    }
  }
  async function runApply(c) {
    const A = c.apply,
      i = await askChoice(
        "apply",
        A.scenario,
        A.choices.map((x) => x.text),
      ),
      ch = A.choices[i];
    rec("apply", !!ch.correct, {
      misconception: ch.correct ? undefined : ch.misconception,
      input: "choice",
    });
    if (ch.correct) return cheer("apply");
    const m = S.pack.misconceptions.find((x) => x.id === ch.misconception);
    await info(
      "apply",
      m
        ? explainCard(u("explain_title"), m.explanation)
        : explainCard(u("right_idea"), A.choices.find((x) => x.correct).text),
    );
  }
  async function startSession(cid) {
    const c = S.pack.concepts.find((x) => x.id === cid);
    S.sess = { c, res: {}, low: false };
    try {
      await runUnderstand(c);
      await runExpress(c);
      await runApply(c);
      viewEnd();
    } catch (e) {
      if (e !== ABORT) {
        console.error(e);
        toast("Something went wrong");
        viewHome();
      }
    }
  }
  function viewEnd() {
    const c = S.sess.c,
      e = ev.load(S.kid.id),
      na = nextAct(e, c.id),
      icon = { pass: "✅", fail: "🔁" };
    $("#s-end").innerHTML =
      `<p class="win">🌼</p><h1 class="center">${bi(u("session_done"))}</h1>
    <div class="card"><b>${bi(u("today"))}</b><ul class="sum">${GATES.map((g) => `<li><span>${bi(u("gate_" + g))}</span><span>${icon[S.sess.res[g]] || "–"}</span></li>`).join("")}</ul>${S.sess.low ? `<p class="note" style="margin-top:8px">${bi(u("low_note"))}</p>` : ""}</div>
    <div class="card"><b>${bi(u("your_next_15"))}</b><p class="big"><span class="ml" lang="ml">${esc(NEXT_ML[na.gate])}</span><span class="en" lang="en">${esc(na.text)}</span></p></div>
    <a class="btn gold" style="text-decoration:none;text-align:center;padding-top:12px" href="passport.html?child=${S.kid.id}&amp;concept=${c.id}">${bi(u("see_passport"))}</a>
    <button class="btn alt" data-act="home">${bi(u("home"))}</button>`;
    show("s-end");
  }

  /* ---- settings, offline status, install ---- */
  function viewSettings() {
    const s = S.sw,
      st = s ? `${s.core}/${s.coreTotal} · 🔊 ${s.audio}/${s.audioTotal}` : "…",
      ready = s && s.core === s.coreTotal;
    modal(`<h1>${bi(u("settings"))}</h1><div class="card"><b>${bi(u("offline_ready"))}</b> ${ready ? "✓" : ""}<p class="note">${st}</p></div>
    ${S.install ? `<button class="btn" data-m="inst">${bi(u("install_app"))}</button>` : ""}
    <a class="btn alt" href="digest.html" style="text-decoration:none;text-align:center;padding-top:14px">${bi({ ml: "അധ്യാപക ഡൈജസ്റ്റ്", en: "Teacher Digest" })}</a>
    <button class="btn alt" data-m="reset">${bi(u("reset_all"))}</button><button class="btn alt" data-m="close">${bi(u("ok"))}</button>`);
    navigator.serviceWorker?.controller?.postMessage({ type: "STATUS" });
    $("[data-m=close]").onclick = closeModal;
    $("[data-m=reset]").onclick = () =>
      confirmBox(u("reset_all"), u("sure"), u("erase"), () => {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("bb_"))
          .forEach((k) => localStorage.removeItem(k));
        S.kids = [];
        viewKids();
      });
    const i = $("[data-m=inst]");
    if (i)
      i.onclick = async () => {
        S.install.prompt();
        await S.install.userChoice;
        S.install = null;
        closeModal();
      };
  }

  /* ---- events ---- */
  const acts = {
    add: viewCreate,
    kids: viewKids,
    home: viewHome,
    leave: () =>
      confirmBox(u("leave_title"), u("leave_text"), u("leave"), () => {
        S.cancel?.(ABORT);
        viewHome();
      }),
  };
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.lang) setLang(t.dataset.lang);
    else if (t.id === "gear") viewSettings();
    else if (t.classList.contains("listen")) speak(t.dataset.audio, t.dataset.text);
    else if (t.dataset.kid) viewPin(S.kids.find((k) => k.id === t.dataset.kid));
    else if (t.dataset.go) startSession(t.dataset.go);
    else if (t.dataset.act) acts[t.dataset.act]?.();
  });
  $("#modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });
  addEventListener("online", netChip);
  addEventListener("offline", netChip);
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    S.install = e;
  });
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
    navigator.serviceWorker.addEventListener("message", (e) => {
      if (e.data?.type === "STATUS") {
        S.sw = e.data;
        if (!$("#modal").hidden && $("[data-m=close]")) viewSettings();
      }
    });
  }

  addEventListener("popstate", () => {
    history.pushState({}, "");
    if (!$("#modal").hidden) closeModal();
    else if (S.sess && !$("#s-gate").hidden) acts.leave();
    else if (S.kid && !$("#s-home").hidden) viewKids();
    else if (S.kid) viewHome();
  });

  /* ---- boot ---- */
  (async function boot() {
    setLang(localStorage.getItem("bb_lang") || "ml");
    netChip();
    try {
      S.kids = JSON.parse(localStorage.getItem("bb_children") || "[]");
    } catch (e) {
      S.kids = [];
    }
    try {
      S.pack = await (await fetch("pack.json")).json();
    } catch (e) {
      $("#s-error").innerHTML =
        `<h1>${bi(u("load_error"))}</h1><button class="btn" onclick="location.reload()">${bi(u("try_again"))}</button>`;
      return show("s-error");
    }
    W.BB = { S, ev };
    history.pushState({}, ""); /* handy for the console and for teammates */
    viewKids();
  })();
})();
