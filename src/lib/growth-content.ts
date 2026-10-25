import type { Bilingual, OccasionId } from './site';
import { JVC_FREE_DELIVERY } from './jvc-delivery';

export interface Question { question: Bilingual; answer: Bilingual }
export interface EditorialSection { heading: Bilingual; paragraphs: Bilingual[] }

export const ORDER_QUESTIONS: Question[] = [
  {
    question: { en: 'Can I choose a delivery time?', ar: 'هل يمكنني اختيار وقت التوصيل؟' },
    answer: {
      en: 'Choose an available date and one of four delivery windows: 9am–noon, noon–3pm, 3–6pm or 6–9pm. Dubai same-day windows close one hour before they start. You can book up to 60 days ahead; seasonal pre-orders have their own delivery dates.',
      ar: 'اختر تاريخاً متاحاً وإحدى فترات التوصيل الأربع: 9 صباحاً–12 ظهراً، أو 12–3 عصراً، أو 3–6 مساءً، أو 6–9 مساءً. تُغلق فترات اليوم نفسه في دبي قبل بدايتها بساعة. يمكنك الحجز حتى 60 يوماً مقدماً، وللطلبات الموسمية المسبقة تواريخ خاصة.',
    },
  },
  {
    question: { en: 'How much is delivery?', ar: 'ما رسوم التوصيل؟' },
    answer: {
      en: `Delivery is AED 30 in Dubai and AED 50 elsewhere in the UAE. ${JVC_FREE_DELIVERY ? 'JVC delivery is free: select the JVC option in your bag; we verify the full recipient address before dispatch. ' : ''}Enter the full recipient address at checkout, including the building, apartment and area. Same-day delivery is a Dubai service; check the available date for other emirates before ordering.`,
      ar: `رسوم التوصيل 30 درهماً في دبي و50 درهماً في بقية الإمارات. ${JVC_FREE_DELIVERY ? 'التوصيل إلى JVC مجاني: حدد خيار JVC في الحقيبة؛ نتحقق من عنوان المستلم كاملاً قبل الإرسال. ' : ''}أدخل عنوان المستلم كاملاً عند الدفع، بما فيه المبنى والشقة والمنطقة. خدمة التوصيل في اليوم نفسه خاصة بدبي؛ تحقق من الموعد المتاح للإمارات الأخرى قبل الطلب.`,
    },
  },
  {
    question: { en: 'Can I include a handwritten card?', ar: 'هل يمكنني إضافة بطاقة بخط اليد؟' },
    answer: {
      en: 'Yes. Add your message and signature on the product page or in the product sheet before adding the gift to your bag. Each gift can have its own note. Keep it a secret leaves the signature off the card; we still need the delivery details.',
      ar: 'نعم. أضف رسالتك وتوقيعك في صفحة المنتج أو نافذة تفاصيله قبل إضافته إلى الحقيبة. يمكن تخصيص رسالة لكل هدية. خيار «أبقِها مفاجأة» يحذف التوقيع من البطاقة، وتظل بيانات التوصيل مطلوبة.',
    },
  },
  {
    question: { en: 'Which size is in the photograph?', ar: 'ما الحجم الظاهر في الصورة؟' },
    answer: {
      en: 'The pictured size is labelled on each product. Read the contents beside each available size before choosing: the flower quantity changes, while included gifts such as chocolates or a teddy remain fixed.',
      ar: 'يُذكر الحجم الظاهر في الصورة في صفحة كل منتج. اقرأ المحتويات بجانب كل حجم قبل الاختيار: تتغير كمية الزهور، بينما تبقى الهدايا المرفقة مثل الشوكولاتة أو الدبدوب ثابتة.',
    },
  },
];

export interface OccasionContent {
  slug: string;
  occasion: OccasionId;
  title: Bilingual;
  heading: Bilingual;
  description: Bilingual;
  intro: Bilingual;
  advice: EditorialSection;
  journalSlug: string;
}

