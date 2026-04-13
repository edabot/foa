import { wixEvents } from "wix-events-backend";
import { Permissions, webMethod } from "wix-web-module";

// EDT = UTC-4. Shift day boundaries so midnight EDT (04:00 UTC) is the cutoff.
const EDT_OFFSET_MS = 4 * 60 * 60 * 1000;

let cachedEvents = null;
let cacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function dayBounds(date) {
  const base = new Date(date);
  base.setUTCHours(0, 0, 0, 0);
  const start = new Date(base.getTime() + EDT_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

export async function getEventsByDays(days = [], categories = []) {
  if (!cachedEvents || Date.now() - cacheTime > CACHE_TTL_MS) {
    const results = await wixEvents.queryEvents().limit(1000).find();
    cachedEvents = results.items;
    cacheTime = Date.now();
  }
  const allEvents = cachedEvents;

  const uniqueCategories = [
    ...new Map(
      allEvents
        .flatMap(event => event.categories || [])
        .map(cat => [cat._id, cat])
    ).values()
  ];

  const groupedEvents = days.map(day => {
    const { start, end } = dayBounds(day.date);
    let events = allEvents.filter(event => {
      const s = new Date(event.scheduling.startDate);
      return s >= start && s <= end;
    });

    if (categories.length > 0) {
      events = events.filter(event =>
        event.categories?.some(cat => categories.includes(cat._id))
      );
    }

    return { date: day.date, label: day.label, events };
  });

  return { days: groupedEvents, categories: uniqueCategories };
}

export const getEventsByDaysMethod = webMethod(Permissions.Anyone, getEventsByDays);