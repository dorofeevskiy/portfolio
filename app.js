import { initHeroScrub } from './hero-scrub.js?v=floor-27';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const compactLayout = matchMedia('(max-width: 900px)');
const asset = name => 'assets/' + name + '.webp';
const photoSet = (prefix, count) => Array.from({ length: count }, (_, i) => asset(prefix + '-' + (i + 1)));

const cases = {
  kardenta: {
    name: 'Кардента', status: 'Маркетинг действующей клиники', url: 'https://kardenta.ru/',
    images: photoSet('kardenta', 4),
    captions: ['Главная страница', 'Пространство клиники', 'Предложение по имплантации', 'Услуги и состав лечения'],
    task: 'Перестроить путь пациента от первого клика до посещения клиники. Привести сайт, рекламные площадки и предложение к общей понятной логике.',
    scope: ['Аудит и позиционирование клиники', 'Переработка сайта, услуг и цен', 'Обновление справочников и запуск рекламы', 'Аналитика и работа с воронкой обращений'],
    result: 'Более 100 первичных звонков из рекламы в месяц. Около 70% позвонивших записываются, около 50% посещают клинику.',
    note: 'По данным автора проекта. Сравнение с периодом до начала работы отсутствует: аналитика ранее не велась.'
  },
  petricor: {
    name: 'Petrikor', status: 'Запуск · SEO · Реклама', url: 'https://petricor22.ru/',
    images: photoSet('petricor', 4),
    captions: ['Страница ортодонтии', 'Выбор ортодонтического лечения', 'Путь к новой улыбке', 'Бережное лечение зубов'],
    task: 'Помочь пациенту разобраться в направлениях лечения и сделать первый шаг к обращению в клинику.',
    scope: ['Структура и подробные страницы направлений', 'Спокойная визуальная система и интерфейсы', 'Объяснение услуг и сценариев лечения', 'Реализация и адаптация для мобильных устройств']
  },
  boom: {
    name: 'Boom Shop', status: 'Запуск интернет-магазина', url: 'https://boomshopcosmetics.com/',
    images: photoSet('boom', 3), captions: ['Главная и категории', 'Каталог товаров', 'Представление продукции'],
    task: 'Открыть для производителя косметики новый канал прямых продаж. Создать пользовательский интернет-магазин с нуля.',
    scope: ['Структура, дизайн и сборка на Тильде', 'Каталог, оплата через Альфа-Банк и доставка СДЭК', 'Доработка передачи данных в интеграциях', 'Тексты, ИИ-контент и публикации в социальных сетях'],
    result: 'Около 100 000 ₽ выручки от заказов за первые две недели после запуска.',
    note: 'Оценка автора по итогам запуска; первичные отчёты не сохранились. Участие завершилось после запуска.'
  },
  izdatel: {
    name: 'Издательство', status: 'Разработан · Готовится к запуску', url: 'https://dorofeevskiy.gitverse.site/izdatel/',
    images: photoSet('izdatel', 4), captions: ['Главный экран: библиотека', 'Галерея изданий', 'Интерактивный квиз для автора', 'Команда и подход'],
    task: 'Объяснить будущему автору, как создаётся книга — от идеи до маркетинга. Через понимание процесса помочь прийти к обращению в издательство.',
    scope: ['Концепция и структура сайта', 'Строгая визуальная подача', 'Интерактивная история рождения книги', 'Современная анимация и разработка'],
    result: 'Готовое творческое и функциональное решение для будущего бренда. Издательство находится на этапе оформления, коммерческий запуск ещё впереди.'
  },
  gromche: {
    name: 'Громче', status: 'Экспериментальный концепт', url: 'https://dorofeevskiy.gitverse.site/gromche/',
    images: photoSet('gromche', 4), captions: ['Главный экран: сборка коллажа', 'Пространственная галерея проектов', 'Интерактивный процесс работы', 'Команда концепта'],
    task: 'Показать характер творческого бизнеса через смелый дизайн и интерактив. Концепт для студий, косметических брендов и продюсерских агентств.',
    scope: ['Авторская концепция, дизайн и реализация', 'Сборка коллажа из отдельных элементов', 'Движение вглубь галереи портфолио', 'Адаптация интерактива для разных экранов']
  },
  prizma: {
    name: 'Prisma', status: 'ИИ-сервис · Открытое тестирование', url: 'https://dorofeevskiy.gitverse.site/prizma/',
    images: photoSet('prizma', 5), captions: ['Категории контента', 'Форма запроса', 'Состояние анализа', 'Структурированный результат', 'Подробный разбор и рекомендации'],
    task: 'Помочь людям выбирать фильмы, книги, песни, игры, сериалы и шоу с учётом своих ценностей и христианских ориентиров.',
    scope: ['Авторская идея и пользовательский сценарий', 'Дизайн и разработка с помощью ИИ', 'Интеграция нейросети и структура анализа', 'Итерационная настройка промптов и доработка по отзывам'],
    result: 'Работающий сервис в открытом тестировании. Собираю отзывы и сообщения об ошибках, постепенно улучшаю продукт.',
    note: 'Разборы создаются автоматически и могут содержать фактические ошибки и неточные оценки.'
  }
};

