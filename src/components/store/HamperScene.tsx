'use client';

import { hamperCutout, HAMPER_SLOTS, type HamperItem, type SlotId } from '@/lib/hamper';
import { useStore } from './StoreProvider';

// One fixed place per slot, so every hamper is composed the same way: [x centre %, bottom %, width %, height %].
// Items are fitted into their box (never stretched), stand on a soft shadow and do not overlap, except the treat in front of the basket.
const POSITION: Record<SlotId, [number, number, number, number]> = {
  basket: [50, 8, 54, 54],
  light: [14, 52, 27, 40],
  blessing: [86, 52, 27, 40],
  table: [14, 10, 27, 38],
  everyday: [86, 10, 27, 38],
  extra: [50, 64, 22, 28],
  treat: [50, 2, 24, 24],
  treat2: [50, 2, 24, 24],
};
const TWO_TREATS: Partial<Record<SlotId, [number, number, number, number]>> = { treat: [40, 2, 20, 20], treat2: [60, 2, 20, 20] };

interface SceneProps { items: Partial<Record<SlotId, HamperItem>>; onPick?: (slot: SlotId) => void }

/** The hamper as a picture: the chosen basket in the middle, four pieces around it and the treat in front. */
export default function HamperScene({ items, onPick }: SceneProps) {
  const { ar, t } = useStore();
  const twoTreats = !!items.treat && !!items.treat2;

  return (
    <div className="scene" role="group" aria-label={t('Your hamper', 'سلتك')}>
      {HAMPER_SLOTS.map((slot) => {
        const item = items[slot.id];
        const [x, bottom, width, height] = (twoTreats && TWO_TREATS[slot.id]) || POSITION[slot.id];
        const style = { left: `${x}%`, bottom: `${bottom}%`, width: `${width}%`, height: `${height}%`, zIndex: slot.id === 'basket' ? 20 : slot.id.startsWith('treat') ? 30 : 10 };
        const label = ar ? slot.ar : slot.en;
        if (!item) {
          if (slot.optional) return null;
          return <button key={slot.id} type="button" className="scene-item scene-item--empty" style={style} onClick={() => onPick?.(slot.id)} aria-label={`${t('Choose', 'اختر')}: ${label}`}><span>{label}</span></button>;
        }
        const name = ar ? item.ar : item.en;
        return (
          <button key={`${slot.id}-${item.code}`} type="button" className="scene-item" style={style} onClick={() => onPick?.(slot.id)} aria-label={`${label}: ${name}. ${t('Swap', 'استبدال')}`} title={`${name} · ${t('tap to swap', 'اضغط للاستبدال')}`}>
            <img src={hamperCutout(item.code)} alt="" draggable={false} />
          </button>
        );
      })}
    </div>
  );
}
