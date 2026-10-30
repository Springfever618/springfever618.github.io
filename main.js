// 复古再造作品清单；10-24 用户定：复古再造先不上传，网站上只放卡片、不加链接
const RETRO = [
  ["01", "明快打字机", "1947", "01_明快打字机", "MingKwai Typewriter (Lin Yutang)", "1947"],
  ["02", "高仲芹中文打字机", "1943–1947", "02_高仲芹打字机", "Kao Chung-Chin Chinese Typewriter", "1943–1947"],
  ["03", "折叠式即显相机", "1970–1972", "03_折叠式即显相机", "Folding Instant Camera", "1970–1972"],
  ["04", "中文电报明码", "1871 起", "04_中文电报明码", "Chinese Telegraph Code", "from 1871"],
  ["05", "舒震东华文打字机", "1920 年代", "05_舒震东华文打字机", "Shu Zhendong Chinese Typewriter", "1920s"],
  ["06", "璇玑图", "4 世纪", "06_璇玑图", "Xuanji Tu, Su Hui's Palindrome", "4th century"],
  ["07", "王祯转轮排字架", "元", "07_王祯转轮排字架", "Wang Zhen's Revolving Type Tables", "Yuan dynasty"],
  ["08", "仓颉输入法", "1976", "08_仓颉输入法", "Cangjie Input Method", "1976"],
  ["09", "四角号码检字", "1920 年代", "09_四角号码", "Four-Corner Method", "1920s"],
  ["10", "反切", "东汉末至清", "10_反切", "Fanqie Spelling", "Late Han to Qing"],
  ["11", "算盘与苏州码子", "明清", "11_算盘与苏州码子", "Abacus and Suzhou Numerals", "Ming–Qing"],
  ["12", "联想字盘打字机", "1950–80 年代", "12_联想字盘打字机", "Associative-Layout Typewriter", "1950s–80s"],
  ["13", "汉字激光照排", "1975 起", "13_汉字激光照排", "Chinese Laser Phototypesetting", "from 1975"],
  ["14", "手摇留声机", "约 1900 年", "14_手摇留声机", "Hand-Cranked Gramophone", "c. 1900"],
];

const EN = document.documentElement.lang === "en";
document.getElementById("retro").innerHTML = RETRO.map(([no, name, era, dir, nameEn, eraEn]) =>
  `<div class="item">
     <span class="no">${no}</span><b>${EN ? nameEn : name}</b><small>${EN ? eraEn : era}</small>
   </div>`).join("");

const btn = document.getElementById("theme");
const root = document.documentElement;
try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch (e) {}
btn.addEventListener("click", () => {
  const dark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
});

// 左右翻页（10-25）：导航、左右箭头、底部圆点、键盘左右键、触控板左右滑动都能切换板块
const pager = document.querySelector("main");
const pages = [...pager.children].filter(s => s.tagName === "SECTION" && s.id);
const navLinks = [...document.querySelectorAll("nav a[href^='#']")];
const current = () => Math.round(pager.scrollLeft / pager.clientWidth);
const go = (i, smooth = true) => {
  i = Math.max(0, Math.min(pages.length - 1, i));
  pager.scrollTo({ left: i * pager.clientWidth, behavior: smooth ? "smooth" : "instant" });
};
const runtime = el => { el.dataset.runtime = ""; return el; };
const mkBtn = (cls, text, label, fn) => {
  const b = runtime(Object.assign(document.createElement("button"), { type: "button", className: cls, textContent: text }));
  b.setAttribute("aria-label", label); b.addEventListener("click", fn); return b;
};
const prev = mkBtn("pager-btn pager-prev", "‹", EN ? "Previous" : "上一页", () => go(current() - 1));
const next = mkBtn("pager-btn pager-next", "›", EN ? "Next" : "下一页", () => go(current() + 1));
document.body.append(prev, next);

const mark = () => {
  const i = current(), id = pages[i]?.id;
  navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
  const act = navLinks.find(a => a.classList.contains("active")); if (act) act.parentElement.scrollTo({ left: act.offsetLeft - 40, behavior: "smooth" });
  prev.disabled = i === 0; next.disabled = i === pages.length - 1;
  if (id && location.hash !== "#" + id && location.hash !== "#edit") history.replaceState(null, "", "#" + id);
};
let markTimer;
pager.addEventListener("scroll", () => { clearTimeout(markTimer); markTimer = setTimeout(mark, 60); });
document.addEventListener("click", e => {
  const a = e.target.closest("a[href^='#']"); if (!a) return;
  const h = a.getAttribute("href"), i = h === "#" ? 0 : pages.findIndex(p => "#" + p.id === h);
  if (i < 0 || (document.body.classList.contains("ed-on") && a.closest("main"))) return;
  e.preventDefault(); go(i, !a.closest("nav")); // 顶部导航直接切页，箭头和圆点保留滑动
});
document.addEventListener("keydown", e => {
  const t = e.target;
  if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "ArrowRight") { e.preventDefault(); go(current() + 1); }
  if (e.key === "ArrowLeft") { e.preventDefault(); go(current() - 1); }
});
let lastPage = 0;
window.addEventListener("resize", () => go(lastPage, false));
pager.addEventListener("scroll", () => { lastPage = current(); }, { passive: true });
const start = pages.findIndex(p => "#" + p.id === location.hash);
if (start > 0) go(start, false);
mark();
