import { useState, useEffect } from 'react';

// Той самий підхід, що й у мобільному застосунку (src/hooks/useExchangeRate.ts):
// курс НБУ з відкритого API, з тим самим фолбеком, якщо запит не вдався.
const FALLBACK_RATE = 41.4;

export function useExchangeRate() {
  const [rate, setRate] = useState<number>(FALLBACK_RATE);

  useEffect(() => {
    let cancelled = false;
    fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json')
      .then((res) => res.json())
      .then((data) => {
        const nbuRate = data?.[0]?.rate;
        if (!cancelled && typeof nbuRate === 'number' && nbuRate > 0) setRate(nbuRate);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return { rate };
}
