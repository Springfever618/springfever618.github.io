// 网页编辑模块（10-25）：只有存了 GitHub 令牌的浏览器能编辑，访客看不到任何编辑入口。
// 用法：打开 网址#edit 登录一次；之后右下角出现“编辑”。每次保存＝仓库里一条提交记录。
// 图片上传到仓库 assets/uploads/，不存本机。
(() => {
  const OWNER = "Springfever618", REPO = "springfever618.github.io", BRANCH = "main";
  const KEY = "site-editor-token";
  const EN = document.documentElement.lang === "en";
  const T = EN
    ? { edit: "Edit", save: "Save", cancel: "Cancel", history: "History", logout: "Log out", add: "+ Add", addImg: "+ Add image", addPhoto: "+ Add your photo", del: "Delete",
        login: "Paste your GitHub token (only needed once in this browser):", bad: "Token cannot write to the site repository.", saving: "Saving…",
        saved: "Saved. GitHub updates the live page in 1–2 minutes.", fail: "Save failed: ", upl: "Uploading image…", link: "Link address:", sure: "Delete this item?",
        translated: "This page is being translated by the browser. Show the original first, then save. Nothing was saved.", parent: "Select parent", reset: "Reset position & size", w4: "4 per row", w3: "3 per row", w2: "2 per row", w1: "Full width", below: "Text below images", side: "Text beside images", tip: "Long-press the middle of any block to drag it; drag its edges or corners to resize." }
    : { edit: "编辑", save: "保存", cancel: "取消", history: "修改记录", logout: "退出登录", add: "＋ 添加", addImg: "＋ 添加图片", addPhoto: "＋ 添加个人照片", del: "删除",
        login: "粘贴你的 GitHub 令牌（这台浏览器只需要一次）：", bad: "这个令牌没有写入网站仓库的权限。", saving: "保存中……",
        saved: "已保存。GitHub 一两分钟后更新线上页面。", fail: "保存失败：", upl: "图片上传中……", link: "链接地址：", sure: "删除这一条？",
        translated: "页面正处于浏览器翻译状态，请先切回显示原文再保存。这次没有保存。", parent: "选上一层", reset: "复位", w4: "一行4张", w3: "一行3张", w2: "一行2张", w1: "整行", below: "文字放图下面", side: "文字放图右边", tip: "长按任意板块中间可以拖动位置；拖它的边和角可以改大小。" };
  const PAGE = location.pathname.endsWith("en.html") ? "en.html" : "index.html";
  const LOCAL_TEST = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && location.search.includes("edtest");
  const token = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };

  const api = async (path, opt = {}) => {
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, {
      ...opt, headers: { Authorization: `Bearer ${token()}`, Accept: "application/vnd.github+json", ...(opt.headers || {}) } });
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
    return r.json();
  };
  const b64 = s => btoa(unescape(encodeURIComponent(s)));
  const putFile = async (path, content64, message) => {
    let sha;
    try { sha = (await api(`/contents/${encodeURI(path)}?ref=${BRANCH}`)).sha; } catch (e) { /* 新文件 */ }
    return api(`/contents/${encodeURI(path)}`, { method: "PUT", body: JSON.stringify({ message, content: content64, branch: BRANCH, ...(sha ? { sha } : {}) }) });
  };

  const css = document.createElement("style");
  css.dataset.editorUi = "";
  css.textContent = `
  .ed-bar{position:fixed;right:16px;bottom:16px;z-index:50;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
  .ed-bar button,.ed-btn{font:13px/1 var(--sans);padding:8px 12px;border-radius:99px;border:1px solid var(--line);background:var(--surface);color:var(--text);cursor:pointer}
  .ed-bar .pri{background:var(--accent);color:#fff;border-color:var(--accent)}
  .ed-msg{position:fixed;left:50%;bottom:70px;transform:translateX(-50%);z-index:50;background:var(--text);color:var(--bg);padding:8px 14px;border-radius:8px;font-size:14px}
  .ed-on [contenteditable]{outline:1px dashed color-mix(in srgb,var(--accent) 50%,transparent);outline-offset:2px;border-radius:2px}
  .ed-on [contenteditable]:focus{outline:2px solid var(--accent)}
  .ed-on .list>li,.ed-on .card,.ed-on .work{position:relative}
  .ed-on .list>li{padding-right:60px}.ed-on .card,.ed-on .work{padding-top:36px}
  .ed-del{position:absolute;top:6px;right:6px;font-size:12px;padding:3px 8px;border-radius:99px;border:1px solid #c0392b;background:var(--surface);color:#c0392b;cursor:pointer;z-index:2}
  .ed-add{margin:8px 0 16px}
  .ed-on img{cursor:pointer}
  .ed-slot{display:flex;align-items:center;justify-content:center;width:100%;min-height:120px;margin:0 0 12px;border:2px dashed var(--accent);border-radius:8px;background:var(--accent-soft);color:var(--accent);font:600 14px/1.4 var(--sans);cursor:pointer}
  .work-imgs .ed-slot{min-height:0;aspect-ratio:1/1;margin:0;grid-column:span 3}
  .ed-on .avatar:empty,.ed-on .avatar{display:block}.avatar .ed-slot{min-height:0;aspect-ratio:4/5;margin:0}
  .ed-on main img:hover{outline:3px solid var(--accent);outline-offset:-3px}
  .ed-frame{position:fixed;z-index:40;pointer-events:none;outline:1.5px dashed var(--accent);outline-offset:2px}
  .ed-frame>i{position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;background:var(--surface);border:2px solid var(--accent);border-radius:3px;pointer-events:auto}
  .ed-frame>i[data-d=nw]{left:0;top:0;cursor:nwse-resize}.ed-frame>i[data-d=n]{left:50%;top:0;cursor:ns-resize}.ed-frame>i[data-d=ne]{left:100%;top:0;cursor:nesw-resize}
  .ed-frame>i[data-d=e]{left:100%;top:50%;cursor:ew-resize}.ed-frame>i[data-d=se]{left:100%;top:100%;cursor:nwse-resize}.ed-frame>i[data-d=s]{left:50%;top:100%;cursor:ns-resize}
  .ed-frame>i[data-d=sw]{left:0;top:100%;cursor:nesw-resize}.ed-frame>i[data-d=w]{left:0;top:50%;cursor:ew-resize}
  .ed-ftools{position:absolute;right:0;bottom:100%;margin-bottom:8px;display:flex;gap:6px;pointer-events:auto;white-space:nowrap}
  .ed-ftools .ed-btn{padding:4px 10px;font-size:12px}.ed-ftools .ed-btn.on{background:var(--accent);color:#fff;border-color:var(--accent)}
  .ed-sorting{opacity:.4}
  .ed-over{outline:3px solid var(--accent)!important;outline-offset:2px;background:var(--accent-soft)}
  .ed-drag,.ed-drag *{user-select:none!important;cursor:grabbing!important}`;

  let editing = false;
  const EDITABLE = "main h1, main h2, main h3, main p, main figcaption, main .tags li, main .status, main .list li > time, main .list li > div";
  const ITEMS = "main .list > li, main .cards > .card, main .work";

  const msg = (t, ms = 3500) => {
    document.querySelectorAll(".ed-msg").forEach(e => e.remove());
    const m = Object.assign(document.createElement("div"), { className: "ed-msg", textContent: t });
    m.dataset.editorUi = ""; document.body.append(m); if (ms) setTimeout(() => m.remove(), ms);
  };
  const btn = (label, fn, cls = "ed-btn") => {
    const b = Object.assign(document.createElement("button"), { type: "button", className: cls, textContent: label });
    b.dataset.editorUi = ""; b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); fn(e); }); return b;
  };

  const compress = file => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      // PNG、WebP、GIF 可能有透明底，保留 PNG；转成 JPG 透明部分会变黑
      res(c.toDataURL(/png|webp|gif/.test(file.type) ? "image/png" : "image/jpeg", 0.85));
    };
    img.onerror = rej; img.src = URL.createObjectURL(file);
  });
  const pickImages = (multiple = false) => new Promise(res => {
    const f = Object.assign(document.createElement("input"), { type: "file", accept: "image/*", multiple });
    f.onchange = () => res([...f.files]); f.click();
  });
  const uploadInto = async (img, file) => {
    if (!file) [file] = await pickImages(); if (!file) return;
    const data = await compress(file);
    img.src = data;
    const name = file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").slice(0, 40) || "img";
    const path = `assets/uploads/${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}-${name}.${data.startsWith("data:image/png") ? "png" : "jpg"}`;
    img.dataset.edSrc = path;
    if (!img.alt) img.alt = file.name;
    if (LOCAL_TEST) { msg("（本机测试，未上传）" + path); return; }
    msg(T.upl, 0);
    try { await putFile(path, data.split(",")[1], `上传图片 ${path}`); msg("✓ " + path); }
    catch (e) { msg(T.fail + e.message, 8000); }
  };

  // 往作品图框里加一张或多张图，按顺序逐张上传
  const addImgs = async (box, files) => {
    for (const file of files) {
      const img = Object.assign(document.createElement("img"), { loading: "lazy", alt: "" });
      (box.querySelector(".ed-slot") ? box.querySelector(".ed-slot").before(img) : box.append(img));
      await uploadInto(img, file); if (!img.getAttribute("src")) img.remove();
    }
  };
  // 从访达拖图片进来：拖到图片上＝换图，拖到作品图框或“添加图片”框里＝加图（可多张）
  const dropTarget = el => el?.closest?.("main .work-imgs, main .avatar, main .cards > .card, main img");
  let overEl = null;
  const over = el => { if (overEl === el) return; overEl?.classList.remove("ed-over"); overEl = el; el?.classList.add("ed-over"); };
  document.addEventListener("dragover", e => {
    if (!editing || !e.dataTransfer?.types.includes("Files")) return;
    e.preventDefault(); const t = dropTarget(e.target); e.dataTransfer.dropEffect = t ? "copy" : "none"; over(t);
  });
  document.addEventListener("dragleave", e => { if (!e.relatedTarget) over(null); });
  document.addEventListener("drop", async e => {
    if (!editing || !e.dataTransfer?.files.length) return;
    e.preventDefault(); const t = dropTarget(e.target); over(null); if (!t) return;
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith("image/")); if (!files.length) return;
    const box = t.closest(".work-imgs");
    if (t.tagName === "IMG" && !t.closest("#retro")) { await uploadInto(t, files.shift()); if (box) await addImgs(box, files); return; }
    if (box) return addImgs(box, files);
    const slot = t.querySelector(".ed-slot"); if (!slot) return;
    const img = Object.assign(document.createElement("img"), { alt: t.matches(".avatar") ? document.querySelector("h1")?.firstChild?.textContent.trim() || "" : "" });
    if (t.matches(".card")) img.className = "card-img";
    slot.replaceWith(img); await uploadInto(img, files[0]); if (!img.getAttribute("src")) { img.remove(); undecorate(); decorate(); }
  });

  const decorate = () => {
    document.querySelectorAll(EDITABLE).forEach(el => { if (!el.closest("#retro, .ed-bar")) { el.contentEditable = "true"; el.spellcheck = false; } });
    document.querySelectorAll(ITEMS).forEach(it => it.append(btn(T.del, () => { if (confirm(T.sure)) it.remove(); }, "ed-del")));
    document.querySelectorAll("main ol.list, main .cards").forEach(box => box.after(btn(T.add, () => {
      const first = box.firstElementChild; if (!first) return;
      const c = first.cloneNode(true);
      c.querySelectorAll("[data-editor-ui]").forEach(e => e.remove());
      box.prepend(c); undecorate(); decorate();
      c.querySelector("[contenteditable]")?.focus(); c.scrollIntoView({ block: "center" });
    }, "ed-btn ed-add")));
    document.querySelectorAll("main .work").forEach((w, i, all) => { if (i === all.length - 1) w.after(btn(T.add, () => {
      const c = w.cloneNode(true); c.querySelectorAll("[data-editor-ui]").forEach(e => e.remove());
      w.before(c); undecorate(); decorate(); c.scrollIntoView({ block: "center" });
    }, "ed-btn ed-add")); });
    document.querySelectorAll("main .work-imgs").forEach(box => box.append(btn(T.addImg, async () => addImgs(box, await pickImages(true)), "ed-slot")));
    document.querySelectorAll("main .avatar").forEach(box => { if (!box.querySelector("img")) box.append(btn(T.addPhoto, async () => {
      const img = Object.assign(document.createElement("img"), { alt: document.querySelector("h1")?.firstChild?.textContent.trim() || "" }); box.prepend(img); box.querySelector("[data-editor-ui]")?.remove();
      await uploadInto(img); if (!img.getAttribute("src")) { img.remove(); undecorate(); decorate(); }
    }, "ed-slot")); });
    document.querySelectorAll("main .cards > .card").forEach(card => { if (!card.querySelector("img")) card.prepend(btn(T.addImg, async () => {
      const img = Object.assign(document.createElement("img"), { className: "card-img", loading: "lazy", alt: "" }); card.prepend(img); await uploadInto(img);
    }, "ed-slot")); });
  };
  const undecorate = () => {
    document.querySelectorAll("main [data-editor-ui]").forEach(e => e.remove());
    document.querySelectorAll("main ~ [data-editor-ui]:not(.ed-bar, .ed-frame, .ed-msg)").forEach(e => e.remove());
    document.querySelectorAll("[contenteditable]").forEach(e => { e.removeAttribute("contenteditable"); e.removeAttribute("spellcheck"); });
  };

  document.addEventListener("click", e => {
    if (!editing) return;
    if (Date.now() < quietUntil) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    const img = e.target.closest("main img"); if (img && !img.closest("#retro")) { e.preventDefault(); uploadInto(img); return; }
    const a = e.target.closest("main a");
    if (a && (e.metaKey || e.ctrlKey || e.altKey)) { e.preventDefault(); const u = prompt(T.link, a.getAttribute("href")); if (u !== null) a.setAttribute("href", u); }
    else if (a) e.preventDefault();
  }, true);

  // 保存时只替换原文件里 <main>…</main> 这一段；页面其余部分（head、页眉页脚）沿用仓库原文，
  // 这样浏览器插件往页面里塞的样式和元素不会被存进网站。
  // —— 自由摆放（10-30）：长按板块中间拖动位置，拖边和角改宽高。
  // 数值存成行内样式 --fx/--fy/--fw/--fh，由 style.css 在宽屏上生效；手机上自动回到原来的版式。
  const FREE = "main section > :not(h2), main article > *, main .cards > .card, main .list > li, main .tags > li, main img, main figcaption";
  const VARS = ["--fx", "--fy", "--fw", "--fh"];
  const pickFree = el => { const f = el?.closest?.(FREE); return f && !f.closest("#retro, [data-editor-ui]") ? f : null; };
  const num = (el, k) => parseFloat(el.style.getPropertyValue(k)) || 0;
  const setV = (el, k, v) => el.style.setProperty(k, Math.round(v) + "px");
  const frame = document.createElement("div"); frame.className = "ed-frame"; frame.dataset.editorUi = ""; frame.hidden = true;
  ["nw", "n", "ne", "e", "se", "s", "sw", "w"].forEach(d => { const h = document.createElement("i"); h.dataset.d = d; frame.append(h); });
  let cur = null, op = null, press = null, quietUntil = 0;
  const place = () => {
    if (!cur || !editing || !cur.isConnected || innerWidth <= 720) { frame.hidden = true; return; }
    const r = cur.getBoundingClientRect();
    Object.assign(frame.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" }); frame.hidden = false;
  };
  const clearFree = el => { VARS.forEach(k => el.style.removeProperty(k)); if (!el.getAttribute("style")) el.removeAttribute("style"); };
  // 框上方的按钮随选中的东西变：作品图可设一行几张，整个作品可切换文字在右边还是下面
  const tools = document.createElement("div"); tools.className = "ed-ftools";
  const setTools = el => {
    tools.replaceChildren(btn(T.parent, () => { const p = cur && pickFree(cur.parentElement); if (p) show(p); }),
      btn(T.reset, () => { if (!cur) return; clearFree(cur); delete cur.dataset.span; setTools(cur); place(); }));
    if (el.matches(".work-imgs > img")) [["3", T.w4], ["4", T.w3], ["6", T.w2], ["12", T.w1]].forEach(([n, l]) =>
      tools.append(btn(l, () => { el.dataset.span = n; clearFree(el); setTools(el); place(); }, "ed-btn" + ((el.dataset.span || "6") === n ? " on" : ""))));
    if (el.matches(".work")) tools.append(btn(el.classList.contains("stack") ? T.side : T.below, () => { el.classList.toggle("stack"); if (!el.className.trim()) el.removeAttribute("class"); setTools(el); place(); }));
  };
  const show = el => { if (cur !== el) setTools(el); cur = el; place(); };
  frame.append(tools);
  // 这几类东西长按拖动时是调换先后顺序（真正改排版），其余的才是自由挪位置
  const SORT = ["main .work-imgs > img", "main ol.list > li", "main .cards > .card", "main section > .work", "main .tags > li"];
  const kindOf = el => SORT.find(s => el.matches(s));

  document.addEventListener("pointermove", e => {
    if (!editing) return;
    if (press && !op && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 6) { clearTimeout(press.t); press = null; }
    if (op) {
      e.preventDefault();
      const dx = e.clientX - op.x, dy = e.clientY - op.y, el = op.el;
      if (op.d === "sort") {
        for (const n of document.elementsFromPoint(e.clientX, e.clientY)) {
          const s = [...el.parentElement.children].find(c => c !== el && c.contains(n) && c.matches(op.kind)); if (!s) continue;
          const r = s.getBoundingClientRect(), row = r.width < el.parentElement.clientWidth * 0.9;
          const after = row ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2;
          el.parentElement.insertBefore(el, after ? s.nextSibling : s); break;
        }
      }
      else if (op.d === "move") { setV(el, "--fx", op.fx + dx); setV(el, "--fy", op.fy + dy); }
      else {
        if (op.d.includes("e")) setV(el, "--fw", Math.max(20, op.w + dx));
        if (op.d.includes("w")) { setV(el, "--fw", Math.max(20, op.w - dx)); setV(el, "--fx", op.fx + Math.min(dx, op.w - 20)); }
        if (op.d.includes("s")) setV(el, "--fh", Math.max(20, op.h + dy));
        if (op.d.includes("n")) { setV(el, "--fh", Math.max(20, op.h - dy)); setV(el, "--fy", op.fy + Math.min(dy, op.h - 20)); }
      }
      place(); return;
    }
    if (e.target.closest?.(".ed-frame")) return;
    const f = pickFree(e.target); if (f && f !== cur) show(f);
  });
  document.addEventListener("pointerdown", e => {
    if (!editing || e.button !== 0 || innerWidth <= 720) return;
    const d = e.target.dataset?.d;
    if (d && e.target.parentElement === frame && cur) {
      e.preventDefault(); const r = cur.getBoundingClientRect();
      op = { d, el: cur, x: e.clientX, y: e.clientY, fx: num(cur, "--fx"), fy: num(cur, "--fy"), w: r.width, h: r.height }; return;
    }
    const el = pickFree(e.target); if (!el) return;
    press = { x: e.clientX, y: e.clientY, t: setTimeout(() => {
      const kind = kindOf(el);
      op = { d: kind ? "sort" : "move", kind, el, x: press.x, y: press.y, fx: num(el, "--fx"), fy: num(el, "--fy") }; press = null;
      if (kind) { clearFree(el); el.classList.add("ed-sorting"); }
      show(el); getSelection().removeAllRanges(); document.body.classList.add("ed-drag");
    }, 350) };
  }, true);
  const endOp = () => {
    if (press) { clearTimeout(press.t); press = null; }
    if (op) { op.el.classList.remove("ed-sorting"); if (!op.el.className.trim()) op.el.removeAttribute("class"); op = null; quietUntil = Date.now() + 300; document.body.classList.remove("ed-drag"); place(); }
  };
  document.addEventListener("pointerup", endOp); document.addEventListener("pointercancel", endOp);
  document.addEventListener("dragstart", e => { if (editing) e.preventDefault(); });
  addEventListener("scroll", place, true); addEventListener("resize", place);

  const serializeMain = () => {
    const root = document.querySelector("main").cloneNode(true);
    root.querySelectorAll("[data-editor-ui], [data-runtime]").forEach(e => e.remove());
    root.querySelectorAll("[contenteditable]").forEach(e => { e.removeAttribute("contenteditable"); e.removeAttribute("spellcheck"); });
    root.querySelectorAll(".easyScholarDOI").forEach(e => e.remove()); // 浏览器插件塞进页面的东西
    root.querySelectorAll("[data-sg-checked]").forEach(e => e.removeAttribute("data-sg-checked"));
    root.querySelectorAll("img[data-ed-src]").forEach(i => { i.setAttribute("src", i.dataset.edSrc); i.removeAttribute("data-ed-src"); });
    root.querySelectorAll("[style=\"\"]").forEach(e => e.removeAttribute("style"));
    const r = root.querySelector("#retro"); if (r) r.innerHTML = "";
    return root.outerHTML;
  };
  // 浏览器翻译会直接改页面文字，这时保存会把译文存进网站
  const isTranslated = () => {
    const root = document.documentElement, lang = root.lang.toLowerCase();
    return root.classList.contains("translated-ltr") || root.classList.contains("translated-rtl")
      || !lang.startsWith(PAGE === "en.html" ? "en" : "zh") || !!document.querySelector("main font");
  };
  const serialize = async () => {
    const src = LOCAL_TEST ? await (await fetch(location.pathname, { cache: "no-store" })).text()
      : decodeURIComponent(escape(atob((await api(`/contents/${PAGE}?ref=${BRANCH}`)).content.replace(/\s/g, ""))));
    const a = src.indexOf("<main"), b = src.indexOf("</main>");
    if (a < 0 || b < 0) throw new Error("main not found");
    return src.slice(0, a) + serializeMain() + src.slice(b + 7);
  };
  window.__siteEditorSerialize = serialize;

  const bar = document.createElement("div"); bar.className = "ed-bar"; bar.dataset.editorUi = "";
  const render = () => {
    bar.replaceChildren();
    if (!editing) {
      bar.append(btn(T.edit, () => { editing = true; document.body.classList.add("ed-on"); decorate(); render(); if (innerWidth > 720) msg(T.tip, 6000); }, "pri"));
    } else {
      bar.append(
        btn(T.save, async () => {
          if (isTranslated()) { msg(T.translated, 8000); return; }
          msg(T.saving, 0);
          try {
            const html = await serialize();
            if (LOCAL_TEST) { console.log(html); msg("（本机测试）" + html.length + " chars"); return; }
            const when = new Date().toLocaleString("zh-CN", { hour12: false });
            await putFile(PAGE, b64(html), `网页编辑 ${PAGE} ${when}`);
            editing = false; document.body.classList.remove("ed-on"); undecorate(); place(); render(); msg(T.saved, 6000);
          } catch (e) { msg(T.fail + e.message, 8000); }
        }, "pri"),
        btn(T.cancel, () => location.reload()),
        btn(T.history, () => window.open(`https://github.com/${OWNER}/${REPO}/commits/${BRANCH}`, "_blank")),
        btn(T.logout, () => { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); }));
    }
  };
  const start = () => { document.head.append(css); document.body.append(bar, frame); render(); };

  if (LOCAL_TEST) { start(); return; }
  if (token()) { start(); return; }
  if (location.hash === "#edit") {
    const t = prompt(T.login + "\nhttps://github.com/settings/personal-access-tokens/new");
    if (!t) return;
    try { localStorage.setItem(KEY, t.trim()); } catch (e) { alert(e.message); return; }
    api("").then(r => { if (r.permissions?.push) { history.replaceState(null, "", location.pathname); start(); } else throw new Error(); })
      .catch(() => { try { localStorage.removeItem(KEY); } catch (e) {} alert(T.bad); });
  }
})();
