// Site-wide content and settings that are not part of the Shopify catalog.
// Copy follows maison_botanique_brand_kit/BRAND-GUIDE.md. Arabic text still
// needs review by a native editor before launch.

export interface Bilingual {
  en: string;
  ar: string;
}

/**
 * The website's public URL, without a trailing slash. Set NEXT_PUBLIC_SITE_URL
 * on the host; the fallback is used only when it is missing.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.maisonbotaniqueflowers.com').replace(/\/+$/, '');

/** The welcome offer's discount code (create it in Shopify Discounts), shown in the banner and after the sign-up. */
export const OFFER_CODE = (process.env.NEXT_PUBLIC_LAUNCH_OFFER_CODE || 'MAISON25').trim();

/** The seven emirates served, all with same-day delivery. */
export const EMIRATES: Bilingual[] = [
  { en: 'Dubai', ar: 'دبي' },
  { en: 'Abu Dhabi', ar: 'أبوظبي' },
  { en: 'Sharjah', ar: 'الشارقة' },
  { en: 'Ajman', ar: 'عجمان' },
  { en: 'Umm Al Quwain', ar: 'أم القيوين' },
  { en: 'Ras Al Khaimah', ar: 'رأس الخيمة' },
  { en: 'Fujairah', ar: 'الفجيرة' },
];

export const SITE = {
  name: 'Maison Botanique',
  tagline: { en: 'Thoughtfully in bloom.', ar: 'بعناية، في أبهى تفتّح.' },
  description: {
    en: 'Considered bouquets and thoughtful gifts for the people, places and moments that matter. A floral house in Dubai.',
    ar: 'باقات مختارة بعناية وهدايا مدروسة للأشخاص والأماكن واللحظات التي تهمّك. دار زهور في دبي.',
  },
  city: { en: 'Dubai, United Arab Emirates', ar: 'دبي، الإمارات العربية المتحدة' },
  /** Public enquiries inbox. Confirm the mailbox exists before launch. */
  email: 'hello@maisonbotaniqueflowers.com',
  /** International format without spaces, e.g. '+9715XXXXXXXX'. Hidden until set. */
  phone: '+971545578803' as string | null,
  /**
   * WhatsApp number, digits only in international format (e.g. 9715XXXXXXXX),
   * from NEXT_PUBLIC_WHATSAPP_NUMBER. The WhatsApp button and links stay hidden until it is set.
   */
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '') || null,
  /** Instagram handle without '@'. Hidden until confirmed. */
  instagram: null as string | null,
};

/** The occasions products are tagged with in Shopify (`occasion:<id>`), in menu order. */
export const OCCASION_IDS = ['birthday', 'love', 'thanks', 'get-well', 'new-baby', 'congratulations', 'wedding', 'sorry', 'just-because'] as const;
export type OccasionId = typeof OCCASION_IDS[number];

export interface Occasion {
  id: OccasionId;
  name: Bilingual;
  line: Bilingual;
  intro: Bilingual;
  /** Fallback photograph; the occasion page prefers a product photo. */
  image: string;
}

