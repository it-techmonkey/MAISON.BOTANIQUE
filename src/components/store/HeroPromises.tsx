import { Bi } from './blocks';
import { FlowerIcon, GiftIcon, HeartIcon, TruckIcon } from './icons';

const TRUST = [
  { icon: <TruckIcon />, text: { en: 'Same-day delivery across the UAE', ar: 'توصيل في اليوم نفسه في جميع أنحاء الإمارات' } },
  { icon: <GiftIcon />, text: { en: 'A handwritten card with every gift', ar: 'بطاقة بخط اليد مع كل هدية' } },
  { icon: <FlowerIcon />, text: { en: 'Fresh, premium blooms', ar: 'زهور طازجة فاخرة' } },
  { icon: <HeartIcon />, text: { en: 'Thoughtfully packaged', ar: 'تغليف مدروس بعناية' } },
];

export default function HeroPromises() {
  return <ul className="hero-promises">{TRUST.map((item) => <li key={item.text.en}>{item.icon}<span><Bi text={item.text} /></span></li>)}</ul>;
}