const dialog = $('#case-dialog');
const mainImage = $('#case-image');
let activeCase = null;
let imageIndex = 0;
let touchStart = null;
function descriptionSection(title, text, items) {
  const section = document.createElement('section');
  section.className = 'description-section';
  const heading = document.createElement('h3');
  heading.textContent = title;
  section.append(heading);
  if (text) { const p = document.createElement('p'); p.textContent = text; section.append(p); }
  if (items) {
    const ul = document.createElement('ul');
    items.forEach(item => { const li = document.createElement('li'); li.textContent = item; ul.append(li); });
    section.append(ul);
  }
  return section;
}
function selectImage(index) {
  if (!activeCase) return;
  imageIndex = (index + activeCase.images.length) % activeCase.images.length;
  mainImage.src = activeCase.images[imageIndex];
  mainImage.alt = activeCase.name + ': ' + activeCase.captions[imageIndex];
  $('#image-caption').textContent = activeCase.captions[imageIndex];
  $('#case-counter').textContent = String(imageIndex + 1).padStart(2, '0') + ' / ' + String(activeCase.images.length).padStart(2, '0');
  $$('#case-thumbnails button').forEach((button, i) => {
    button.classList.toggle('selected', i === imageIndex);
    button.setAttribute('aria-pressed', String(i === imageIndex));
  });
}
function openCase(id) {
  const data = cases[id];
  if (!data) return;
  activeCase = data;
  dialog.classList.remove('zoomed');
  $('.expand-image').setAttribute('aria-label', 'Увеличить скриншот');
  $('#case-title').textContent = data.name;
  $('#case-status').textContent = data.status;
  const thumbs = $('#case-thumbnails');
  thumbs.replaceChildren();
  data.images.forEach((src, i) => {
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Показать: ' + data.captions[i]);
    const img = document.createElement('img');
    img.src = src; img.alt = ''; img.loading = 'lazy';
    button.append(img);
    button.addEventListener('click', () => selectImage(i));
    thumbs.append(button);
  });
  const description = $('#case-description');
  description.replaceChildren(descriptionSection('Задача', data.task), descriptionSection('Что сделал', null, data.scope));
  if (data.result) {
    const section = descriptionSection('Результат', data.result);
    if (data.note) { const note = document.createElement('p'); note.className = 'result-note'; note.textContent = data.note; section.append(note); }
    description.append(section);
  }
  const link = document.createElement('a');
  link.className = 'button button-dark'; link.href = data.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
  link.textContent = 'Открыть сайт ↗';
  description.append(link);
  selectImage(0);
  dialog.showModal();
  dialog.scrollTop = 0;
  description.scrollTop = 0;
}
$$('.project-card').forEach(card => card.addEventListener('click', () => openCase(card.dataset.case)));
$('.close-case').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
$('.previous-image').addEventListener('click', () => selectImage(imageIndex - 1));
$('.next-image').addEventListener('click', () => selectImage(imageIndex + 1));
$('.expand-image').addEventListener('click', () => {
  const zoomed = dialog.classList.toggle('zoomed');
  $('.expand-image').setAttribute('aria-label', zoomed ? 'Вернуть описание проекта' : 'Увеличить скриншот');
});
document.addEventListener('keydown', event => {
  if (!dialog.open) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); selectImage(imageIndex - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); selectImage(imageIndex + 1); }
});
mainImage.addEventListener('pointerdown', event => { touchStart = { x: event.clientX, y: event.clientY }; });
mainImage.addEventListener('pointerup', event => {
  if (!touchStart) return;
  const dx = event.clientX - touchStart.x, dy = event.clientY - touchStart.y;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) selectImage(imageIndex + (dx < 0 ? 1 : -1));
  touchStart = null;
});
const menu = $('#main-nav'), menuToggle = $('.menu-toggle');
function closeMenu() { menu.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Открыть меню'); }
menuToggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});
$$('#main-nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
function fitHero() {
  const h1 = $('#hero-title'), area = $('.hero-copy');
  h1.style.fontSize = '';
  const current = parseFloat(getComputedStyle(h1).fontSize);
  const widest = Math.max(...$$('span', h1).map(span => span.getBoundingClientRect().width));
  if (widest > area.clientWidth) h1.style.fontSize = (current * area.clientWidth / widest * .99).toFixed(2) + 'px';
}
const projectsSection = $('.projects-scroll'), cards = $$('.project-card');
let scrollScheduled = false;
function updateMotion() {
  scrollScheduled = false;
  if (reducedMotion.matches || compactLayout.matches) {
    cards.forEach(card => { card.style.transform = ''; });
    return;
  }
  const sectionTop = projectsSection.getBoundingClientRect().top;
  const entry = clamp((innerHeight - sectionTop) / (innerHeight * .78));
  const ribbon = 1 - ease(entry);
  const grid = $('.projects-grid'), centerX = grid.clientWidth / 2, centerY = grid.clientHeight / 2, radius = grid.clientWidth * .34;
  cards.forEach((card, i) => {
    const a = (i - 2.5) * .49;
    const dx = (centerX + Math.sin(a) * radius - card.offsetLeft - card.offsetWidth / 2) * ribbon;
    const dy = (centerY + Math.cos(a) * 36 - card.offsetTop - card.offsetHeight / 2) * ribbon;
    const dz = Math.cos(a) * 150 * ribbon;
    card.style.transform = 'translate3d(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px,' + dz.toFixed(2) + 'px) rotateY(' + (-a * 43 * ribbon).toFixed(2) + 'deg) rotateZ(' + ((i - 2.5) * 4 * ribbon).toFixed(2) + 'deg) scale(' + (1 - .38 * ribbon).toFixed(3) + ')';
  });
}

function scheduleMotion() { if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateMotion); } }
function updateLayout() { fitHero(); scheduleMotion(); }
window.addEventListener('scroll', scheduleMotion, { passive: true });
window.addEventListener('resize', updateLayout);
reducedMotion.addEventListener('change', updateLayout);
compactLayout.addEventListener('change', updateLayout);
document.fonts.ready.then(updateLayout);
updateLayout();
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) $$('#main-nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id)); });
}, { rootMargin: '-15% 0px -55% 0px' });
$$('main>section').forEach(section => navObserver.observe(section));
initHeroScrub();

// Prepare the sculpture only near its section; the approved hero stays independent.
const aboutArt = $('#about .type-art');
const typeObserver = new IntersectionObserver(entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  typeObserver.disconnect();
  import('./type-sculpture.js?v=about-7').then(({ initTypeSculpture }) => initTypeSculpture(aboutArt)).catch(error => console.warn('Typography unavailable:', error));
}, { rootMargin: '800px 0px' });
if (aboutArt) typeObserver.observe(aboutArt);
