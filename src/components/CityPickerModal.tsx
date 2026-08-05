import { createPortal } from 'react-dom';
import { useCities } from '../hooks/useCities';
import { useCity } from '../contexts/CityContext';

export function CityPickerModal({ onClose }: { onClose: () => void }) {
  const { cities } = useCities();
  const { city: selectedCity, setCity } = useCity();

  function handleSelect(name: string) {
    setCity(name);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[70vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-extrabold text-coffee-dark text-lg">Оберіть місто</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-coffee-chip flex items-center justify-center text-coffee-dark">✕</button>
        </div>
        <div className="flex flex-col gap-2">
          {cities.map((c) => {
            const active = c.name === selectedCity;
            return (
              <button
                key={c.id}
                onClick={() => handleSelect(c.name)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-left font-semibold transition-colors ${
                  active ? 'bg-coffee-blue-light text-coffee-blue border-2 border-coffee-blue' : 'bg-coffee-chip text-coffee-dark border-2 border-transparent hover:border-coffee-line'
                }`}
              >
                {c.name}
                {active && <span className="font-extrabold">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