export const OCCASION_CONTENT: OccasionContent[] = [
  {
    slug: 'birthday', occasion: 'birthday',
    title: { en: 'Birthday Flowers & Gifts in Dubai', ar: 'ورود وهدايا عيد الميلاد في دبي' },
    heading: { en: 'Birthday flowers in Dubai', ar: 'ورود عيد الميلاد في دبي' },
    description: { en: 'Choose birthday flowers and gifts in Dubai, with a handwritten card and an available delivery window. Explore bouquets, rose boxes and flower gifts.', ar: 'اختر ورود وهدايا عيد الميلاد في دبي مع بطاقة بخط اليد وموعد توصيل متاح. اكتشف الباقات وصناديق الورد وهدايا الزهور.' },
    intro: { en: 'Their birthday. Your words, written by hand. Choose an arrangement and an available Dubai delivery window.', ar: 'عيد ميلادهم وكلماتك بخط اليد. اختر تنسيقاً وحدد فترة توصيل متاحة في دبي.' },
    advice: {
      heading: { en: 'Choose for their day', ar: 'اختر ما يناسب يومهم' },
      paragraphs: [
        { en: 'For a desk, check the arrangement dimensions and whether a vase is included. For a dinner or home celebration, think about the space and colours they enjoy. The contents on each product page explain what arrives.', ar: 'للمكتب، تحقق من أبعاد التنسيق وما إذا كانت المزهرية مشمولة. ولعشاء أو احتفال منزلي، فكّر في المساحة والألوان التي يحبونها. توضح صفحة كل منتج ما سيصل بالضبط.' },
        { en: 'A short, specific birthday message often says more than a long greeting. Mention a shared memory, something you admire or a plan for the year ahead. Our birthday card guide has starting points you can make personal.', ar: 'غالباً ما تكون رسالة قصيرة ومحددة أبلغ من تهنئة طويلة. اذكر ذكرى مشتركة أو صفة تحبها أو خطة للعام المقبل. يضم دليل بطاقات عيد الميلاد أفكاراً يمكنك تخصيصها.' },
      ],
    },
    journalSlug: 'birthday-card-messages',
  },
  {
    slug: 'love', occasion: 'love',
    title: { en: 'Anniversary Flowers & Roses in Dubai', ar: 'ورود وزهور الذكرى السنوية في دبي' },
    heading: { en: 'Anniversary flowers in Dubai', ar: 'ورود الذكرى السنوية في دبي' },
    description: { en: 'Explore anniversary flowers and rose arrangements in Dubai. Choose the contents, add a handwritten note and select an available delivery date.', ar: 'اكتشف ورود وتنسيقات الذكرى السنوية في دبي. اختر المحتويات وأضف رسالة بخط اليد وحدد تاريخ توصيل متاحاً.' },
    intro: { en: 'For a first anniversary, a shared milestone or a day worth marking. Choose an arrangement, add your words and book a delivery window that suits the occasion.', ar: 'للذكرى الأولى أو محطة مشتركة أو يوم يستحق الاحتفاء. اختر تنسيقاً وأضف كلماتك واحجز فترة توصيل تناسب المناسبة.' },
    advice: {
      heading: { en: 'Make it personal', ar: 'أضف لمستك الخاصة' },
      paragraphs: [
        { en: 'Start with a colour or flower they already love. Compare the listed contents and pictured size rather than guessing from the photograph. Check whether the presentation includes a vase or box, especially when sending to a workplace.', ar: 'ابدأ بلون أو زهرة يحبونها. قارن المحتويات المكتوبة والحجم الظاهر بدلاً من التخمين من الصورة. تحقق مما إذا كانت مزهرية أو علبة مشمولة، خصوصاً عند الإرسال إلى مكان العمل.' },
        { en: 'Write about something only the two of you would recognise: a place, a small habit or a moment from the past year. If you are sending from abroad, confirm the recipient address and Dubai delivery date before paying.', ar: 'اكتب عن شيء يخصكما وحدكما: مكان أو عادة صغيرة أو لحظة من العام الماضي. وإذا كنت ترسل من الخارج، تأكد من عنوان المستلم وموعد التوصيل بتوقيت دبي قبل الدفع.' },
      ],
    },
    journalSlug: 'send-flowers-to-dubai-from-abroad',
  },
];

export const findOccasionContent = (slug: string) => OCCASION_CONTENT.find((item) => item.slug === slug);

export interface JournalEntry {
  slug: string;
  title: Bilingual;
  description: Bilingual;
  intro: Bilingual;
  sections: EditorialSection[];
  occasion: string;
  occasionLabel: Bilingual;
}

