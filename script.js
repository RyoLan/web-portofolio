const nav = document.querySelector('.nav');
const toggle = document.querySelector('.menu-button');
const links = document.querySelectorAll('nav a');

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});

links.forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));

const scrollTargets = document.querySelectorAll('main section > *, main section article, footer > *');
scrollTargets.forEach(element => {
  element.classList.add('scroll-animated');
  const siblingIndex = [...element.parentElement.children].indexOf(element);
  element.style.setProperty('--scroll-delay', `${Math.min(siblingIndex, 5) * 70}ms`);
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const active = entry.isIntersecting;
    entry.target.classList.toggle('visible', active);
    entry.target.classList.toggle('is-visible', active);
  });
}, { threshold: 0.12, rootMargin: '-8% 0px -8% 0px' });
document.querySelectorAll('.reveal, .scroll-animated').forEach(el => observer.observe(el));

const sections = [...document.querySelectorAll('main section')];
window.addEventListener('scroll', () => {
  const current = sections.findLast(section => window.scrollY >= section.offsetTop - 160)?.id || 'home';
  links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
}, { passive: true });

window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelector('.loader').classList.add('done');
    document.body.classList.add('page-ready');
  }, 1700);
});

const glow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', event => {
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});

document.querySelectorAll('.project').forEach(project => {
  project.addEventListener('pointermove', event => {
    const box = project.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - .5;
    const y = (event.clientY - box.top) / box.height - .5;
    project.style.transform = `perspective(700px) rotateY(${x * 4}deg) rotateX(${y * -4}deg)`;
  });
  project.addEventListener('pointerleave', () => project.style.transform = '');
});

const idCard = document.querySelector('.id-card');
const lanyard = document.querySelector('.lanyard');
const lanyardStage = document.querySelector('.portrait');
const cardHole = document.querySelector('.card-hole');
const lanyardCord = document.querySelector('.lanyard-cord');
const lanyardPin = document.querySelector('.lanyard-pin');
const lanyardCanvas = document.querySelector('.lanyard-canvas');
const lanyardContext = lanyardCanvas.getContext('2d');
const lanyardPhoto = new Image();
lanyardPhoto.src = 'images/lanyard-fhin-vertical.png';
lanyardCanvas.addEventListener('pointerdown', event => {
  event.preventDefault();
  event.stopPropagation();
});
document.addEventListener('click', event => {
  if (!event.target.closest('a[href="#home"]')) return;
  const canvasBox = lanyardCanvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - canvasBox.left) * lanyardCanvas.width / canvasBox.width);
  const y = Math.floor((event.clientY - canvasBox.top) * lanyardCanvas.height / canvasBox.height);
  if (x < 0 || y < 0 || x >= lanyardCanvas.width || y >= lanyardCanvas.height) return;
  if (lanyardContext.getImageData(x, y, 1, 1).data[3] > 0) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);
let draggingCard = false;
let pointerStart = { x: 0, y: 0 };
let lanyardAnchor;
let returnAnimationFrame;
let returnFallback;
let lanyardAnimationFrame;
let targetAngle = 0;
let targetLength = 320;
let renderedAngle = 0;
let renderedLength = 315;
let angularVelocity = 0;
let lengthVelocity = 0;
let pointerVelocity = { x: 0, y: 0 };
let lastPointerSample;

function renderLanyard() {
  // A lightly damped spring lets the strap trail the card instead of moving as a rigid line.
  angularVelocity = (angularVelocity + (targetAngle - renderedAngle) * .16) * .73;
  lengthVelocity = (lengthVelocity + (targetLength - renderedLength) * .12) * .69;
  renderedAngle += angularVelocity;
  renderedLength += lengthVelocity;
  lanyard.style.setProperty('--lanyard-height', `${renderedLength}px`);
  const tension = Math.max(0, Math.min(1, (renderedLength - 220) / 150));
  const slack = Math.max(0, Math.min(1, (315 - renderedLength) / 110));
  lanyard.style.setProperty('--lanyard-tension', tension.toFixed(3));
  lanyard.style.setProperty('--lanyard-scale', (1 - tension * .08).toFixed(3));
  lanyard.style.setProperty('--lanyard-fold', slack.toFixed(3));
  lanyard.style.setProperty('--lanyard-fold-offset', `${(renderedLength * -.32).toFixed(1)}px`);
  lanyard.style.setProperty('--lanyard-slack', `${Math.max(-7, Math.min(7, angularVelocity * -.42 + (315 - renderedLength) * .025)).toFixed(2)}deg`);
  lanyard.style.transform = `rotate(${renderedAngle}deg)`;
  syncLanyardCurve();
  syncLanyardPin();

  const resting = Math.abs(targetAngle - renderedAngle) < .03 && Math.abs(targetLength - renderedLength) < .08 && Math.abs(angularVelocity) < .02 && Math.abs(lengthVelocity) < .03;
  if (!resting || draggingCard) {
    lanyardAnimationFrame = requestAnimationFrame(renderLanyard);
  } else {
    lanyardAnimationFrame = undefined;
  }
}

