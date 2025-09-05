import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  convertUTCToLocal,
  formatDateTime,
  formatRelativeTime,
  getUserTimeZone
} from '../utils/dateTime';

const useDateTime = () => {
  const { i18n } = useTranslation();
  const [userTimeZone, setUserTimeZone] = useState(getUserTimeZone());
  
  // Nyelv váltáskor frissítjük a dátumformázót
  useEffect(() => {
    setUserTimeZone(getUserTimeZone());
  }, [i18n.language]);
  
  const formatDate = (utcDateString, options = {}) => {
    const localDate = convertUTCToLocal(utcDateString);
    if (!localDate) return 'N/A';
    
    return formatDateTime(localDate, i18n.language);
  };
  
  const formatRelative = (utcDateString) => {
    const localDate = convertUTCToLocal(utcDateString);
    if (!localDate) return 'N/A';
    
    return formatRelativeTime(localDate, i18n.language.split('-')[0]);
  };
  
  const getLocalDate = (utcDateString) => {
    return convertUTCToLocal(utcDateString);
  };
  
  return {
    formatDate,
    formatRelative,
    getLocalDate,
    userTimeZone
  };
};

export default useDateTime;