export const OCCASIONS: Occasion[] = [
  {
    id: 'birthday',
    name: { en: 'Birthday', ar: 'عيد ميلاد' },
    line: { en: 'A year, beautifully marked.', ar: 'عام جديد، يُحتفى به بجمال.' },
    intro: {
      en: 'Something to make their day feel entirely theirs, from bright gatherings to keepsake gifts.',
      ar: 'هدية تجعل يومهم خاصاً بهم وحدهم، من الباقات المشرقة إلى الهدايا التي تُحفظ.',
    },
    image: '/assets/sunlit-cut.jpg',
  },
  {
    id: 'love',
    name: { en: 'Love & Anniversary', ar: 'حب وذكرى' },
    line: { en: 'For the heart that already knows.', ar: 'للقلب الذي يعرف مسبقاً.' },
    intro: {
      en: 'Deep roses, soft peonies and the kind of gesture that does not need explaining, for every year worth celebrating.',
      ar: 'ورود عميقة اللون وفاوانيا ناعمة، ولفتة لا تحتاج إلى شرح، لكل عام يستحق الاحتفاء.',
    },
    image: '/assets/red-peonies.jpg',
  },
  {
    id: 'thanks',
    name: { en: 'Thank You', ar: 'شكر وامتنان' },
    line: { en: 'Gratitude, in bloom.', ar: 'امتنان، في هيئة زهور.' },
    intro: {
      en: 'A small way to say what words cannot quite hold, for hosts, colleagues and kind gestures.',
      ar: 'لفتة صغيرة تقول ما تعجز عنه الكلمات، للمضيفين والزملاء وكل معروف جميل.',
    },
    image: '/assets/wrapped-gifts.jpg',
  },
  {
    id: 'get-well',
    name: { en: 'Get Well', ar: 'سلامتك' },
    line: { en: 'Something bright for the bedside.', ar: 'لمسة مشرقة بجانب السرير.' },
    intro: {
      en: 'Gentle colour and a few kind words, for a hospital room, a quiet recovery or a long week.',
      ar: 'ألوان هادئة وكلمات لطيفة، لغرفة في المستشفى أو فترة تعافٍ أو أسبوع طويل.',
    },
    image: '/assets/wild-stems.jpg',
  },
  {
    id: 'new-baby',
    name: { en: 'New Baby', ar: 'مولود جديد' },
    line: { en: 'Welcome to the world.', ar: 'أهلاً بك في هذا العالم.' },
    intro: {
      en: 'Soft flowers and keepsake gifts for new parents, and for the newest member of the family.',
      ar: 'زهور ناعمة وهدايا تُحفظ للوالدين الجديدين، ولأحدث فرد في العائلة.',
    },
    image: '/assets/bouquet-concept.jpg',
  },
  {
    id: 'congratulations',
    name: { en: 'Congratulations', ar: 'تهنئة' },
    line: { en: 'For the moments that change everything.', ar: 'للحظات التي تغيّر كل شيء.' },
    intro: {
      en: 'A promotion, a graduation, a new home or a new chapter: flowers that match the occasion.',
      ar: 'ترقية أو تخرج أو بيت جديد أو فصل جديد: زهور تليق بالمناسبة.',
    },
    image: '/assets/dark-editorial-concept.jpg',
  },
  {
    id: 'wedding',
    name: { en: 'Wedding', ar: 'زفاف' },
    line: { en: 'For the two of you.', ar: 'لكما معاً.' },
    intro: {
      en: 'Bridal bouquets and gifts for the couple. For full wedding florals, see Events & gifting.',
      ar: 'باقات العروس وهدايا للعروسين. لتنسيقات الأعراس الكاملة، اطّلع على المناسبات والإهداء.',
    },
    image: '/assets/preserved-rose.jpg',
  },
  {
    id: 'sorry',
    name: { en: "I'm Sorry", ar: 'اعتذار' },
    line: { en: 'The first part of an apology.', ar: 'أول كلمات الاعتذار.' },
    intro: {
      en: 'When words need a little help: considered flowers that say you mean it.',
      ar: 'حين تحتاج الكلمات إلى بعض العون: زهور مختارة تقول إنك تعنيها.',
    },
    image: '/assets/dried-arrangement.jpg',
  },
  {
    id: 'just-because',
    name: { en: 'Gifts for her', ar: 'هدايا لها' },
    line: { en: 'A gesture, chosen for her.', ar: 'لفتة مختارة لها.' },
    intro: { en: 'Flowers, beauty gifts and thoughtful combinations, chosen for the women who matter to you.', ar: 'زهور وهدايا جمال وتنسيقات مدروسة، مختارة للنساء العزيزات عليك.' },
    image: '/assets/sunlit-cut.jpg',
  },
];

