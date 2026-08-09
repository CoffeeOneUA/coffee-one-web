import { useCategories } from '../hooks/useCategories';
import { useBrands } from '../hooks/useBrands';
import { useModels } from '../hooks/useModels';
import type { ListingFilters } from '../hooks/useListings';

const CONDITIONS = [
  { value: 'new', label: 'Нове' },
  { value: 'used', label: 'Вживане' },
];
const GROUPS = ['1', '2', '3'];
const PRICE_MAX = 1_000_000;
const PRICE_STEP = 5000;

interface Props {
  filters: ListingFilters;
  onChange: (next: ListingFilters) => void;
  onReset: () => void;
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <div className="text-[11px] font-bold text-coffee-muted uppercase tracking-wide mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = selected.includes(o.value);
          return (
            <button
              key={o.value}
              onClick={() => onToggle(o.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                active ? 'bg-coffee-dark text-white border-coffee-dark' : 'bg-coffee-chip text-coffee-dark border-coffee-line hover:border-coffee-blue'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterPanel({ filters, onChange, onReset }: Props) {
  const { categories } = useCategories();
  const { brands } = useBrands();
  const selectedBrand = brands.find((b) => b.slug === filters.brand);
  const { models } = useModels(selectedBrand?.id ?? null);

  function toggleArray(key: 'condition' | 'groups', value: string) {
    const current = filters[key] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next });
  }

  const hasActive =
    !!filters.category || !!filters.brand || !!filters.modelId || (filters.condition?.length ?? 0) > 0 || (filters.groups?.length ?? 0) > 0 || filters.priceMin != null || filters.priceMax != null;

  return (
    <div className="bg-coffee-surface rounded-2xl p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-coffee-dark">Фільтри</span>
        {hasActive && (
          <button onClick={onReset} className="text-xs font-bold text-coffee-red">
            Скинути все
          </button>
        )}
      </div>

      <div>
        <div className="text-[11px] font-bold text-coffee-muted uppercase tracking-wide mb-2">Тип</div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const active = filters.category === c.slug;
            return (
              <button
                key={c.id}
                onClick={() => onChange({ ...filters, category: active ? undefined : c.slug })}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  active ? 'bg-coffee-dark text-white border-coffee-dark' : 'bg-coffee-chip text-coffee-dark border-coffee-line hover:border-coffee-blue'
                }`}
              >
                {c.emoji} {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-bold text-coffee-muted uppercase tracking-wide mb-2">Бренд</div>
        <div className="flex flex-wrap gap-1.5">
          {brands.map((b) => {
            const active = filters.brand === b.slug;
            return (
              <button
                key={b.id}
                onClick={() => onChange({ ...filters, brand: active ? undefined : b.slug, modelId: undefined })}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  active ? 'bg-coffee-dark text-white border-coffee-dark' : 'bg-coffee-chip text-coffee-dark border-coffee-line hover:border-coffee-blue'
                }`}
              >
                {b.name}
              </button>
            );
          })}
        </div>
      </div>

      {selectedBrand && models.length > 0 && (
        <div>
          <div className="text-[11px] font-bold text-coffee-muted uppercase tracking-wide mb-2">Модель</div>
          <div className="flex flex-wrap gap-1.5">
            {models.map((m) => {
              const active = filters.modelId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onChange({ ...filters, modelId: active ? undefined : m.id })}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    active ? 'bg-coffee-dark text-white border-coffee-dark' : 'bg-coffee-chip text-coffee-dark border-coffee-line hover:border-coffee-blue'
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <ChipGroup label="Стан" options={CONDITIONS} selected={filters.condition ?? []} onToggle={(v) => toggleArray('condition', v)} />
      <ChipGroup label="Кількість груп" options={GROUPS.map((g) => ({ value: g, label: `${g} групи` }))} selected={filters.groups ?? []} onToggle={(v) => toggleArray('groups', v)} />

      <div>
        <div className="text-[11px] font-bold text-coffee-muted uppercase tracking-wide mb-2">
          Ціна: {(filters.priceMin ?? 0).toLocaleString('uk-UA')} — {filters.priceMax != null ? filters.priceMax.toLocaleString('uk-UA') : `${PRICE_MAX.toLocaleString('uk-UA')}+`} ₴
        </div>
        <input
          type="range"
          min={0}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={filters.priceMin ?? 0}
          onChange={(e) => onChange({ ...filters, priceMin: Number(e.target.value) || undefined })}
          className="w-full accent-[#187FD8]"
        />
        <input
          type="range"
          min={0}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={filters.priceMax ?? PRICE_MAX}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange({ ...filters, priceMax: v >= PRICE_MAX ? undefined : v });
          }}
          className="w-full accent-[#187FD8] mt-1"
        />
      </div>
    </div>
  );
}
