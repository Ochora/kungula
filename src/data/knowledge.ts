// Jjajja's offline knowledge library. Every answer Jjajja gives offline comes
// from here, the Scan conditions, or the farmer's own records — it never
// invents chemicals or doses. Sources are logged with each answer.

export interface Article { id: string; title: string; keywords: string[]; body: string; source: string; link?: string }

export const ARTICLES: Article[] = [
  {
    id: 'seasons', title: 'When to plant', source: 'UNMA seasonal outlooks; MAAIF crop calendars',
    keywords: ['plant', 'planting', 'season', 'rains', 'when', 'sow', 'okusimba', 'kusimba', 'kupanda', 'msimu', 'calendar', 'time'],
    body: 'Most of central, western and eastern Uganda has two rainy seasons: March–May and September–November. Northern Uganda has one longer season (about April–October). Plant as soon as the rains are steady — usually after 2–3 good rains have wet the soil a hand-deep. Early planting beats pests like fall armyworm and maize streak. Check Kungula Weather for the season outlook in your area.',
    link: '/weather',
  },
  {
    id: 'maize-spacing', title: 'Planting maize', source: 'NARO / MAAIF maize production guide',
    keywords: ['maize', 'kasooli', 'mahindi', 'spacing', 'seed rate', 'how to plant', 'distance'],
    body: 'Space maize 75 cm between rows and 30 cm between plants with one seed per hole (or 60 cm with two seeds). That is about 10 kg of seed per acre. Use certified seed, put fertiliser or manure in the hole and cover with soil before the seed. Weed at 2–3 weeks and again at 6 weeks.',
  },
  {
    id: 'beans-spacing', title: 'Planting beans', source: 'NARO bean production guide',
    keywords: ['beans', 'bijanjaalo', 'ebijanjaalo', 'maharagwe', 'spacing', 'plant beans'],
    body: 'Bush beans: 50 cm between rows and 10 cm between plants, about 25–30 kg seed per acre. Plant certified seed, weed twice before flowering, and do not weed when leaves are wet (spreads disease). Harvest when most pods are dry and yellow.',
  },
  {
    id: 'coffee-plant', title: 'Planting coffee', source: 'MAAIF coffee husbandry guidelines',
    keywords: ['coffee', 'emmwanyi', 'mmwanyi', 'kahawa', 'robusta', 'arabica', 'seedlings', 'hole', 'plant coffee'],
    body: 'Robusta is spaced about 3 m × 3 m (≈450 trees per acre). Dig holes 60 cm deep and wide two months before planting, mix topsoil with well-rotted manure, plant at the start of rains and mulch. Use clean, wilt-resistant seedlings from certified nurseries. Shade trees and bananas help young coffee.',
  },
  {
    id: 'compost', title: 'Making compost', source: 'Extension training materials',
    keywords: ['compost', 'manure', 'organic', 'fertility', 'soil food', 'obusa', 'mbolea'],
    body: 'Layer dry material (grass, maize stalks), green material (weeds, leaves), animal manure and a little soil or ash. Keep the heap moist like a squeezed sponge and turn it every 2–3 weeks. It is ready in 2–3 months when dark and crumbly with an earthy smell. Use 1–2 basins per planting hole for bananas and coffee.',
  },
  {
    id: 'soil', title: 'Soil testing and fertiliser', source: 'NARL / Makerere soil fertility guidance',
    keywords: ['soil', 'test', 'fertiliser', 'fertilizer', 'npk', 'dap', 'urea', 'can', 'lime', 'acid', 'ttaka', 'udongo'],
    body: 'A soil test tells you what your soil lacks so you do not waste money. Ask your Champion or district agricultural office about testing. As a guide: DAP or NPK at planting gives phosphorus for roots; CAN or urea as top-dressing at knee height feeds leaves; agricultural lime corrects acidic soils. Always combine with manure.',
  },
  {
    id: 'aflatoxin', title: 'Avoiding aflatoxin', source: 'MAAIF post-harvest handling guide',
    keywords: ['aflatoxin', 'mould', 'mold', 'rotten', 'storage', 'groundnuts', 'maize', 'drying', 'store'],
    body: 'Aflatoxin is a poison from moulds on poorly dried maize and groundnuts. It cannot be seen or cooked away. Harvest on time, dry on tarpaulins to safe moisture, sort out mouldy or broken grains, and store in clean, dry hermetic bags off the floor. Buyers and exporters test for it.',
    link: '/academy',
  },
  {
    id: 'layers', title: 'Layers: feed and eggs', source: 'Extension poultry guide',
    keywords: ['layers', 'eggs', 'egg', 'amagi', 'mayai', 'feed', 'chicken feed', 'laying'],
    body: 'Layers start laying at about 18–20 weeks. Give layers mash at about 120 g per bird per day, clean water always, and 16 hours of light. Egg drop can come from stress, poor feed, worms or disease (e.g. Newcastle). Record eggs daily in Kungula Book to spot drops early.',
  },
  {
    id: 'broilers', title: 'Broilers', source: 'Extension poultry guide',
    keywords: ['broilers', 'broiler', 'meat chicken', 'chicks', 'brooding'],
    body: 'Broilers reach market weight (about 2 kg) in 5–6 weeks. Brood chicks at about 32°C in week one, reducing slowly. Use starter, then finisher feed. Keep litter dry and vaccinate as your vet advises (Newcastle, Gumboro). Book buyers before the batch is ready.',
  },
  {
    id: 'pigs', title: 'Pig keeping', source: 'Extension pig production guide',
    keywords: ['pig', 'pigs', 'embizzi', 'nguruwe', 'piglet', 'sow', 'boar'],
    body: 'Keep pigs in a clean, dry, fenced sty — free-range pigs spread African swine fever. Never feed swill containing pork. Deworm every 3 months. A sow is pregnant for about 3 months, 3 weeks and 3 days (114 days). Record breeding dates in Kungula Book for reminders.',
  },
  {
    id: 'goats', title: 'Goat keeping', source: 'Extension small ruminant guide',
    keywords: ['goat', 'goats', 'embuzi', 'mbuzi', 'kid', 'dyel'],
    body: 'Give goats a raised, dry house, browse and legumes, clean water and mineral licks. Deworm every 3 months or as the vet advises, and vaccinate against PPR. A doe is pregnant for about 5 months.',
  },
  {
    id: 'fish', title: 'Fish farming basics', source: 'NaFIRRI / extension aquaculture guide',
    keywords: ['fish', 'pond', 'tilapia', 'catfish', 'ebyennyanja', 'samaki', 'fingerlings'],
    body: 'Stock tilapia at about 3 fingerlings per square metre in a well-fertilised pond, or catfish at higher densities with good feeding. Buy fingerlings from certified hatcheries. Feed 2–3 times a day; tilapia reach about 300 g in 6 months with good feed. Keep water green (plankton) but not smelly.',
  },
  {
    id: 'tomato-care', title: 'Growing tomatoes', source: 'Extension vegetable guide',
    keywords: ['tomato', 'tomatoes', 'nnyaanya', 'nyanya', 'staking', 'nursery', 'transplant'],
    body: 'Raise seedlings in a nursery and transplant at 4–6 weeks. Space 60 cm × 45 cm, stake and prune to one or two main stems. Water at the base, mulch, and rotate away from potato and eggplant. Blight is the main risk in wet weather — protect early.',
  },
  {
    id: 'irrigation', title: 'Watering in dry spells', source: 'Climate-smart agriculture guides',
    keywords: ['irrigation', 'water', 'dry', 'drought', 'dry spell', 'watering', 'ekyeya', 'ukame'],
    body: 'Water early morning or evening at the base of plants. Mulch to keep moisture. Small drip kits, bucket drip or water cans save water for vegetables. Dig trenches and pits (zai) to harvest rain. Kungula Weather warns you before long dry spells.',
    link: '/weather',
  },
  {
    id: 'counterfeit', title: 'Spotting fake inputs', source: 'MAAIF agro-input guidance',
    keywords: ['fake', 'counterfeit', 'genuine', 'original', 'real', 'quality', 'seed', 'chemical'],
    body: 'Buy from verified dealers. Check the seal is unbroken, the label has a registration number, batch number and expiry date, and that seed bags carry the certification label. Use the manufacturer scratch-code or SMS check where offered. Kungula Duka lists only verified dealers.',
    link: '/duka',
  },
  {
    id: 'momo-safety', title: 'Mobile money safety', source: 'Bank of Uganda consumer protection guidance',
    keywords: ['mobile money', 'momo', 'airtel', 'fraud', 'pin', 'scam', 'money'],
    body: 'Never share your mobile money PIN — not even with Kungula, a Champion or someone claiming to be from the telco. Kungula will never ask for your PIN. Confirm payments in your own mobile money messages, not screenshots.',
  },
  {
    id: 'loan-score', title: 'Your Loan Readiness Score', source: 'Kungula Finance',
    keywords: ['loan', 'loans', 'credit', 'borrow', 'score', 'sacco', 'pdm', 'looni', 'mkopo', 'readiness'],
    body: 'Your score (0–100) comes from your own Kungula activity: regular records, harvest and sales recorded, mapped plots, lessons completed and repayments. You see it any time and decide if a lender can see it. Open Kungula Finance to see your score and how to raise it.',
    link: '/finance',
  },
  {
    id: 'eudr', title: 'EUDR and coffee mapping', source: 'EU Regulation 2023/1115',
    keywords: ['eudr', 'deforestation', 'europe', 'export', 'map', 'mapping', 'trace', 'traceability', 'gps'],
    body: 'The EU deforestation rule requires coffee sold in Europe to come from plots not deforested after 31 December 2020, proven by plot GPS locations. A Champion can map your plots for free with Kungula Trace so your co-operative and exporter can keep selling your coffee.',
    link: '/trace',
  },
  {
    id: 'storage-sell', title: 'Store or sell?', source: 'Kungula Market price history',
    keywords: ['sell', 'store', 'price', 'prices', 'market', 'buyer', 'beeyi', 'bei', 'okutunda', 'kuuza'],
    body: 'Prices are usually lowest at harvest. If your produce is dry and stored well, prices often rise a few months later. Check Kungula Market for your crop and nearest market, and consider collective selling with your group for better buyers.',
    link: '/market',
  },
  {
    id: 'vet-help', title: 'When to call a vet', source: 'Animal Diseases Act; veterinary practice',
    keywords: ['vet', 'doctor', 'musawo', 'daktari', 'sick animal', 'injection'],
    body: 'Call a vet when several animals are sick or dying, when an animal has high fever and stops eating, or for diseases like FMD, lumpy skin, ASF, PPR or Newcastle, which must be reported to the district veterinary officer. Injections and prescription drugs should be given or advised by a vet.',
  },
];
