const nav = document.querySelector('.nav');
const toggle = document.querySelector('.menu-button');
const links = document.querySelectorAll('nav a');

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});

links.forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const sections = [...document.querySelectorAll('main section')];
window.addEventListener('scroll', () => {
  const current = sections.findLast(section => window.scrollY >= section.offsetTop - 160)?.id || 'home';
  links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
}, { passive: true });

window.addEventListener('load', () => {
  setTimeout(() => document.querySelector('.loader').classList.add('done'), 1700);
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
let draggingCard = false;
let pointerStart = { x: 0, y: 0 };
let lanyardAnchor;
let returnAnimationFrame;
let returnFallback;

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
  const length = Math.max(90, Math.hypot(dx, dy) + 3);
  const angle = -Math.atan2(dx, dy) * 180 / Math.PI;
  lanyard.style.setProperty('--lanyard-height', `${length}px`);
  lanyard.style.transform = `rotate(${angle}deg)`;
  syncLanyardPin();
}

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
  idCard.setPointerCapture(event.pointerId); idCard.classList.add('dragging');
  lanyard.classList.add('tracking');
});
idCard.addEventListener('pointermove', event => {
  if (!draggingCard) return;
  const xLimit = Math.max(125, lanyardStage.clientWidth * .42);
  const dx = Math.max(-xLimit, Math.min(xLimit, event.clientX - pointerStart.x));
  const dy = Math.max(-95, Math.min(145, event.clientY - pointerStart.y));
  const cardTilt = dx / xLimit * 22;
  idCard.style.transform = `translate(${dx}px, ${dy}px) rotate(${4 + cardTilt}deg)`;
  syncLanyardToCard();
});
function releaseCard(event) {
  draggingCard = false;
  if (event?.pointerId !== undefined && idCard.hasPointerCapture(event.pointerId)) idCard.releasePointerCapture(event.pointerId);
  idCard.classList.remove('dragging');
  idCard.style.transform = '';
  lanyard.classList.add('tracking');
  const followReturningCard = () => {
    syncLanyardToCard();
    returnAnimationFrame = requestAnimationFrame(followReturningCard);
  };
  returnAnimationFrame = requestAnimationFrame(followReturningCard);
  clearTimeout(returnFallback);
  returnFallback = setTimeout(stopFollowingReturn, 320);
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
