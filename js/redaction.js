/*
 * Client 端去識別化：使用者上傳手寫病歷照片，在 canvas 上用滑鼠/觸控拉黑框
 * 蓋掉飼主姓名/電話/病歷號/晶片號等敏感欄位。redacted 影像才是日後會送雲端 AI 的版本。
 * MVP 階段尚未接 AI，此步驟先把「隱私流程」跑通；redacted 影像可下載留存。
 */
window.Redaction = (function () {
  let canvas, ctx, img = null;
  let boxes = [];              // 已確定的黑框 {x,y,w,h}（canvas 座標）
  let drag = null;            // 拖曳中的框
  let scale = 1;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    const down = (e) => { if (!img) return; const p = pos(e); drag = { x: p.x, y: p.y, w: 0, h: 0 }; e.preventDefault(); };
    const move = (e) => { if (!drag) return; const p = pos(e); drag.w = p.x - drag.x; drag.h = p.y - drag.y; redraw(); e.preventDefault(); };
    const up = () => { if (!drag) return; if (Math.abs(drag.w) > 4 && Math.abs(drag.h) > 4) boxes.push(norm(drag)); drag = null; redraw(); };
    canvas.addEventListener('mousedown', down);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    canvas.addEventListener('touchstart', down, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
  }

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * (canvas.width / r.width), y: (src.clientY - r.top) * (canvas.height / r.height) };
  }
  function norm(b) {
    return { x: Math.min(b.x, b.x + b.w), y: Math.min(b.y, b.y + b.h), w: Math.abs(b.w), h: Math.abs(b.h) };
  }

  function loadFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject('no file');
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => {
        const maxW = 900;
        scale = Math.min(1, maxW / im.naturalWidth);
        canvas.width = Math.round(im.naturalWidth * scale);
        canvas.height = Math.round(im.naturalHeight * scale);
        img = im; boxes = []; redraw();
        URL.revokeObjectURL(url);
        resolve();
      };
      im.onerror = () => reject('image load failed');
      im.src = url;
    });
  }

  function redraw() {
    if (!img) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    for (const b of boxes) ctx.fillRect(b.x, b.y, b.w, b.h);
    if (drag) {
      const n = norm(drag);
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(n.x, n.y, n.w, n.h);
    }
  }

  function undo() { boxes.pop(); redraw(); }
  function clearBoxes() { boxes = []; redraw(); }
  function reset() { img = null; boxes = []; drag = null; ctx && ctx.clearRect(0, 0, canvas.width, canvas.height); }
  function hasImage() { return !!img; }
  function boxCount() { return boxes.length; }
  function toDataURL() { return img ? canvas.toDataURL('image/jpeg', 0.85) : null; }

  return { init, loadFile, undo, clearBoxes, reset, hasImage, boxCount, toDataURL };
})();
