import type { Bilingual } from '@/lib/site';

// The Maison Botanique × Bikanervala Diwali gifts shown at /diwali/bikanervala.

export type DiwaliGroupId = 'pilot' | 'prototype' | 'a' | 'b' | 'c' | 'd' | 'e';

export interface DiwaliGift {
  id: string;
  name: Bilingual;
  /** The Maison Botanique arrangement the gift starts from. */
  maison: string;
  /** The same arrangement in Arabic (the catalogue's Arabic name where it has one). */
  maisonAr: string;
  /** The Bikanervala sweets that come with it. */
  sweets: string;
  presentation: Bilingual;
  group: DiwaliGroupId;
  /** Only the flowers scale with Signature, Grand and Luxe; this gift has none. */
  oneSize?: boolean;
}

export const DIWALI_GIFTS: DiwaliGift[] = [
  { id: 'ivory-kaju', name: { en: 'Ivory & Kaju', ar: 'العاج والكاجو' }, maison: 'Classic Pink & White Rose Bouquet', maisonAr: 'إيلويز — باقة ورد وردي وأبيض', sweets: 'Kaju Katli',
    presentation: { en: 'A slim drawer of Kaju Katli slides out from under the bouquet.', ar: 'ينزلق درج نحيف من حلوى كاجو كاتلي من أسفل الباقة.' }, group: 'pilot' },
  { id: 'ruby-kaju', name: { en: 'Ruby & Kaju', ar: 'الياقوت والكاجو' }, maison: 'Grand Red Rose Bouquet with 16 Ferrero Rocher', maisonAr: 'غراندور — باقة ورد أحمر مع 16 فيريرو روشيه', sweets: 'Kaju Katli mini boxes',
    presentation: { en: 'Sealed Kaju Katli boxes take the place of the chocolates in this red-rose format.', ar: 'تحل علب كاجو كاتلي المغلقة محل الشوكولاتة في تنسيق الورد الأحمر.' }, group: 'pilot' },
  { id: 'rose-drawer', name: { en: 'The Rose Drawer', ar: 'درج الورد' }, maison: 'Pink & White Roses in a Box', maisonAr: 'دولتشي — صندوق ورد وردي وأبيض', sweets: 'Kaju Katli',
    presentation: { en: 'Roses on top, with a pull-out sweet drawer below.', ar: 'الورود في الأعلى ودرج الحلوى القابل للسحب في الأسفل.' }, group: 'pilot' },
  { id: 'mithai-posy', name: { en: 'Mithai Posy', ar: 'باقة الميثاي' }, maison: 'Classic Pink & White Rose Bouquet', maisonAr: 'إيلويز — باقة ورد وردي وأبيض', sweets: 'Sealed Kaju Katli mini boxes',
    presentation: { en: 'Mini sweet boxes sit among the roses on a rigid inner frame.', ar: 'تستقر علب الحلوى الصغيرة بين الورود على إطار داخلي متين.' }, group: 'prototype' },
  { id: 'bouquet-of-bikanervala', name: { en: 'A Bouquet of Bikanervala', ar: 'باقة بيكانيرفالا' }, maison: 'Maison Botanique bouquet craft (no flowers)', maisonAr: 'تنسيق باقة من ميزون بوتانيك دون زهور', sweets: 'Mixed sealed mini boxes',
    presentation: { en: 'A bouquet built entirely from sealed Bikanervala boxes.', ar: 'باقة مصنوعة بالكامل من علب بيكانيرفالا المغلقة.' }, group: 'prototype', oneSize: true },
  { id: 'diwali-desk', name: { en: 'The Diwali Desk', ar: 'هدية ديوالي للمكتب' }, maison: 'Three Box Arrangement', maisonAr: 'تريبتيك — تنسيق زهور بثلاثة صناديق', sweets: 'Kaju Katli and Aangan Bahaar',
    presentation: { en: 'Flowers, sweets and dry fruit presented as one corporate gift.', ar: 'زهور وحلوى وفواكه مجففة في هدية واحدة للشركات.' }, group: 'prototype' },
  { id: 'ruby-laddu', name: { en: 'Ruby & Laddu', ar: 'الياقوت واللدو' }, maison: 'Luxury Red, Pink & White Rose Bouquet', maisonAr: 'أفلين — باقة ورد أحمر ووردي وأبيض', sweets: 'Motichoor Laddu',
    presentation: { en: 'A jewel-toned rose bouquet and a separate Motichoor Laddu gift box.', ar: 'باقة ورد بألوان الجواهر مع علبة مستقلة من موتيشور لدو.' }, group: 'a' },
  { id: 'pearl-cashew', name: { en: 'Pearl & Cashew', ar: 'اللؤلؤ والكاجو' }, maison: 'Pearl White Rose Bouquet', maisonAr: 'ناكر — باقة ورد أبيض لؤلؤي', sweets: 'Assorted Kaju Sweets',
    presentation: { en: 'White roses with an ivory sleeve of assorted cashew sweets.', ar: 'ورود بيضاء مع علبة عاجية لحلويات الكاجو المشكلة.' }, group: 'a' },
  { id: 'blush-peda', name: { en: 'Blush & Peda', ar: 'الوردي والبيدا' }, maison: 'Blush Pink Rose Bouquet', maisonAr: 'روزاموند — باقة ورد وردي فاتح', sweets: 'Assorted Peda',
    presentation: { en: 'Blush roses and a matching, removable box of Peda.', ar: 'ورود وردية مع علبة بيدا متناسقة قابلة للفصل.' }, group: 'a' },
  { id: 'festival-rose', name: { en: 'The Festival Rose', ar: 'ورد العيد' }, maison: 'White & Red Roses Bouquet', maisonAr: 'إينيس — باقة ورد أحمر وأبيض', sweets: 'Khoya Burfi',
    presentation: { en: 'A red-and-white bouquet with a separate Khoya Burfi box in the carry case.', ar: 'باقة حمراء وبيضاء مع علبة مستقلة من خويا برفي في الحامل.' }, group: 'a' },
  { id: 'white-abundance', name: { en: 'White Abundance', ar: 'وفرة بيضاء' }, maison: 'Timeless Bouquet of 100 White Roses', maisonAr: 'بيرل — باقة من 100 وردة بيضاء', sweets: 'Assorted Dryfruit Sweets',
    presentation: { en: 'A generous white-rose gift with a large assorted dry-fruit sweet box.', ar: 'هدية من الورود البيضاء مع علبة كبيرة من حلويات الفواكه المجففة.' }, group: 'a' },
  { id: 'golden-hour', name: { en: 'Golden Hour', ar: 'الساعة الذهبية' }, maison: 'Sunflower & Golden Rose Bouquet', maisonAr: 'أمبر — باقة دوار الشمس وورد ذهبي', sweets: 'Motichoor Laddu',
    presentation: { en: 'Golden flowers and Motichoor Laddu share a warm festive palette.', ar: 'زهور ذهبية وموتيشور لدو في لوحة ألوان احتفالية دافئة.' }, group: 'a' },
  { id: 'summer-mithai', name: { en: 'Summer Mithai', ar: 'حلوى الصيف' }, maison: 'Pink Summer Bouquet', maisonAr: 'بوميلو — باقة زهور صيفية وردية', sweets: 'Assorted Khoya Sweets',
    presentation: { en: 'An airy pink bouquet paired with assorted Khoya sweets.', ar: 'باقة وردية خفيفة مع حلويات خويا المشكلة.' }, group: 'a' },
  { id: 'lily-celebration', name: { en: 'Lily Celebration', ar: 'احتفال الزنبق' }, maison: 'Birthday Bouquet with Lilies & Baby Rose', maisonAr: 'بوبي — باقة عيد ميلاد بالزنبق والورد الصغير', sweets: 'Milk Cake',
    presentation: { en: 'Lilies and baby roses with a separately packed Milk Cake gift.', ar: 'زنابق وورود صغيرة مع هدية ميلك كيك في عبوة مستقلة.' }, group: 'a' },
  { id: 'colour-cashew', name: { en: 'Colour & Cashew', ar: 'ألوان وكاجو' }, maison: 'Rainbow Wildflower Garden Bouquet', maisonAr: 'ميدولارك — باقة زهور برية من الحديقة', sweets: 'Assorted Kaju Sweets',
    presentation: { en: 'Colourful wildflowers beside a restrained ivory Kaju sweet box.', ar: 'زهور برية ملونة بجانب علبة عاجية هادئة من حلويات الكاجو.' }, group: 'a' },
  { id: 'rose-lily-gift', name: { en: 'The Rose & Lily Gift', ar: 'هدية الورد والزنبق' }, maison: 'Bouquet of Pink Lilies and Pink Roses', maisonAr: 'جينيفيف — باقة زنبق وورد وردي', sweets: 'Assorted Peda',
    presentation: { en: 'Pink lilies and roses with a slim Peda box secured to the carrier.', ar: 'زنابق وورود وردية مع علبة بيدا نحيفة مثبتة بالحامل.' }, group: 'a' },
  { id: 'midnight-kaju', name: { en: 'Midnight & Kaju', ar: 'الليل والكاجو' }, maison: 'Black Box of 100 Red Roses', maisonAr: 'نوار — صندوق أسود من 100 وردة حمراء', sweets: 'Kaju Katli tray in the lid',
    presentation: { en: 'A red-rose box with a separate, sealed Kaju Katli tray fitted into the lid.', ar: 'علبة ورود حمراء مع صينية كاجو كاتلي مغلقة ومستقلة داخل الغطاء.' }, group: 'b' },
  { id: 'sweet-letter', name: { en: 'The Sweet Letter', ar: 'الحرف الحلو' }, maison: 'Customized Letter – Red Roses Bouquet', maisonAr: 'مونوغرام — باقة ورد أحمر بحرف مخصص', sweets: 'Kaju Katli',
    presentation: { en: 'A floral initial paired with a Kaju Katli box carrying the same letter.', ar: 'حرف من الورود مع علبة كاجو كاتلي تحمل الحرف نفسه.' }, group: 'b' },
  { id: 'sharing-circle', name: { en: 'The Sharing Circle', ar: 'دائرة المشاركة' }, maison: 'Soft Elegance Roundbox Arrangement', maisonAr: 'روندل — صندوق زهور دائري ناعم', sweets: 'Assorted Dryfruit Sweets in a removable ring',
    presentation: { en: 'A removable ring of sealed sweets surrounds the floral roundbox.', ar: 'تطوق علب حلوى مغلقة قابلة للإزالة صندوق الزهور الدائري.' }, group: 'b' },
  { id: 'laddu-sunburst', name: { en: 'Laddu Sunburst', ar: 'شمس اللدو' }, maison: 'Sunflower & Golden Rose Bouquet', maisonAr: 'أمبر — باقة دوار الشمس وورد ذهبي', sweets: 'Motichoor Laddu mini boxes',
    presentation: { en: 'Mini Laddu boxes radiate around a sunflower centre.', ar: 'تنتشر علب اللدو الصغيرة حول مركز من دوار الشمس.' }, group: 'c' },
  { id: 'festival-fan', name: { en: 'The Festival Fan', ar: 'مروحة العيد' }, maison: 'Elegant Bouquet of Mix Flowers', maisonAr: 'موزاييك — باقة زهور مشكّلة', sweets: 'Kaju Katli, Peda and Laddu mini boxes',
    presentation: { en: 'Three kinds of sealed sweet boxes fan out behind a compact floral centre.', ar: 'تنتشر ثلاثة أصناف من علب الحلوى المغلقة خلف تنسيق زهور مركزي.' }, group: 'c' },
  { id: 'marigold-mithai', name: { en: 'Marigold & Mithai', ar: 'القطيفة والميثاي' }, maison: 'New marigold and orange rose bouquet (not yet in our catalogue)', maisonAr: 'باقة جديدة من القطيفة والورد البرتقالي، غير متوفرة في الكتالوج بعد', sweets: 'Kaju Katli',
    presentation: { en: 'A new festive marigold-and-rose direction paired with Kaju Katli.', ar: 'فكرة احتفالية جديدة من القطيفة والورد البرتقالي مع كاجو كاتلي.' }, group: 'd' },
  { id: 'rangoli-box', name: { en: 'The Rangoli Box', ar: 'علبة الرانغولي' }, maison: 'Roses & Carnations in Box', maisonAr: 'كلوفر — صندوق ورد وقرنفل', sweets: 'Sealed Kaju Katli box',
    presentation: { en: 'Petals form a rangoli around a sealed, removable sweet box.', ar: 'تشكّل البتلات زخرفة رانغولي حول علبة حلوى مغلقة وقابلة للإزالة.' }, group: 'd' },
  { id: 'diya-box', name: { en: 'The Diya Box', ar: 'علبة الديا' }, maison: 'Mix Flowers in Box', maisonAr: 'باتشوورك — صندوق زهور مشكّلة', sweets: 'Kaju Katli and a clay diya',
    presentation: { en: 'A floral box, separate Kaju Katli sweets and an unlit clay diya.', ar: 'علبة زهور وحلوى كاجو كاتلي مستقلة ومصباح ديا فخاري غير مشتعل.' }, group: 'd' },
  { id: 'gift-for-host', name: { en: 'A Gift for the Host', ar: 'هدية للمضيف' }, maison: 'Basket Arrangement of White Roses', maisonAr: 'كاميليا — سلة ورد أبيض', sweets: 'Aangan Bahaar',
    presentation: { en: 'White roses and an Aangan Bahaar box in its own basket compartment.', ar: 'ورود بيضاء وعلبة آنغان باهار في قسم مستقل من السلة.' }, group: 'e' },
  { id: 'dry-fruit-luxe', name: { en: 'Dry Fruit Luxe', ar: 'فخامة الفواكه المجففة' }, maison: 'Dry Fruit Luxe Hamper', maisonAr: 'صحراء — سلة فواكه مجففة فاخرة', sweets: 'Bikanervala dry-fruit box',
    presentation: { en: 'A host hamper with a dedicated Bikanervala dry-fruit box.', ar: 'سلة هدايا للمضيف تتضمن علبة مستقلة من فواكه بيكانيرفالا المجففة.' }, group: 'e' },
  { id: 'welcome-orchid', name: { en: 'The Welcome Orchid', ar: 'أوركيد الترحيب' }, maison: 'Majestic Orchids Bouquet', maisonAr: 'إمبريس — باقة أوركيد', sweets: 'Assorted Dryfruit Sweets',
    presentation: { en: 'An orchid welcome arrangement with individually packed sweets for guests.', ar: 'تنسيق أوركيد ترحيبي مع حلوى مغلفة للضيوف.' }, group: 'e' },
];

