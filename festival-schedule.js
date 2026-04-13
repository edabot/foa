import { getEventsByDaysMethod } from 'backend/events.web';
import { getBoundingRect } from 'wix-window-frontend';

const DAYS = [
  { date: '2026-07-01', label: 'July 1' },
  { date: '2026-07-02', label: 'July 2' },
  { date: '2026-07-03', label: 'July 3' },
  { date: '2026-07-04', label: 'July 4' },
  { date: '2026-07-05', label: 'July 5' },
];

function wixImageToUrl(wixUrl) {
  if (!wixUrl) return '';
  const match = wixUrl.match(/wix:image:\/\/v1\/([^\/]+)/);
  if (!match) return '';
  return `https://static.wixstatic.com/media/${match[1]}`;
}

$w.onReady(async function () {
  let groupedDays = null;
  let cleanCategories = null;

  const { window: { width } } = await getBoundingRect();

  const components = ['#eventsHtml', '#eventsHtmlMobile'];

  function setupComponent(id) {
    try {
      $w(id).width = width;
      $w(id).height = 200;
      $w(id).onMessage(e => {
        if (e.data?.type === 'IFRAME_READY') {
          trySend(id);
        }
        if (e.data?.type === 'RESIZE') {
          $w(id).height = e.data.height + 20;
        }
      });
    } catch (e) {
      // component not present on this page variant
    }
  }

  function trySend(id) {
    if (!groupedDays || !cleanCategories) return;
    try {
      $w(id).postMessage({
        type: 'LOAD_EVENTS',
        data: { days: groupedDays, categories: cleanCategories }
      });
    } catch (e) {
      // component not present on this page variant
    }
  }

  components.forEach(setupComponent);

  const { days, categories } = await getEventsByDaysMethod(DAYS);

  groupedDays = days.map(day => ({
    label: day.label,
    events: [...day.events].sort((a, b) => {
      const aTime = a.scheduling?.startDate ? new Date(a.scheduling.startDate) : null;
      const bTime = b.scheduling?.startDate ? new Date(b.scheduling.startDate) : null;
      if (!aTime && !bTime) return 0;
      if (!aTime) return 1;
      if (!bTime) return -1;
      return aTime - bTime;
    }).map(event => ({
      _id: event._id,
      title: event.title || 'Untitled',
      description: event.description || '',
      startTime: event.scheduling?.startTimeFormatted || '',
      endTime: event.scheduling?.endDate
        ? new Date(event.scheduling.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '',
      image: wixImageToUrl(event.mainImage) || '',
      location: event.location?.name || '',
      url: event.eventUrl ? `${event.eventUrl.baseUrl}${event.eventUrl.path}` : '',
      categories: event.categories || [],
    }))
  }));


  cleanCategories = categories
    .filter(cat => !cat.states?.includes('HIDDEN'))
    .filter(cat => cat.name !== '2026 Festival of Arts')
    .filter((cat, index, self) =>
      index === self.findIndex(c => c.name === cat.name)
    );

  components.forEach(trySend);
});