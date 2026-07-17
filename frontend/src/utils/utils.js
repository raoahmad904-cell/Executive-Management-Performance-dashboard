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
const debuggerHost = Constants.expoConfig?.hostUri || '';
const hostIp = debuggerHost.split(':').shift();
const API_BASE_URL = hostIp ? `http://${hostIp}:5000/` : "http://10.30.7.170:5000/"; 

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

export { buildGrid, fmtDate, API_BASE_URL, formatCompletedAt };