/** The two lead groups at the top of the page. */
export const DIWALI_LEAD_GROUPS: Array<{ id: 'pilot' | 'prototype'; title: Bilingual; note: Bilingual }> = [
  { id: 'pilot', title: { en: 'Ready to pilot', ar: 'جاهزة للتجربة' },
    note: { en: 'Built around Bikanervala’s standard packs.', ar: 'تعتمد على عبوات بيكانيرفالا المعتادة.' } },
  { id: 'prototype', title: { en: 'Prototype together', ar: 'نطوّر نماذجها معاً' },
    note: { en: 'These need sealed mini packs or a custom structure.', ar: 'تحتاج إلى علب صغيرة مغلقة أو هيكل خاص.' } },
];

/** The five lettered groups under "More ways to give together". */
export const DIWALI_GROUPS: Array<{ id: 'a' | 'b' | 'c' | 'd' | 'e'; letter: string; title: Bilingual; note: Bilingual }> = [
  { id: 'a', letter: 'A', title: { en: 'Bouquets & a sweet box', ar: 'باقات مع علبة حلوى' },
    note: { en: 'The familiar gift, with a second delight to open.', ar: 'هدية مألوفة مع مفاجأة حلوة إضافية.' } },
  { id: 'b', letter: 'B', title: { en: 'Roses, reworked', ar: 'الورد برؤية جديدة' },
    note: { en: 'Sweet packaging becomes part of the floral form.', ar: 'يصبح تغليف الحلوى جزءاً من تنسيق الزهور.' } },
  { id: 'c', letter: 'C', title: { en: 'Sweet-box bouquets', ar: 'باقات من علب الحلوى' },
    note: { en: 'Sealed mini boxes create the silhouette.', ar: 'تشكّل العلب الصغيرة المغلقة هيئة الباقة.' } },
  { id: 'd', letter: 'D', title: { en: 'Diwali expressions', ar: 'أفكار مستوحاة من ديوالي' },
    note: { en: 'Festive forms to explore together.', ar: 'أشكال احتفالية نطوّرها معاً.' } },
  { id: 'e', letter: 'E', title: { en: 'For hosts & teams', ar: 'للمضيفين والفرق' },
    note: { en: 'Considered gifts for a table, team or welcome.', ar: 'هدايا للطاولة أو الفريق أو الاستقبال.' } },
];

/** Links in the sticky bar, in page order. */
export const DIWALI_SECTIONS: Array<{ id: string; title: Bilingual }> = [
  { id: 'pilot', title: { en: 'Ready to pilot', ar: 'جاهزة للتجربة' } },
  { id: 'prototype', title: { en: 'Prototype together', ar: 'نطوّر معاً' } },
  { id: 'a', title: { en: 'A · Bouquet + sweets', ar: 'أ · باقة وحلوى' } },
  { id: 'b', title: { en: 'B · Roses reworked', ar: 'ب · الورد برؤية جديدة' } },
  { id: 'c', title: { en: 'C · Sweet-box bouquets', ar: 'ج · باقات العلب' } },
  { id: 'd', title: { en: 'D · Diwali', ar: 'د · ديوالي' } },
  { id: 'e', title: { en: 'E · Hosts & teams', ar: 'هـ · المضيفون والفرق' } },
  { id: 'gift', title: { en: 'On the gift', ar: 'على الهدية' } },
  { id: 'plan', title: { en: 'Where it appears', ar: 'أين تظهر' } },
];
