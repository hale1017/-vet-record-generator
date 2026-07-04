/*
 * © 2026 小屌鯨魚 — 保留所有權利 All Rights Reserved. 未經授權不得重用，見 LICENSE。
 *
 * Client 端去識別化 — 支援「多張」手寫病歷照片（一份病歷可能兩張）。
 * 每張照片一個 canvas，各自可拉黑框蓋掉飼主姓名/電話/病歷號/晶片號。
 * redacted 後的所有影像才會送雲端 AI（toDataURLs 回傳陣列）。
 */
window.Redaction = (function () {
  let container = null;
  let pages = []; // {img, canvas, ctx, boxes:[], drag, scale}

  function init(containerEl) { container = containerEl; pages = []; container.innerHTML = ''; }

  function addFiles(fileList) { return Promise.all([...fileList].map(addFile)); }

  function addFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return resolve();
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => {
        const maxW = 900;
        const scale = Math.min(1, maxW / im.naturalWidth);
        const wrap = document.createElement('div'); wrap.className = 'page-wrap';
        const cap = document.createElement('div'); cap.className = 'page-cap muted';
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(im.naturalWidth * scale);
        canvas.height = Math.round(im.naturalHeight * scale);
        wrap.append(cap, canvas); container.append(wrap);
        const page = { img: im, canvas, ctx: canvas.getContext('2d'), boxes: [], drag: null, scale };
        wireCanvas(page); pages.push(page);
        cap.textContent = '第 ' + pages.length + ' 張 — 在圖上按住拖曳蓋掉敏感欄位';
        draw(page); URL.revokeObjectURL(url); resolve();
      };
      im.onerror = () => resolve();
      im.src = url;
    });
  }

  function wireCanvas(page) {
    const canvas = page.canvas;
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      const s = e.touches ? e.touches[0] : e;
      return { x: (s.clientX - r.left) * (canvas.width / r.width), y: (s.clientY - r.top) * (canvas.height / r.height) };
    };
    const down = (e) => { const p = pos(e); page.drag = { x: p.x, y: p.y, w: 0, h: 0 }; e.preventDefault(); };
    const move = (e) => { if (!page.drag) return; const p = pos(e); page.drag.w = p.x - page.drag.x; page.drag.h = p.y - page.drag.y; draw(page); e.preventDefault(); };
    const up = () => { if (!page.drag) return; if (Math.abs(page.drag.w) > 4 && Math.abs(page.drag.h) > 4) page.boxes.push(norm(page.drag)); page.drag = null; draw(page); notify(); };
    canvas.addEventListener('mousedown', down);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    canvas.addEventListener('touchstart', down, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
  }

  function norm(b) { return { x: Math.min(b.x, b.x + b.w), y: Math.min(b.y, b.y + b.h), w: Math.abs(b.w), h: Math.abs(b.h) }; }

  function draw(page) {
    const { ctx, canvas, img } = page;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    page.boxes.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h));
    if (page.drag) { const n = norm(page.drag); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(n.x, n.y, n.w, n.h); }
  }

  let onChange = null;
  function notify() { if (onChange) onChange(); }
  function setOnChange(fn) { onChange = fn; }

  function undoLast() { for (let i = pages.length - 1; i >= 0; i--) if (pages[i].boxes.length) { pages[i].boxes.pop(); draw(pages[i]); break; } notify(); }
  function clearAll() { pages.forEach((p) => { p.boxes = []; draw(p); }); notify(); }
  function reset() { pages = []; if (container) container.innerHTML = ''; }
  function hasImage() { return pages.length > 0; }
  function pageCount() { return pages.length; }
  function boxCount() { return pages.reduce((n, p) => n + p.boxes.length, 0); }
  function toDataURLs() { return pages.map((p) => p.canvas.toDataURL('image/jpeg', 0.85)); }

  return { init, addFiles, undoLast, clearAll, reset, hasImage, pageCount, boxCount, toDataURLs, setOnChange };
})();