/** Changes are reviewed in Git/preview before publication. Future AI output belongs in the private draft queue. */
export const JOURNAL: JournalEntry[] = [
  {
    slug: 'birthday-card-messages',
    title: { en: 'What to write in a birthday card', ar: 'ماذا تكتب في بطاقة عيد الميلاد؟' },
    description: { en: 'Birthday card ideas for a friend, partner, parent or colleague, with a simple way to make a short message personal.', ar: 'أفكار لبطاقات عيد ميلاد الأصدقاء والشريك والوالدين والزملاء، وطريقة بسيطة لإضفاء لمسة شخصية على رسالة قصيرة.' },
    intro: { en: 'The flowers are chosen. The blank card is the difficult part. Start with who they are to you, add one detail only you would write, and finish with a wish for their next year.', ar: 'اخترت الزهور، وبقيت البطاقة الفارغة. ابدأ بمكانة الشخص في حياتك، وأضف تفصيلاً يخصكما، واختم بأمنية للعام الجديد.' },
    occasion: 'birthday', occasionLabel: { en: 'Choose birthday flowers', ar: 'اختر ورود عيد الميلاد' },
    sections: [
      {
        heading: { en: 'For a close friend', ar: 'لصديق مقرّب' },
        paragraphs: [
          { en: '“Another year of your excellent advice and our questionable plans. Happy birthday. I am so glad we found each other.”', ar: '«عام آخر من نصائحك الرائعة وخططنا التي لا تخلو من المغامرة. عيد ميلاد سعيد، كم أنا سعيد بصداقتنا.»' },
          { en: '“Happy birthday to the person who makes an ordinary Tuesday worth remembering. Here is to more coffee, long conversations and adventures together.”', ar: '«عيد ميلاد سعيد لمن يجعل يوماً عادياً ذكرى جميلة. إلى مزيد من القهوة والأحاديث الطويلة والمغامرات معاً.»' },
          { en: 'Replace a general compliment with something real: the voice notes, the airport pickup or the meal they cooked when you needed it. Specificity makes a simple greeting yours.', ar: 'استبدل المجاملة العامة بتفصيل حقيقي: رسالة صوتية أو استقبال في المطار أو وجبة أعدّها حين احتجتها. التفاصيل تجعل التهنئة خاصة بك.' },
        ],
      },
      {
        heading: { en: 'For your partner', ar: 'لشريك حياتك' },
        paragraphs: [
          { en: '“My favourite part of the year is sharing it with you. Happy birthday, my love.”', ar: '«أجمل ما في كل عام أنني أعيشه معك. عيد ميلاد سعيد يا حبيبي.»' },
          { en: '“For the person who makes this city feel like home. I love the life we are building together. Happy birthday.”', ar: '«لمن يجعل هذه المدينة بيتاً. أحب الحياة التي نبنيها معاً. عيد ميلاد سعيد.»' },
          { en: 'If you are apart, name the next thing you are looking forward to together. Avoid promising an elaborate surprise unless it is already arranged.', ar: 'إذا فرّقت بينكما المسافة، اذكر ما تتطلعان إلى فعله معاً قريباً. تجنّب الوعد بمفاجأة كبيرة ما لم تكن قد رتّبتها بالفعل.' },
        ],
      },
      {
        heading: { en: 'For a parent', ar: 'لأحد الوالدين' },
        paragraphs: [
          { en: '“Happy birthday, Mum. Thank you for making room for all of us, in every way. These flowers come with a very big hug.”', ar: '«عيد ميلاد سعيد يا أمي. شكراً لأن قلبك يتسع لنا دائماً. مع هذه الزهور عناق كبير.»' },
          { en: '“Happy birthday, Dad. I still hear your advice when I need it most. Wishing you a year with more of the things you love.”', ar: '«عيد ميلاد سعيد يا أبي. تظل نصائحك معي حين أحتاجها. أتمنى لك عاماً مليئاً بما تحب.»' },
        ],
      },
      {
        heading: { en: 'For a colleague', ar: 'لزميل في العمل' },
        paragraphs: [
          { en: '“Happy birthday, [name]. Wishing you a lovely day and a great year ahead. With warm wishes from the team.”', ar: '«عيد ميلاد سعيد يا [الاسم]. نتمنى لك يوماً جميلاً وعاماً رائعاً. مع أطيب تمنيات فريق العمل.»' },
          { en: '“Wishing you a very happy birthday. Thank you for your kindness and everything you bring to the team.”', ar: '«نتمنى لك عيد ميلاد سعيداً. شكراً للطفك ولكل ما تقدمه للفريق.»' },
          { en: 'Keep a workplace message warm and comfortable to read aloud. Leave out age jokes, private information and jokes that rely on knowing the whole story.', ar: 'اجعل رسالة العمل ودودة ومناسبة للقراءة أمام الآخرين. ابتعد عن المزاح حول العمر والمعلومات الخاصة والنكات التي تحتاج إلى شرح.' },
        ],
      },
      {
        heading: { en: 'Before you send', ar: 'قبل الإرسال' },
        paragraphs: [
          { en: 'Check the spelling of their name, read the message once aloud and add your signature. At Maison Botanique, enter the note and signature before adding the gift to your bag. Each gift can carry its own handwritten card.', ar: 'تأكد من كتابة الاسم، واقرأ الرسالة مرة بصوت مسموع، وأضف توقيعك. في ميزون بوتانيك، أدخل الرسالة والتوقيع قبل إضافة الهدية إلى الحقيبة. يمكن أن تحمل كل هدية بطاقة خاصة بخط اليد.' },
        ],
      },
    ],
  },
  {
    slug: 'send-flowers-to-dubai-from-abroad',
    title: { en: 'Sending flowers to Dubai from abroad', ar: 'إرسال الزهور إلى دبي من الخارج' },
    description: { en: 'A practical checklist for sending flowers to Dubai from another country: recipient details, local delivery windows, cards and payment.', ar: 'دليل عملي لإرسال الزهور إلى دبي من بلد آخر: بيانات المستلم ومواعيد التوصيل المحلية والبطاقات والدفع.' },
    intro: { en: 'You can choose the flowers from anywhere; the important details belong to the person receiving them in Dubai. Gather the address, check the local date and decide what the card should say before ordering.', ar: 'يمكنك اختيار الزهور من أي مكان، لكن التفاصيل الأساسية تخص من سيستلمها في دبي. جهّز العنوان وتحقق من التاريخ المحلي وحدد رسالة البطاقة قبل الطلب.' },
    occasion: 'love', occasionLabel: { en: 'Explore anniversary flowers', ar: 'اكتشف ورود الذكرى السنوية' },
    sections: [
      {
        heading: { en: 'Start with the recipient details', ar: 'ابدأ ببيانات المستلم' },
        paragraphs: [
          { en: 'Have the recipient name, reachable phone number, building or villa name, apartment number and area ready. For an office, add the company and any useful reception instructions. Use the full recipient address at checkout, not your overseas billing address.', ar: 'جهّز اسم المستلم ورقم هاتف يمكن التواصل معه واسم المبنى أو الفيلا ورقم الشقة والمنطقة. للمكتب، أضف اسم الشركة وتعليمات الاستقبال المفيدة. أدخل عنوان المستلم كاملاً للتوصيل، وليس عنوان الفاتورة في الخارج.' },
          { en: 'If you only know an area, ask the recipient or someone who can confirm the address. Do not assume that a florist can locate them from a phone number alone. A surprise still needs workable delivery information.', ar: 'إذا كنت تعرف المنطقة فقط، اطلب تأكيد العنوان من المستلم أو ممن يعرفه. لا تفترض أن محل الزهور يستطيع تحديد المكان من رقم الهاتف وحده. حتى المفاجأة تحتاج إلى بيانات توصيل واضحة.' },
        ],
      },
      {
        heading: { en: 'Use Dubai time', ar: 'اعتمد توقيت دبي' },
        paragraphs: [
          { en: 'Dubai is UTC+4 throughout the year. Check both the date and the delivery window, especially when ordering late at night from another country. A birthday at home may already be the next calendar day in Dubai.', ar: 'توقيت دبي هو UTC+4 طوال العام. تحقق من التاريخ وفترة التوصيل، خصوصاً عند الطلب ليلاً من بلد آخر. قد يكون التاريخ قد انتقل إلى اليوم التالي في دبي.' },
          { en: 'Maison offers four daily delivery windows, from 9am to 9pm. Available Dubai same-day windows close one hour before they start. The delivery picker shows what can still be booked; seasonal pre-orders use their own dates. You can pre-book up to 60 days ahead.', ar: 'توفر ميزون أربع فترات يومية للتوصيل من 9 صباحاً إلى 9 مساءً. تُغلق فترات اليوم نفسه المتاحة في دبي قبل بدايتها بساعة. يوضح محدد الموعد ما يمكن حجزه، وللطلبات الموسمية المسبقة تواريخها الخاصة. يمكنك الحجز حتى 60 يوماً مقدماً.' },
        ],
      },
      {
        heading: { en: 'Check what will arrive', ar: 'تحقق مما سيصل' },
        paragraphs: [
          { en: 'Read the flower contents and selected size. Check whether a vase, box, chocolates or another gift is included. A photograph shows the labelled pictured size; it should not be your only source for quantities.', ar: 'اقرأ محتويات الزهور والحجم المختار. تحقق مما إذا كانت المزهرية أو العلبة أو الشوكولاتة أو هدية أخرى مشمولة. توضح الصورة الحجم المحدد بجانبها، ولا ينبغي الاعتماد عليها وحدها لمعرفة الكميات.' },
          { en: 'Natural flowers can vary with the season. Read the substitution information and ask the flower desk before ordering if a particular stem or colour is essential to your gift.', ar: 'قد تختلف الزهور الطبيعية بحسب الموسم. اقرأ معلومات البدائل واسأل مكتب الزهور قبل الطلب إذا كان نوع أو لون معين أساسياً لهديتك.' },
        ],
      },
      {
        heading: { en: 'Write the card before checkout', ar: 'اكتب البطاقة قبل الدفع' },
        paragraphs: [
          { en: 'Tell them why you are thinking of them, then sign your name. Add the message on the product page or in the product sheet before putting the gift in your bag. If you choose Keep it a secret, the card omits your signature; this does not remove the need for recipient details.', ar: 'أخبرهم لماذا تفكر فيهم، ثم وقّع باسمك. أضف الرسالة في صفحة المنتج أو نافذة تفاصيله قبل وضع الهدية في الحقيبة. عند اختيار «أبقِها مفاجأة»، لا يظهر التوقيع على البطاقة؛ وتظل بيانات المستلم مطلوبة.' },
        ],
      },
      {
        heading: { en: 'Review payment and delivery', ar: 'راجع الدفع والتوصيل' },
        paragraphs: [
          { en: 'Prices are in UAE dirhams. Delivery is AED 30 in Dubai and AED 50 elsewhere in the UAE; check the final charge and any eligible offer at checkout. Your bank may apply its own currency-conversion charges.', ar: 'الأسعار بالدرهم الإماراتي. رسوم التوصيل 30 درهماً في دبي و50 درهماً في بقية الإمارات؛ تحقق من المبلغ النهائي وأي عرض تستحقه عند الدفع. قد يطبق مصرفك رسوماً لتحويل العملة.' },
          { en: 'Use a payment method offered at checkout. Acceptance of an overseas card depends on the payment provider and your bank, so we do not promise that every card will work. If payment fails, contact the flower desk through the site and never send card details in a message.', ar: 'استخدم إحدى طرق الدفع المتاحة عند إتمام الطلب. يعتمد قبول البطاقة الأجنبية على مزود الدفع ومصرفك، لذلك لا نضمن قبول كل البطاقات. إذا تعذر الدفع، تواصل مع مكتب الزهور عبر الموقع ولا ترسل بيانات البطاقة في رسالة.' },
          { en: 'Keep the order confirmation and check the recipient address, date, window and card message. If anything needs correcting, contact the team promptly with the order number.', ar: 'احتفظ بتأكيد الطلب وراجع عنوان المستلم والتاريخ والفترة ورسالة البطاقة. إذا احتاج أي تفصيل إلى تعديل، تواصل مع الفريق سريعاً مع رقم الطلب.' },
        ],
      },
    ],
  },
];

export const findJournalEntry = (slug: string) => JOURNAL.find((entry) => entry.slug === slug);
