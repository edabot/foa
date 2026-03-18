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
  let allCategories = null;

  const { window: { width } } = await getBoundingRect();
  $w('#eventsHtml').width = width;

  function trySend() {
    if (groupedDays && allCategories) {
// Deduplicate by name and filter out AUTO/HIDDEN categories
const cleanCategories = categories
  .filter(cat => !cat.states?.includes('HIDDEN'))
  .filter((cat, index, self) =>
    index === self.findIndex(c => c.name === cat.name)
  );

$w('#eventsHtml').postMessage({
  type: 'LOAD_EVENTS',
  data: { days: groupedDays, categories: cleanCategories }
});
    }
  }

  // Single onMessage handler for everything
  $w('#eventsHtml').onMessage(e => {
    console.log('page received:', e.data?.type);
    if (e.data?.type === 'IFRAME_READY') {
      trySend();
    }
  if (e.data?.type === 'RESIZE') {
    $w('#eventsHtml').height = e.data.height + 20;
  }
  });

  const { days, categories } = await getEventsByDaysMethod(DAYS);

  groupedDays = days.map(day => ({
    label: day.label,
    events: day.events.map(event => ({
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

  allCategories = categories;

  trySend();
});