(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const viewer = $('#credential-viewer');
  const image = $('#credential-image');
  const stage = $('.viewer-stage');
  const canvas = $('.viewer-canvas');
  const zoomIn = $('.viewer-zoom-in');
  const zoomOut = $('.viewer-zoom-out');
  let zoom = 1;
  let maxZoom = 1;
  let lastFocus = null;
  let drag = null;
  const documents = {
    degree: {
      title: 'Bachelor of Engineering',
      description: 'Information Technology · Collegium Da Vinci · 23 March 2026',
      image: 'assets/credentials/beng-information-technology.jpeg',
      alt: 'Herbert Goro’s Bachelor of Engineering diploma in Information Technology from Collegium Da Vinci, awarded 23 March 2026',
      download: 'Herbert-Goro-BEng-Information-Technology.jpeg'
    },
    recognition: {
      title: 'Environmental research project recognition',
      description: 'RDH Urban · HAS Green Academy · Collegium Da Vinci · 9 January 2025',
      image: 'assets/credentials/project-recognition.jpeg',
      alt: 'Certificate recognising Herbert Goro’s participation in the joint RDH Urban, HAS Green Academy and Collegium Da Vinci project, dated 9 January 2025',
      download: 'Herbert-Goro-Project-Recognition.jpeg'
    }
  };

  function draw(reset = false) {
    if (!viewer.open || image.hidden || !image.naturalWidth) return;
    const style = getComputedStyle(stage);
    const availableWidth = Math.max(1, stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
    const availableHeight = Math.max(1, stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
    const ratio = image.naturalWidth / image.naturalHeight;
    const fitWidth = Math.min(availableWidth, availableHeight * ratio, image.naturalWidth);
    const centreX = canvas.offsetWidth > availableWidth ? (stage.scrollLeft + availableWidth / 2) / canvas.offsetWidth : .5;
    const centreY = canvas.offsetHeight > availableHeight ? (stage.scrollTop + availableHeight / 2) / canvas.offsetHeight : .5;
    maxZoom = Math.max(1, image.naturalWidth / fitWidth);
    zoom = Math.min(Math.max(1, zoom), maxZoom);
    const width = Math.round(fitWidth * zoom);
    const height = Math.round(width / ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    stage.classList.toggle('is-zoomed', zoom > 1.01);
    zoomIn.disabled = zoom >= maxZoom - .01;
    zoomOut.disabled = zoom <= 1.01;
    $('.viewer-zoom-level').textContent = zoom <= 1.01 ? 'Fit' : `${zoom.toFixed(1)}×`;
    if (reset || zoom <= 1.01) { stage.scrollLeft = 0; stage.scrollTop = 0; }
    else { stage.scrollLeft = Math.max(0, centreX * width - availableWidth / 2); stage.scrollTop = Math.max(0, centreY * height - availableHeight / 2); }
  }

  function loaded() {
    $('.viewer-loading').hidden = true;
    $('.viewer-error').hidden = true;
    stage.setAttribute('aria-busy', 'false');
    image.hidden = false;
    $('.viewer-resolution').textContent = `Original scan · ${image.naturalWidth.toLocaleString()} × ${image.naturalHeight.toLocaleString()} px`;
    requestAnimationFrame(() => draw(true));
  }
  image.addEventListener('load', loaded);
  image.addEventListener('error', () => {
    $('.viewer-loading').hidden = true;
    $('.viewer-error').hidden = false;
    stage.setAttribute('aria-busy', 'false');
  });
  document.querySelectorAll('[data-credential]').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0 || !viewer.showModal) return;
    const data = documents[link.dataset.credential];
    if (!data) return;
    event.preventDefault();
    lastFocus = link;
    zoom = 1;
    $('#viewer-title').textContent = data.title;
    $('#viewer-description').textContent = data.description;
    $('.viewer-original').href = data.image;
    $('.viewer-download').href = data.image;
    $('.viewer-download').download = data.download;
    $('.viewer-resolution').textContent = 'Original scan';
    $('.viewer-loading').hidden = false;
    $('.viewer-error').hidden = true;
    image.hidden = true;
    image.alt = data.alt;
    canvas.style.width = '0';
    canvas.style.height = '0';
    stage.setAttribute('aria-busy', 'true');
    zoomIn.disabled = true;
    zoomOut.disabled = true;
    $('.viewer-zoom-level').textContent = 'Fit';
    image.src = data.image;
    viewer.showModal();
    document.body.classList.add('dialog-open');
    if (image.complete && image.naturalWidth) loaded();
  }));
  function changeZoom(direction) {
    if (image.hidden) return;
    zoom = direction > 0 ? Math.min(maxZoom, zoom * 1.5) : Math.max(1, zoom / 1.5);
    draw();
  }
  function fit() { zoom = 1; draw(true); }
  zoomIn.addEventListener('click', () => changeZoom(1));
  zoomOut.addEventListener('click', () => changeZoom(-1));
  $('.viewer-fit').addEventListener('click', fit);
  image.addEventListener('dblclick', () => { zoom = zoom > 1.01 ? 1 : Math.min(2, maxZoom); draw(); });
  viewer.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === '+' || event.key === '=') { event.preventDefault(); changeZoom(1); }
    if (event.key === '-') { event.preventDefault(); changeZoom(-1); }
    if (event.key === '0') { event.preventDefault(); fit(); }
  });
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || zoom <= 1.01) return;
    drag = {x:event.clientX, y:event.clientY, left:stage.scrollLeft, top:stage.scrollTop};
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
    event.preventDefault();
  });
  stage.addEventListener('pointermove', event => {
    if (!drag) return;
    stage.scrollLeft = drag.left - (event.clientX - drag.x);
    stage.scrollTop = drag.top - (event.clientY - drag.y);
  });
  function endDrag() { drag = null; stage.classList.remove('is-dragging'); }
  ['pointerup','pointercancel','lostpointercapture'].forEach(name => stage.addEventListener(name, endDrag));
  $('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    endDrag();
    if (lastFocus?.isConnected) lastFocus.focus({preventScroll:true});
  });
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const rect = viewer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) viewer.close();
  });
  if ('ResizeObserver' in window) new ResizeObserver(() => draw()).observe(stage);
  else window.addEventListener('resize', () => draw());
})();
