import Constants from 'expo-constants';

function fmtDate(date) {
    if (!date) return 'Select Date';
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
}

function buildGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    let offset = firstDay.getDay() - 1;
    if (offset < 0) offset = 6;
    const total = new Date(year, month + 1, 0).getDate();
    const cells = [
      ...Array(offset).fill(null),
      ...Array.from({ length: total }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
}

// Dynamically get the host IP address of the machine running Metro bundler
// (only populated during live `expo start` development). A standalone/production
// build (like a compiled APK) has no Metro server attached, so hostUri is empty
// and it falls back to the deployed backend the web app also uses.
const debuggerHost = Constants.expoConfig?.hostUri || '';
const hostIp = debuggerHost.split(':').shift();
const API_BASE_URL = hostIp ? `http://${hostIp}:5000/` : "http://202.83.167.229:3000/";

function formatCompletedAt(dateStr) {
    if (!dateStr) return '-';
    // If it's already in the custom format (like "14-07-2026 01:14 PM"), just return it
    if (String(dateStr).includes(' ') && String(dateStr).includes('-')) {
        return dateStr;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    
    const h24 = date.getHours();
    const h12 = h24 % 12 || 12;
    const ampm = h24 < 12 ? 'AM' : 'PM';
    
    return (
      `${String(date.getDate()).padStart(2,'0')}-` +
      `${String(date.getMonth()+1).padStart(2,'0')}-` +
      `${date.getFullYear()} ` +
      `${String(h12).padStart(2,'0')}:` +
      `${String(date.getMinutes()).padStart(2,'0')} ${ampm}`
    );
}

// Windowed page-number list for pagination controls, e.g. for page=6, total=29:
// [1, '...', 5, 6, 7, '...', 29] instead of rendering all 29 buttons.
function getPaginationRange(current, total, siblingCount = 1) {
  const totalNumbers = siblingCount * 2 + 5; // first + last + current + 2 siblings + 2 ellipsis slots
  if (total <= totalNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from({ length: 3 + siblingCount * 2 }, (_, i) => i + 1);
    return [...leftRange, '...', total];
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = 3 + siblingCount * 2;
    const rightRange = Array.from({ length: rightCount }, (_, i) => total - rightCount + i + 1);
    return [1, '...', ...rightRange];
  }
  const middleRange = Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i);
  return [1, '...', ...middleRange, '...', total];
}

export { buildGrid, fmtDate, API_BASE_URL, formatCompletedAt, getPaginationRange };

