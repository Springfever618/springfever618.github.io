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
        saved: "Saved. GitHub updates the live page in 1–2 minutes.", fail: "Save failed: ", upl: "Uploading image…", link: "Link address:", sure: "Delete this item?" }
    : { edit: "编辑", save: "保存", cancel: "取消", history: "修改记录", logout: "退出登录", add: "＋ 添加", addImg: "＋ 添加图片", addPhoto: "＋ 添加个人照片", del: "删除",
        login: "粘贴你的 GitHub 令牌（这台浏览器只需要一次）：", bad: "这个令牌没有写入网站仓库的权限。", saving: "保存中……",
        saved: "已保存。GitHub 一两分钟后更新线上页面。", fail: "保存失败：", upl: "图片上传中……", link: "链接地址：", sure: "删除这一条？" };
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
  .work-imgs .ed-slot{min-height:0;aspect-ratio:1/1;margin:0}
  .ed-on .avatar:empty,.ed-on .avatar{display:block}.avatar .ed-slot{min-height:0;aspect-ratio:4/5;margin:0}
  .ed-on main img:hover{outline:3px solid var(--accent);outline-offset:-3px}`;

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
      res(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = rej; img.src = URL.createObjectURL(file);
  });
  const pickImage = () => new Promise(res => {
    const f = Object.assign(document.createElement("input"), { type: "file", accept: "image/*" });
    f.onchange = () => res(f.files[0]); f.click();
  });
  const uploadInto = async img => {
    const file = await pickImage(); if (!file) return;
    const data = await compress(file);
    img.src = data;
    const name = file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").slice(0, 40) || "img";
    const path = `assets/uploads/${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}-${name}.jpg`;
    img.dataset.edSrc = path;
    if (!img.alt) img.alt = file.name;
    if (LOCAL_TEST) { msg("（本机测试，未上传）" + path); return; }
    msg(T.upl, 0);
    try { await putFile(path, data.split(",")[1], `上传图片 ${path}`); msg("✓ " + path); }
    catch (e) { msg(T.fail + e.message, 8000); }
  };

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
    document.querySelectorAll("main .work-imgs").forEach(box => box.append(btn(T.addImg, async () => {
      const img = Object.assign(document.createElement("img"), { loading: "lazy", alt: "" }); box.querySelector("[data-editor-ui]").before(img); await uploadInto(img);
    }, "ed-slot")));
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
    document.querySelectorAll("main ~ [data-editor-ui], main + [data-editor-ui]").forEach(e => e.remove());
    document.querySelectorAll("[contenteditable]").forEach(e => { e.removeAttribute("contenteditable"); e.removeAttribute("spellcheck"); });
  };

  document.addEventListener("click", e => {
    if (!editing) return;
    const img = e.target.closest("main img"); if (img && !img.closest("#retro")) { e.preventDefault(); uploadInto(img); return; }
    const a = e.target.closest("main a");
    if (a && (e.metaKey || e.ctrlKey || e.altKey)) { e.preventDefault(); const u = prompt(T.link, a.getAttribute("href")); if (u !== null) a.setAttribute("href", u); }
    else if (a) e.preventDefault();
  }, true);

  const serialize = () => {
    const root = document.documentElement.cloneNode(true);
    root.removeAttribute("data-theme");
    root.querySelectorAll("[data-editor-ui], [data-runtime]").forEach(e => e.remove());
    root.querySelectorAll("nav a.active").forEach(e => { e.classList.remove("active"); if (!e.className) e.removeAttribute("class"); });
    root.querySelectorAll("[contenteditable]").forEach(e => { e.removeAttribute("contenteditable"); e.removeAttribute("spellcheck"); });
    root.querySelectorAll("img[data-ed-src]").forEach(i => { i.setAttribute("src", i.dataset.edSrc); i.removeAttribute("data-ed-src"); });
    root.querySelector("body")?.classList.remove("ed-on");
    if (root.querySelector("body")?.getAttribute("class") === "") root.querySelector("body").removeAttribute("class");
    const r = root.querySelector("#retro"); if (r) r.innerHTML = "";
    return "<!doctype html>\n" + root.outerHTML + "\n";
  };
  window.__siteEditorSerialize = serialize;

  const bar = document.createElement("div"); bar.className = "ed-bar"; bar.dataset.editorUi = "";
  const render = () => {
    bar.replaceChildren();
    if (!editing) {
      bar.append(btn(T.edit, () => { editing = true; document.body.classList.add("ed-on"); decorate(); render(); }, "pri"));
    } else {
      bar.append(
        btn(T.save, async () => {
          const html = serialize();
          if (LOCAL_TEST) { console.log(html); msg("（本机测试）" + html.length + " chars"); return; }
          msg(T.saving, 0);
          try {
            const when = new Date().toLocaleString("zh-CN", { hour12: false });
            await putFile(PAGE, b64(html), `网页编辑 ${PAGE} ${when}`);
            editing = false; document.body.classList.remove("ed-on"); undecorate(); render(); msg(T.saved, 6000);
          } catch (e) { msg(T.fail + e.message, 8000); }
        }, "pri"),
        btn(T.cancel, () => location.reload()),
        btn(T.history, () => window.open(`https://github.com/${OWNER}/${REPO}/commits/${BRANCH}`, "_blank")),
        btn(T.logout, () => { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); }));
    }
  };
  const start = () => { document.head.append(css); document.body.append(bar); render(); };

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
