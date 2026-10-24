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
