// Provisional concept catalog. Names, imagery, availability and AED prices
// remain illustrative until the business supplies its final inventory.
//
// The storefront uses this list only while Shopify is not configured.
// `npm run shopify:seed` uploads the same records to a development store,
// so keep this file free of non-erasable TypeScript (Node runs it directly).

export interface SampleSize {
  name: string;
  nameAr: string;
  price: number;
}

export interface SampleProduct {
  handle: string;
  title: string;
  titleAr: string;
  productType: 'Bouquets' | 'Gifts' | 'Preserved';
  occasions: string[];
  /** Path under /public. */
  image: string;
  description: string;
  descriptionAr: string;
  backgroundColor: string;
  accentColor: string;
  featured: boolean;
  sizes: SampleSize[];
}

// Array order is the collection order.
export const sampleCatalog: SampleProduct[] = [
  {
    handle: 'nocturne-vase',
    title: 'The Nocturne Vase',
    titleAr: 'مزهرية نوكتورن',
    productType: 'Gifts',
    occasions: ['romance', 'anniversary', 'thank-you'],
    image: '/assets/dark-editorial-concept.jpg',
    description: 'Deep roses and pale orchids composed in a sculptural glass vase.',
    descriptionAr: 'ورود داكنة وأزهار أوركيد فاتحة في مزهرية زجاجية منحوتة.',
    backgroundColor: '#302D28',
    accentColor: '#6D313B',
    featured: false,
    sizes: [
      { name: 'Signature', nameAr: 'أساسي', price: 485 },
      { name: 'Grand', nameAr: 'كبير', price: 660 },
    ],
  },
  {
    handle: 'rouge-peonies',
    title: 'Rouge Peonies',
    titleAr: 'باقة الفاوانيا الحمراء',
    productType: 'Bouquets',
    occasions: ['romance', 'birthday', 'anniversary'],
    image: '/assets/red-peonies.jpg',
    description: 'A vivid gathering of red peonies with the presence of a grand gesture.',
    descriptionAr: 'تنسيق من الفاوانيا الحمراء بحضور يليق بلفتة استثنائية.',
    backgroundColor: '#8B4548',
    accentColor: '#542C34',
    featured: false,
    sizes: [
      { name: 'Signature', nameAr: 'أساسي', price: 365 },
      { name: 'Grand', nameAr: 'كبير', price: 510 },
    ],
  },
  {
    handle: 'wild-garden',
    title: 'The Wild Garden',
    titleAr: 'باقة الحديقة البرية',
    productType: 'Bouquets',
    occasions: ['birthday', 'just-because', 'new-beginnings'],
    image: '/assets/wild-stems.jpg',
    description: 'A loose, hand-held gathering of seasonal wildflowers and greenery.',
    descriptionAr: 'باقة عفوية من الزهور البرية الموسمية والأغصان الخضراء.',
    backgroundColor: '#DDD5C7',
    accentColor: '#596451',
    featured: false,
    sizes: [
      { name: 'Signature', nameAr: 'أساسي', price: 295 },
      { name: 'Grand', nameAr: 'كبير', price: 410 },
    ],
  },
  {
    handle: 'soleil-bouquet',
    title: 'The Soleil Bouquet',
    titleAr: 'باقة الشمس',
    productType: 'Bouquets',
    occasions: ['birthday', 'thank-you', 'new-beginnings'],
    image: '/assets/sunlit-cut.jpg',
    description: 'A bright gathering of warm roses and sunny seasonal flowers.',
    descriptionAr: 'باقة مشرقة من الورود الدافئة وزهور الموسم المفعمة بالشمس.',
    backgroundColor: '#F0EAD9',
    accentColor: '#9D6E37',
    featured: false,
    sizes: [
      { name: 'Signature', nameAr: 'أساسي', price: 280 },
      { name: 'Grand', nameAr: 'كبير', price: 390 },
    ],
  },
  {
    handle: 'blush-study',
    title: 'The Blush Study',
    titleAr: 'تشكيلة الوردي الهادئ',
    productType: 'Bouquets',
    occasions: ['birthday', 'thank-you', 'just-because'],
    image: '/assets/bouquet-concept.jpg',
    description: 'Garden roses, ranunculus and soft seasonal stems in a hand-tied composition.',
    descriptionAr: 'ورود الحديقة والحوذان وأغصان موسمية ناعمة في باقة منسقة يدوياً.',
    backgroundColor: '#E9E1D5',
    accentColor: '#8D675D',
    featured: true,
    sizes: [
      { name: 'Signature', nameAr: 'أساسي', price: 325 },
      { name: 'Grand', nameAr: 'كبير', price: 450 },
    ],
  },
  {
    handle: 'gift-edit',
    title: 'The Gift Edit',
    titleAr: 'تنسيق الهدية',
    productType: 'Gifts',
    occasions: ['birthday', 'anniversary', 'thank-you', 'new-beginnings'],
    image: '/assets/gift-concept.jpg',
    description: 'An abundant floral arrangement presented in a keepsake hatbox.',
    descriptionAr: 'تنسيق زهري غني يقدم في علبة أنيقة يمكن الاحتفاظ بها.',
    backgroundColor: '#C8AA91',
    accentColor: '#693D41',
    featured: true,
    sizes: [
      { name: 'Signature', nameAr: 'أساسي', price: 390 },
      { name: 'Grand', nameAr: 'كبير', price: 530 },
    ],
  },
  {
    handle: 'forever-rose',
    title: 'The Forever Rose',
    titleAr: 'الوردة الخالدة',
    productType: 'Preserved',
    occasions: ['romance', 'anniversary', 'just-because'],
    image: '/assets/preserved-concept.jpg',
    description: 'A preserved crimson rose, displayed under a glass cloche.',
    descriptionAr: 'وردة قرمزية محفوظة تحت قبة زجاجية.',
    backgroundColor: '#E8DED1',
    accentColor: '#6D313B',
    featured: true,
    sizes: [
      { name: 'Single', nameAr: 'وردة واحدة', price: 315 },
      { name: 'Duo', nameAr: 'وردتان', price: 475 },
    ],
  },
  {
    handle: 'keepsake-posy',
    title: 'The Keepsake Posy',
    titleAr: 'باقة الذكرى الصغيرة',
    productType: 'Preserved',
    occasions: ['romance', 'thank-you', 'just-because'],
    image: '/assets/preserved-rose.jpg',
    description: 'A small posy of a preserved garden rose and dried stems, wrapped with ribbon to keep.',
    descriptionAr: 'باقة صغيرة من وردة حديقة محفوظة وأغصان مجففة، ملفوفة بشريط لتبقى ذكرى.',
    backgroundColor: '#E4E0DA',
    accentColor: '#8E3B3F',
    featured: false,
    sizes: [
      { name: 'Single', nameAr: 'وردة واحدة', price: 185 },
      { name: 'Duo', nameAr: 'وردتان', price: 295 },
    ],
  },
];