export function occasionSlug(id: string) { return id === 'just-because' ? 'gifts-for-her' : id; }
/** Occasions are filters on the one collection, not pages of their own. */
export function occasionHash(id: string) { return `occasion/${occasionSlug(id)}`; }
export function occasionPath(id: string) { return `/shop#${occasionHash(id)}`; }

export function findOccasion(id: string) {
  if (id === 'gifts-for-her') id = 'just-because';
  return OCCASIONS.find((occasion) => occasion.id === id);
}

export const CATEGORIES = [
  { id: 'bouquets', name: { en: 'Bouquets', ar: 'باقات' } },
  { id: 'gifts', name: { en: 'Gifts', ar: 'هدايا' } },
  { id: 'preserved', name: { en: 'Preserved', ar: 'زهور محفوظة' } },
] as const;
export type CategoryId = typeof CATEGORIES[number]['id'];

export function categoryIdOf(category: string): CategoryId {
  const value = category.toLowerCase();
  if (value.includes('preserv')) return 'preserved';
  if (value.includes('gift')) return 'gifts';
  return 'bouquets';
}

export const SERVICE_IDS = ['events', 'weddings', 'subscriptions', 'corporate'] as const;
export type ServiceId = typeof SERVICE_IDS[number];

export interface Service {
  id: ServiceId;
  name: Bilingual;
  summary: Bilingual;
  detail: Bilingual;
  points: Bilingual[];
  image: string;
}

export const SERVICES: Service[] = [
  {
    id: 'events',
    name: { en: 'Events & gatherings', ar: 'المناسبات والتجمعات' },
    summary: {
      en: 'Florals for dinners, launches and celebrations, designed around the room.',
      ar: 'تنسيقات زهور للعشاء والإطلاقات والاحتفالات، مصممة حول المكان.',
    },
    detail: {
      en: 'From a single long table to a full venue, we design arrangements that suit the space, the light and the people in it. Tell us about the occasion and we will propose a palette, a scale and a plan.',
      ar: 'من طاولة طويلة واحدة إلى مكان كامل، نصمم تنسيقات تناسب المساحة والضوء والحضور. أخبرنا عن المناسبة وسنقترح لوحة ألوان وحجماً وخطة.',
    },
    points: [
      { en: 'Table and centrepiece design', ar: 'تصميم الطاولات والقطع المركزية' },
      { en: 'Entrance and installation pieces', ar: 'قطع المدخل والتركيبات' },
      { en: 'Set-up and collection on the day', ar: 'التركيب والاستلام في يوم المناسبة' },
    ],
    image: '/assets/dark-editorial-concept.jpg',
  },
  {
    id: 'weddings',
    name: { en: 'Weddings', ar: 'حفلات الزفاف' },
    summary: {
      en: 'Bridal bouquets and wedding florals, composed to the story of your day.',
      ar: 'باقات العروس وزهور الزفاف، منسقة لتروي قصة يومكم.',
    },
    detail: {
      en: 'We begin with a conversation about you, the venue and the feeling you want to remember. From the bridal bouquet to the last table, every piece is designed to belong together.',
      ar: 'نبدأ بحديث عنكم وعن المكان والشعور الذي تودون تذكره. من باقة العروس إلى آخر طاولة، تُصمم كل قطعة لتنسجم مع غيرها.',
    },
    points: [
      { en: 'Bridal and bridal-party bouquets', ar: 'باقات العروس ووصيفاتها' },
      { en: 'Ceremony and reception florals', ar: 'زهور مراسم الزفاف والاستقبال' },
      { en: 'Design consultation and proposal', ar: 'استشارة تصميم وعرض مقترح' },
    ],
    image: '/assets/bouquet-concept.jpg',
  },
  {
    id: 'subscriptions',
    name: { en: 'Seasonal subscriptions', ar: 'اشتراكات موسمية' },
    summary: {
      en: 'Fresh flowers for your home or office, refreshed with the season.',
      ar: 'زهور طازجة لبيتك أو مكتبك، تتجدد مع كل موسم.',
    },
    detail: {
      en: 'A standing arrangement on a rhythm that suits you, chosen from what is looking its best that week. Ideal for homes, reception desks and quiet corners that deserve something lovely.',
      ar: 'تنسيق دائم بإيقاع يناسبك، يُختار مما يبدو في أجمل حالاته ذلك الأسبوع. مثالي للبيوت ومكاتب الاستقبال والزوايا الهادئة التي تستحق لمسة جميلة.',
    },
    points: [
      { en: 'Weekly or fortnightly rhythm', ar: 'إيقاع أسبوعي أو كل أسبوعين' },
      { en: 'Seasonal stems, chosen with care', ar: 'أزهار موسمية مختارة بعناية' },
      { en: 'Vessel care and replacement', ar: 'العناية بالأواني واستبدالها' },
    ],
    image: '/assets/wild-stems.jpg',
  },
  {
    id: 'corporate',
    name: { en: 'Corporate & hospitality', ar: 'الشركات والضيافة' },
    summary: {
      en: 'Client gifting, lobby florals and seasonal gifting programmes.',
      ar: 'هدايا العملاء وزهور الردهات وبرامج الإهداء الموسمية.',
    },
    detail: {
      en: 'Thoughtful gifting for clients and teams, and considered florals for lobbies, suites and shared spaces. We can work to a brief, a budget and a calendar.',
      ar: 'هدايا مدروسة للعملاء وفرق العمل، وتنسيقات مختارة للردهات والأجنحة والمساحات المشتركة. نعمل وفق متطلباتكم وميزانيتكم وجدولكم الزمني.',
    },
    points: [
      { en: 'Client and team gifting', ar: 'هدايا العملاء وفرق العمل' },
      { en: 'Lobby and reception florals', ar: 'زهور الردهات والاستقبال' },
      { en: 'Seasonal and occasion programmes', ar: 'برامج موسمية وللمناسبات' },
    ],
    image: '/assets/wrapped-gifts.jpg',
  },
];

