import { wixEvents } from "wix-events-backend";
import { Permissions, webMethod } from "wix-web-module";

async function filterEventsByDate(date) {
  const startOfDay = date ? new Date(date) : new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const results = await wixEvents.queryEvents().find();

  return results.items.filter(event => {
    const start = new Date(event.scheduling.startDate);
    const end = new Date(event.scheduling.endDate);
    return start <= endOfDay && end >= startOfDay;
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