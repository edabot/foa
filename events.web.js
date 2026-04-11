import { wixEvents } from "wix-events-backend";
import { Permissions, webMethod } from "wix-web-module";

async function filterEventsByDate(date) {
  // Events use America/New_York (EDT = UTC-4).
  // Shift day boundaries by 4 hours so midnight EDT (04:00 UTC) is the cutoff,
  // preventing late-evening events from spilling into the next UTC day.
  const EDT_OFFSET_MS = 4 * 60 * 60 * 1000;

  const base = new Date(date);
  base.setUTCHours(0, 0, 0, 0);
  const startOfDay = new Date(base.getTime() + EDT_OFFSET_MS);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  const results = await wixEvents.queryEvents().limit(1000).find();

  return results.items.filter(event => {
    const start = new Date(event.scheduling.startDate);
    return start >= startOfDay && start <= endOfDay;
  });
}

export async function getEventsByDays(days = [], categories = []) {
  // Fetch all days in parallel
  const allDayEvents = await Promise.all(days.map(day => filterEventsByDate(day.date)));

  // Collect unique categories across all days
  const uniqueCategories = [
    ...new Map(
      allDayEvents
        .flat()
        .flatMap(event => event.categories || [])
        .map(cat => [cat._id, cat])
    ).values()
  ];

  // Build grouped result, applying category filter if provided
  const groupedEvents = days.map((day, i) => {
    let events = allDayEvents[i];

    if (categories.length > 0) {
      events = events.filter(event =>
        event.categories?.some(cat => categories.includes(cat._id))
      );
    }

    return {
      date: day.date,
      label: day.label,
      events,
    };
  });

  return {
    days: groupedEvents,
    categories: uniqueCategories,
  };
}

export const getEventsByDaysMethod = webMethod(Permissions.Anyone, getEventsByDays);