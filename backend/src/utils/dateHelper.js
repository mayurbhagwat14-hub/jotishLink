/**
 * Utility to reliably get precise IST (Indian Standard Time) date boundaries 
 * regardless of the server's local timezone settings or DST transitions.
 */

// Gets the current date/time adjusted to IST, then formatted to a specific start boundary
const getISTBoundary = (offsetDays = 0, startOfMonth = false) => {
  const now = new Date();
  
  // Format current date explicitly into IST to extract exact year, month, day in India
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  let day = parts.find(p => p.type === 'day').value;

  if (startOfMonth) {
    day = '01';
  }

  // Construct standard ISO string for Midnight IST
  let targetDate = new Date(`${year}-${month}-${day}T00:00:00+05:30`);
  
  if (offsetDays !== 0) {
    // Add/subtract exactly 24 hours. India has no DST, so days are always exactly 24h.
    targetDate = new Date(targetDate.getTime() + (offsetDays * 24 * 60 * 60 * 1000));
  }

  return targetDate;
};

export const getISTStartOfToday = () => getISTBoundary(0);
export const getISTStartOfSevenDaysAgo = () => getISTBoundary(-6); 
export const getISTStartOfMonth = () => getISTBoundary(0, true);

export const getISTStartOfLastMonth = () => {
  const thisMonthStart = getISTBoundary(0, true);
  // Subtract one day to get into last month safely
  const lastDayOfLastMonth = new Date(thisMonthStart.getTime() - 24 * 60 * 60 * 1000);
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit'
  });
  
  const parts = formatter.formatToParts(lastDayOfLastMonth);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  
  return new Date(`${year}-${month}-01T00:00:00+05:30`);
};

export const getISTEndOfToday = () => {
  const startOfToday = getISTStartOfToday();
  return new Date(startOfToday.getTime() + (24 * 60 * 60 * 1000) - 1);
};