function animateLanyard() {
  if (!lanyardAnimationFrame) lanyardAnimationFrame = requestAnimationFrame(renderLanyard);
}

function syncLanyardToCard() {
  const hole = cardHole.getBoundingClientRect();
  if (!lanyardAnchor) {
    const strap = lanyard.getBoundingClientRect();
    lanyardAnchor = {
      x: strap.left + strap.width / 2,
      documentY: strap.top + window.scrollY
    };
  }
  const stage = lanyardStage.getBoundingClientRect();
  const scaleX = stage.width / lanyardStage.offsetWidth;
  const scaleY = stage.height / lanyardStage.offsetHeight;
  const anchorY = lanyardAnchor.documentY - window.scrollY;
  const dx = (hole.left + hole.width / 2 - lanyardAnchor.x) / scaleX;
  const dy = (hole.top + hole.height / 2 - anchorY) / scaleY;
  targetLength = Math.max(320, Math.min(430, Math.hypot(dx, dy) + 3));
  targetAngle = -Math.atan2(dx, dy) * 180 / Math.PI;
  animateLanyard();
}

function syncLanyardCurve() {
  if (!lanyardAnchor) return;
  const curveBox = lanyardCanvas.getBoundingClientRect();
  const hole = cardHole.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  lanyardCanvas.width = Math.round(curveBox.width * pixelRatio);
  lanyardCanvas.height = Math.round(curveBox.height * pixelRatio);
  lanyardContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  lanyardContext.clearRect(0, 0, curveBox.width, curveBox.height);
  const startX = lanyardAnchor.x - curveBox.left;
  const startY = lanyardAnchor.documentY - window.scrollY - curveBox.top;
  const endX = hole.left + hole.width / 2 - curveBox.left;
  const endY = hole.top + hole.height / 2 - curveBox.top;
  const distance = Math.hypot(endX - startX, endY - startY);
  const slack = Math.max(0, Math.min(1, (315 - distance) / 130));
  const restingLean = 12;
  const sway = angularVelocity * 4 + restingLean + (endX - startX < 0 ? -1 : 1) * slack * 54;
  const fold = slack * 88;
  const controlOne = { x: startX + (endX - startX) * .25 + sway, y: startY + (endY - startY) * .25 + fold };
  const controlTwo = { x: startX + (endX - startX) * .75 + sway * .45, y: startY + (endY - startY) * .75 + fold };
  const pointAt = t => ({
    x: (1 - t) ** 3 * startX + 3 * (1 - t) ** 2 * t * controlOne.x + 3 * (1 - t) * t ** 2 * controlTwo.x + t ** 3 * endX,
    y: (1 - t) ** 3 * startY + 3 * (1 - t) ** 2 * t * controlOne.y + 3 * (1 - t) * t ** 2 * controlTwo.y + t ** 3 * endY
  });

  const segments = 42;
  const drawPath = (lineWidth, strokeStyle, offsetX, offsetY) => {
    lanyardContext.beginPath();
    for (let index = 0; index <= segments; index += 1) {
      const point = pointAt(index / segments);
      if (index === 0) lanyardContext.moveTo(point.x + offsetX, point.y + offsetY);
      else lanyardContext.lineTo(point.x + offsetX, point.y + offsetY);
    }
    lanyardContext.lineWidth = lineWidth;
    lanyardContext.lineCap = 'round';
    lanyardContext.strokeStyle = strokeStyle;
    lanyardContext.stroke();
  };
  drawPath(31, '#0008', 2, 3);

  if (lanyardPhoto.complete && lanyardPhoto.naturalWidth) {
    // Use the supplied vertical photo at its full width; only the strap path bends.
    const photoTilt = 0;
    const ribbonWidth = 28;
    const edgeCrop = 2;
    const croppedWidth = lanyardPhoto.naturalWidth - edgeCrop * 2;
    for (let index = 0; index < segments; index += 1) {
      const point = pointAt(index / segments);
      const nextPoint = pointAt((index + 1) / segments);
      const dx = nextPoint.x - point.x;
      const dy = nextPoint.y - point.y;
      const segmentLength = Math.hypot(dx, dy) + 1;
      const sourceY = lanyardPhoto.naturalHeight * index / segments;
      const sourceHeight = lanyardPhoto.naturalHeight / segments + 1;
      lanyardContext.save();
      lanyardContext.translate(point.x, point.y);
      lanyardContext.rotate(Math.atan2(dy, dx) - Math.PI / 2 + photoTilt);
      lanyardContext.drawImage(lanyardPhoto, edgeCrop, sourceY, croppedWidth, sourceHeight, -ribbonWidth / 2, -1, ribbonWidth, segmentLength + 2);
      lanyardContext.restore();
    }
  }
  lanyard.style.setProperty('--lanyard-fold', slack.toFixed(3));
}

