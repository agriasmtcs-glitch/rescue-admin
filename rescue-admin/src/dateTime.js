// Időkezelés segédfüggvények nemzetközi alkalmazáshoz

// Felhasználó időzónájának észlelése
export const getUserTimeZone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// UTC dátum átalakítása helyi időre
export const convertUTCToLocal = (utcDateString) => {
  if (!utcDateString) return null;
  
  const date = new Date(utcDateString);
  // Ha a dátum érvénytelen, visszaadunk null-t
  if (isNaN(date.getTime())) return null;
  
  return date;
};

// Dátum formázása a felhasználó nyelvi beállításai szerint
export const formatDateTime = (date, language = 'hu-HU') => {
  if (!date) return 'N/A';
  
  return new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: getUserTimeZone()
  }).format(date);
};

// Dátum formázása relatív idő formátumban (pl. "2 órája")
export const formatRelativeTime = (date, language = 'hu') => {
  if (!date) return 'N/A';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(-diffInSeconds, 'second');
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(-diffInMinutes, 'minute');
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(-diffInHours, 'hour');
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(-diffInDays, 'day');
};

// Két dátum közötti eltérés másodpercben
export const getTimeDifference = (date1, date2) => {
  if (!date1 || !date2) return 0;
  return (new Date(date1) - new Date(date2)) / 1000;
};