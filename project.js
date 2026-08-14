const projectId = new URLSearchParams(window.location.search).get('id');
const projects = window.portfolioProjects;
const projectIndex = projects.findIndex(project => project.id === projectId);
const project = projects[projectIndex] || projects[0];
const previous = projects[(projectIndex - 1 + projects.length) % projects.length];
const next = projects[(projectIndex + 1) % projects.length];

document.title = `${project.title} — Portfolio`;
document.querySelector('#project-page').innerHTML = `
  <section class="project-hero">
    <div><p class="project-label">${project.number} / ${project.category.toUpperCase()}</p><h1>${project.title}</h1><p class="project-description">${project.description}</p></div>
    <div class="project-visual"><img src="${project.image}" alt="Preview ${project.title}" style="width:100%;height:100%;object-fit:cover;display:block" /></div>
  </section>
  <section class="project-meta">
    <article><p class="project-label">CLIENT</p><h2>${project.client}</h2></article>
    <article><p class="project-label">ROLE</p><h2>${project.role}</h2></article>
    <article><p class="project-label">YEAR</p><h2>${project.year}</h2></article>
  </section>
  <section class="detail-grid"><h2>Behind the<br /><em>project.</em></h2><div><p>${project.outcome}</p><div class="stack">${project.stack.map(item => `<span>${item}</span>`).join('')}</div></div></section>
  <nav class="project-navigation"><a href="project.html?id=${previous.id}"><span>← PREVIOUS PROJECT</span>${previous.title}</a><a href="project.html?id=${next.id}"><span>NEXT PROJECT →</span>${next.title}</a></nav>
`;
