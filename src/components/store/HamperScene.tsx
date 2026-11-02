'use client';

import { hamperCutout, type HamperItem } from '@/lib/hamper';
import { useStore } from './StoreProvider';

// Where each piece stands behind the basket rim: [x centre %, bottom %, width %, tilt deg], middle piece in front.
const PIECES: Array<Array<[number, number, number, number]>> = [
  [],
  [[50, 50, 36, 0]],
  [[33, 50, 34, -4], [67, 50, 34, 4]],
  [[20, 48, 30, -5], [50, 54, 34, 0], [80, 48, 30, 5]],
  [[16, 46, 28, -6], [38, 54, 30, -2], [62, 54, 30, 2], [84, 46, 28, 6]],
  [[13, 44, 25, -7], [31, 53, 27, -3], [50, 58, 29, 0], [69, 53, 27, 3], [87, 44, 25, 7]],
];
// Treats sit in front of the basket.
const TREATS: Array<Array<[number, number, number]>> = [[], [[70, 4, 24]], [[70, 4, 22], [30, 4, 22]], [[72, 4, 21], [28, 4, 21], [50, 0, 19]]];

interface SceneProps { basket?: HamperItem; picks: HamperItem[]; treats: HamperItem[]; onRemove?: (item: HamperItem) => void; mini?: boolean }

/** The hamper as a picture: cut-out photos arranged on a table, the basket at the back with pieces rising from it and treats in front. */
export default function HamperScene({ basket, picks, treats, onRemove, mini }: SceneProps) {
  const { ar, t } = useStore();
  const empty = !basket && !picks.length && !treats.length;
  const layout = PIECES[Math.min(picks.length, 5)];
  const treatLayout = TREATS[Math.min(treats.length, 3)];

  const piece = (item: HamperItem, style: React.CSSProperties, z: number, key: string, kind = 'piece') => {
    const name = ar ? item.ar : item.en;
    const image = <img src={hamperCutout(item.code)} alt={mini ? '' : name} draggable={false} />;
    return !mini && onRemove
      ? <button key={key} type="button" className={`scene-item scene-item--${kind}`} style={{ ...style, zIndex: z }} title={`${t('Remove', 'إزالة')}: ${name}`} aria-label={`${t('Remove', 'إزالة')} ${name}`} onClick={() => onRemove(item)}>{image}</button>
      : <span key={key} className={`scene-item scene-item--${kind}`} style={{ ...style, zIndex: z }}>{image}</span>;
  };

  return (
    <div className={`scene${mini ? ' scene--mini' : ''}`} {...(mini ? { 'aria-hidden': true } : { role: 'group', 'aria-label': t('Your hamper', 'سلتك') })}>
      <span className="scene__shadow" />
      {picks.slice(0, 5).map((item, i) => {
        const [x, bottom, width, tilt] = layout[i];
        return piece(item, { left: `${x}%`, bottom: `${bottom}%`, width: `${width}%`, height: `${Math.min(36, 96 - bottom)}%`, transform: `translateX(-50%) rotate(${tilt}deg)` }, 10 + (i === Math.floor(layout.length / 2) ? 2 : 0), item.code);
      })}
      {basket && piece(basket, { left: '50%', bottom: '7%', width: '64%', height: '46%', transform: 'translateX(-50%)' }, 20, basket.code, 'basket')}
      {treats.slice(0, 3).map((item, i) => {
        const [x, bottom, width] = treatLayout[i];
        return piece(item, { left: `${x}%`, bottom: `${bottom}%`, width: `${width}%`, height: `${Math.min(28, 96 - bottom)}%`, transform: 'translateX(-50%)' }, 30 + i, item.code);
      })}
      {empty && !mini && <p className="scene__empty">{t('Choose a basket or pick a ready-made hamper and it appears here.', 'اختر سلة أو هدية جاهزة وستظهر هنا.')}</p>}
    </div>
  );
}