/** Header navigation, as on the storefront design: occasions, the three product types, gifting. */
export const NAV_LINKS = [
  { href: '/#occasions', label: { en: 'Occasions', ar: 'المناسبات' } },
  { href: '/shop?type=bouquets', label: { en: 'Bouquets', ar: 'باقات' } },
  { href: '/shop?type=gifts', label: { en: 'Gifts', ar: 'هدايا' } },
  { href: '/shop?type=preserved', label: { en: 'Preserved', ar: 'ورود محفوظة' } },
  { href: '/#gifting', label: { en: 'Gifting', ar: 'الإهداء' } },
];

/** Pages reached from the footer and the mobile menu. */
export const ABOUT_LINKS = [
  { href: '/shop', label: { en: 'Shop all', ar: 'كل القطع' } },
  { href: '/collections', label: { en: 'Collections', ar: 'المجموعات' } },
  { href: '/services', label: { en: 'Events & gifting', ar: 'المناسبات والإهداء' } },
  { href: '/atelier', label: { en: 'Our philosophy', ar: 'فلسفتنا' } },
  { href: '/contact', label: { en: 'Contact', ar: 'تواصل معنا' } },
];

export const HELP_LINKS = [
  { href: '/delivery', label: { en: 'Delivery & care', ar: 'التوصيل والعناية' } },
  { href: '/faq', label: { en: 'Questions', ar: 'الأسئلة الشائعة' } },
  { href: '/contact', label: { en: 'Contact', ar: 'تواصل معنا' } },
  { href: '/privacy', label: { en: 'Privacy', ar: 'الخصوصية' } },
  { href: '/terms', label: { en: 'Terms', ar: 'الشروط' } },
  { href: '/refund-policy', label: { en: 'Refund policy', ar: 'سياسة الاسترداد' } },
];