lanyardPhoto.addEventListener('load', syncLanyardCurve);

function syncLanyardPin() {
  const cord = lanyardCord.getBoundingClientRect();
  const hole = cardHole.getBoundingClientRect();
  const startX = cord.left + cord.width / 2;
  const startY = cord.bottom - 2;
  const endX = hole.left + hole.width / 2;
  const endY = hole.top + hole.height / 2;
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.hypot(dx, dy) + 2;
  const angle = -Math.atan2(dx, dy) * 180 / Math.PI;
  lanyardPin.style.left = `${startX - 4}px`;
  lanyardPin.style.top = `${startY}px`;
  lanyardPin.style.height = `${length}px`;
  lanyardPin.style.transform = `rotate(${angle}deg)`;
}
idCard.addEventListener('pointerdown', event => {
  event.preventDefault(); draggingCard = true;
  pointerStart = { x: event.clientX, y: event.clientY };
  pointerVelocity = { x: 0, y: 0 };
  lastPointerSample = { x: event.clientX, y: event.clientY, time: performance.now() };
  idCard.setPointerCapture(event.pointerId); idCard.classList.add('dragging');
  lanyard.classList.add('tracking');
});
idCard.addEventListener('pointermove', event => {
  if (!draggingCard) return;
  const now = performance.now();
  const elapsed = Math.max(16, now - lastPointerSample.time);
  pointerVelocity = {
    x: (event.clientX - lastPointerSample.x) / elapsed,
    y: (event.clientY - lastPointerSample.y) / elapsed
  };
  lastPointerSample = { x: event.clientX, y: event.clientY, time: now };
  const xLimit = Math.max(125, lanyardStage.clientWidth * .42);
  const dx = Math.max(-xLimit, Math.min(xLimit, event.clientX - pointerStart.x));
  const dy = Math.max(-95, Math.min(145, event.clientY - pointerStart.y));
  const cardTilt = dx / xLimit * 22;
  idCard.style.transform = `translate(${dx}px, ${dy}px) rotate(${4 + cardTilt}deg)`;
  syncLanyardToCard();
  // Fast movements transfer momentum to the strap instead of making it track rigidly.
  angularVelocity += Math.max(-2.4, Math.min(2.4, pointerVelocity.x * .22));
  lengthVelocity += Math.max(-1.8, Math.min(1.8, pointerVelocity.y * .12));
});
function releaseCard(event) {
  draggingCard = false;
  if (event?.pointerId !== undefined && idCard.hasPointerCapture(event.pointerId)) idCard.releasePointerCapture(event.pointerId);
  idCard.classList.remove('dragging');
  idCard.style.transform = '';
  lanyard.classList.add('tracking');
  angularVelocity += Math.max(-4.5, Math.min(4.5, pointerVelocity.x * .48));
  lengthVelocity += Math.max(-3, Math.min(3, pointerVelocity.y * .2));
  animateLanyard();
  const followReturningCard = () => {
    syncLanyardToCard();
    returnAnimationFrame = requestAnimationFrame(followReturningCard);
  };
  returnAnimationFrame = requestAnimationFrame(followReturningCard);
  clearTimeout(returnFallback);
  returnFallback = setTimeout(stopFollowingReturn, 700);
}

function stopFollowingReturn() {
  clearTimeout(returnFallback);
  cancelAnimationFrame(returnAnimationFrame);
  syncLanyardToCard();
  lanyard.classList.remove('tracking');
}

idCard.addEventListener('transitionend', event => {
  if (event.propertyName === 'transform' && !draggingCard) stopFollowingReturn();
});
idCard.addEventListener('pointerup', releaseCard);
idCard.addEventListener('pointercancel', releaseCard);
window.addEventListener('load', () => requestAnimationFrame(syncLanyardToCard));
window.addEventListener('resize', () => {
  lanyardAnchor = undefined;
  requestAnimationFrame(syncLanyardToCard);
});
window.addEventListener('scroll', () => requestAnimationFrame(syncLanyardPin), { passive: true });

const portfolioTabs = document.querySelectorAll('.portfolio-tab');
const portfolioPanels = document.querySelectorAll('.portfolio-panel');

portfolioTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const activePanelId = tab.getAttribute('aria-controls');
    portfolioTabs.forEach(item => {
      const isActive = item === tab;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', isActive);
    });
    portfolioPanels.forEach(panel => {
      const isActive = panel.id === activePanelId;
      panel.hidden = !isActive;
      panel.classList.toggle('active', isActive);
    });
  });
});
