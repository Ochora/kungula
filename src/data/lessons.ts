// Kungula Academy lessons. Short, practical, read aloud by the phone's voice.
// Content needs review by the Head of Agronomy before public launch.

export interface Lesson {
  id: string; track: 'Crops' | 'Pests & diseases' | 'Animals' | 'After harvest' | 'Farm business' | 'Export ready';
  title: string; minutes: number; icon: string; crops?: string[];
  sections: { heading: string; body: string }[];
  quiz: { q: string; options: string[]; answer: number; why: string }[];
}

export const LESSONS: Lesson[] = [
  {
    id: 'l-safe-spray', track: 'Pests & diseases', title: 'Spraying safely', minutes: 5, icon: '🧤',
    sections: [
      { heading: 'Read the label first', body: 'Every genuine product has a registration number, the crops it is for, the dose and the pre-harvest interval (days to wait before harvesting). If the label is missing or the seal is broken, do not buy it.' },
      { heading: 'Protect your body', body: 'Wear gloves, a mask, long sleeves, trousers and gumboots. Never eat, drink or smoke while spraying. Wash with soap afterwards.' },
      { heading: 'Mix right', body: 'Use the measure on the label. A bottle-top is about 10 ml; a level tablespoon of powder is about 15 g. Mix in a 20-litre tank with clean water. More chemical is not better — it wastes money and harms you and the soil.' },
      { heading: 'Spray at the right time', body: 'Spray in the early morning or evening when it is calm. Do not spray if rain is expected within 6 hours — check Kungula Weather.' },
      { heading: 'Empty containers', body: 'Never reuse chemical containers for water or food. Rinse three times, pour rinse into the tank, then pierce and bury the container away from water.' },
    ],
    quiz: [
      { q: 'Rain is expected in 3 hours. Should you spray fungicide now?', options: ['Yes', 'No, wait'], answer: 1, why: 'Rain will wash it off before it works.' },
      { q: 'What should you do with an empty chemical bottle?', options: ['Use it to carry water', 'Rinse three times, pierce and bury it', 'Sell it'], answer: 1, why: 'Chemical traces stay in bottles and poison people.' },
      { q: 'The pre-harvest interval tells you…', options: ['How often to spray', 'How many days to wait before harvest', 'How much to mix'], answer: 1, why: 'Harvesting too early leaves chemical on food.' },
    ],
  },
  {
    id: 'l-coffee-care', track: 'Crops', title: 'Coffee: pruning, mulching and feeding', minutes: 7, icon: '☕', crops: ['coffee'],
    sections: [
      { heading: 'Why prune', body: 'Pruning lets light and air in, reduces rust and twig borer, and puts the tree\'s energy into berries. Prune after harvest.' },
      { heading: 'How to prune robusta', body: 'Keep 3–4 healthy upright stems per stool. Remove suckers, dead wood and branches touching the ground. Burn twigs attacked by twig borer.' },
      { heading: 'Mulch', body: 'Spread dry grass or banana trash around the tree, leaving a hand-width gap from the stem. Mulch keeps moisture and adds food to the soil.' },
      { heading: 'Feed', body: 'Apply well-rotted manure or compost each season. Where advised, add NPK at the start of each rainy season, split into two applications.' },
    ],
    quiz: [
      { q: 'How many stems should you keep per robusta stool?', options: ['1', '3–4', '10'], answer: 1, why: 'Three to four healthy stems balance yield and airflow.' },
      { q: 'Where should mulch go?', options: ['Touching the stem', 'Around the tree with a small gap from the stem', 'Only between rows'], answer: 1, why: 'Mulch against the stem can rot the bark.' },
      { q: 'When is the best time to prune?', options: ['After harvest', 'During flowering', 'When berries are ripe'], answer: 0, why: 'Pruning after harvest prepares the tree for the new season.' },
    ],
  },
  {
    id: 'l-faw', track: 'Pests & diseases', title: 'Beating fall armyworm in maize', minutes: 5, icon: '🐛', crops: ['maize'],
    sections: [
      { heading: 'Know it', body: 'Look for ragged holes and sawdust-like droppings in the funnel. The caterpillar has an inverted "Y" on its head and four dots in a square near its tail.' },
      { heading: 'Scout', body: 'Twice a week for the first six weeks, walk in a W across your field and check 20 plants. If 4 or more have fresh damage, act.' },
      { heading: 'Act early', body: 'Small caterpillars die easily. Put dry sand, ash or soil in the funnel, or spray a registered product into the funnel early morning or evening.' },
      { heading: 'Prevent', body: 'Plant early with the rains and at the same time as neighbours. Intercrop with beans. Push-pull (desmodium between rows and Napier around the field) reduces attacks.' },
    ],
    quiz: [
      { q: 'How many plants do you check when scouting?', options: ['5', '20', '100'], answer: 1, why: 'Twenty plants in a W pattern gives a fair picture of the field.' },
      { q: 'Where do you put sand or ash?', options: ['On the roots', 'In the funnel', 'On the cob'], answer: 1, why: 'Caterpillars hide and feed in the funnel.' },
      { q: 'Best time to spray?', options: ['Midday', 'Early morning or evening', 'In the rain'], answer: 1, why: 'Caterpillars feed then and the product lasts longer.' },
    ],
  },
  {
    id: 'l-bxw', track: 'Pests & diseases', title: 'Stopping banana wilt (kiwotoka)', minutes: 5, icon: '🍌', crops: ['banana'],
    sections: [
      { heading: 'Signs', body: 'Yellowing, wilting leaves; male bud shrivels; fruits ripen early and unevenly; yellow ooze when the stem is cut; brown stains in the pulp.' },
      { heading: 'Single diseased stem removal (SDSR)', body: 'Cut only the sick stem at soil level as soon as you see it, chop it and leave it to rot on the spot. Clean the panga with fire or JIK.' },
      { heading: 'Remove male buds', body: 'Use a forked stick to break off the male bud after the last hand forms. Insects carry the disease from flower to flower.' },
      { heading: 'Clean planting material', body: 'Get suckers only from gardens with no wilt. Never move banana leaves or peels from other gardens into yours.' },
    ],
    quiz: [
      { q: 'What tool should you use to remove male buds?', options: ['A panga', 'A forked stick', 'A hoe'], answer: 1, why: 'A forked stick does not carry bacteria from plant to plant.' },
      { q: 'Can spraying cure BXW?', options: ['Yes', 'No'], answer: 1, why: 'There is no cure; removal and clean practices stop it.' },
      { q: 'How do you clean a panga?', options: ['Wipe on grass', 'Pass through fire or dip in JIK', 'Wash in a stream'], answer: 1, why: 'Fire or JIK kills the bacteria.' },
    ],
  },
  {
    id: 'l-poultry', track: 'Animals', title: 'Keeping chickens healthy', minutes: 6, icon: '🐔', crops: ['poultry'],
    sections: [
      { heading: 'Vaccination calendar', body: 'A common plan: Marek\'s at the hatchery; Newcastle and Gumboro in the first weeks as your vet advises; Newcastle every 3 months after. Write each date in Kungula Book and set reminders.' },
      { heading: 'Biosecurity', body: 'Footbath at the door, no visitors in the house, quarantine new birds for 2 weeks, keep wild birds out of feed and water.' },
      { heading: 'Dry litter', body: 'Wet litter causes coccidiosis. Fix leaking drinkers, turn litter, add fresh shavings.' },
      { heading: 'Feed and water', body: 'Give the right feed for the stage (chick mash, growers, layers). Clean water every day. Layers need about 120 g of feed per bird per day.' },
    ],
    quiz: [
      { q: 'How often is Newcastle vaccination usually repeated?', options: ['Every year', 'Every 3 months', 'Never'], answer: 1, why: 'Protection fades; repeat about every 3 months.' },
      { q: 'Wet litter increases risk of…', options: ['Coccidiosis', 'Sunburn', 'Rust'], answer: 0, why: 'Coccidia multiply in wet, dirty litter.' },
      { q: 'New birds should be kept apart for…', options: ['1 day', '2 weeks', 'No need'], answer: 1, why: 'Quarantine shows hidden disease before it reaches your flock.' },
    ],
  },
  {
    id: 'l-dairy', track: 'Animals', title: 'More milk from your cows', minutes: 6, icon: '🐄', crops: ['cattle'],
    sections: [
      { heading: 'Water', body: 'A milking cow drinks 50–100 litres a day. Clean water always available can raise milk quickly.' },
      { heading: 'Feed', body: 'Good pasture or Napier, plus a legume (e.g. lablab, calliandra) for protein. Dairy meal at milking according to yield.' },
      { heading: 'Tick control', body: 'Spray or dip regularly and rotate acaricide classes. East Coast fever kills calves — ask a vet about ITM vaccination.' },
      { heading: 'Clean milking', body: 'Wash hands and udder, use a strip cup to check for mastitis, milk completely, keep milk in clean aluminium cans.' },
    ],
    quiz: [
      { q: 'How much water does a milking cow need per day?', options: ['5 litres', '50–100 litres', '500 litres'], answer: 1, why: 'Milk is mostly water.' },
      { q: 'Which disease is spread by brown ear ticks?', options: ['East Coast fever', 'Newcastle', 'Rust'], answer: 0, why: 'Ticks carry Theileria parasites.' },
      { q: 'A strip cup helps you detect…', options: ['Mastitis', 'Pregnancy', 'Worms'], answer: 0, why: 'Clots or watery milk in the first strips show mastitis.' },
    ],
  },
  {
    id: 'l-storage', track: 'After harvest', title: 'Drying and storing grain', minutes: 5, icon: '🛍️', crops: ['maize', 'beans', 'soya', 'sesame', 'groundnuts'],
    sections: [
      { heading: 'Dry well', body: 'Dry on tarpaulins, not bare ground. Grain is dry enough when it cracks between your teeth or rattles in a bottle with salt that stays dry (salt test). Buyers want maize at 13.5% moisture or less.' },
      { heading: 'Clean and grade', body: 'Remove stones, broken grains and rotten ones. Graded grain earns better prices.' },
      { heading: 'Store airtight', body: 'Hermetic bags (e.g. PICS) kill weevils without chemicals by cutting off air. Store off the floor on pallets, away from walls.' },
      { heading: 'Sell at the right time', body: 'Kungula Market shows how prices usually move. Good storage lets you wait for a better price — or use a warehouse receipt loan.' },
    ],
    quiz: [
      { q: 'Where should you dry grain?', options: ['On bare soil', 'On a tarpaulin', 'In a closed room'], answer: 1, why: 'Soil adds dirt, moisture and aflatoxin risk.' },
      { q: 'Hermetic bags control weevils by…', options: ['Poison', 'Cutting off air', 'Heat'], answer: 1, why: 'Without oxygen insects die.' },
      { q: 'Safe moisture for maize is about…', options: ['13.5% or less', '25%', '40%'], answer: 0, why: 'Wetter grain moulds and loses value.' },
    ],
  },
  {
    id: 'l-records', track: 'Farm business', title: 'Why farm records unlock loans', minutes: 4, icon: '📒',
    sections: [
      { heading: 'Records show your farm is a business', body: 'Lenders want to see costs, sales and harvests over time. Kungula Book keeps them for you, even offline.' },
      { heading: 'Record every shilling', body: 'Write down inputs, labour, transport and every sale. You can speak it: "I paid two workers 10,000 each to weed the north plot."' },
      { heading: 'Know your profit', body: 'Profit = money in − money out. Kungula shows it per plot and per season, so you see which crop pays best.' },
      { heading: 'Your Loan Readiness Score', body: 'Regular records, mapped plots, lessons and repayment history raise your score. You decide when a lender can see it.' },
    ],
    quiz: [
      { q: 'Profit equals…', options: ['Money in − money out', 'Money in only', 'Harvest weight'], answer: 0, why: 'Profit is what remains after costs.' },
      { q: 'Who decides if a lender sees your score?', options: ['Kungula', 'You', 'The lender'], answer: 1, why: 'Your data is shared only with your consent.' },
      { q: 'Which raises your loan readiness score?', options: ['Regular records', 'Deleting records', 'Never logging in'], answer: 0, why: 'Consistent records show a reliable farmer.' },
    ],
  },
  {
    id: 'l-loans', track: 'Farm business', title: 'Understanding loans and insurance', minutes: 5, icon: '💰',
    sections: [
      { heading: 'Total cost in shillings', body: 'Always ask: "How many shillings will I pay back in total?" A loan of 500,000 at 2% per month for 6 months costs about 60,000 in interest — 560,000 total.' },
      { heading: 'Borrow for things that earn', body: 'Seed, fertiliser and vaccines that raise your harvest can repay a loan. Avoid borrowing for things that do not earn.' },
      { heading: 'Repay on time', body: 'On-time repayment builds your record and unlocks larger, cheaper loans next season.' },
      { heading: 'Insurance', body: 'Weather-index insurance pays when rain fails in your area, without anyone inspecting your farm. Under the Uganda Agriculture Insurance Scheme, part of the premium is paid by government.' },
    ],
    quiz: [
      { q: '500,000 at 2% per month for 6 months costs about…', options: ['10,000', '60,000', '500,000'], answer: 1, why: '2% × 6 = 12% of 500,000 = 60,000.' },
      { q: 'Best use of an input loan is…', options: ['A party', 'Certified seed and fertiliser', 'Airtime'], answer: 1, why: 'Inputs raise the harvest that repays the loan.' },
      { q: 'Weather-index insurance pays when…', options: ['A lender asks', 'Rain fails in your area', 'Prices fall'], answer: 1, why: 'It follows measured rainfall for your area.' },
    ],
  },
  {
    id: 'l-eudr', track: 'Export ready', title: 'EUDR: keeping your coffee sellable in Europe', minutes: 5, icon: '🗺️', crops: ['coffee'],
    sections: [
      { heading: 'What the EU rule asks', body: 'Buyers selling coffee in the European Union must prove it was not grown on land cleared of forest after 31 December 2020, using the GPS location of each farm plot.' },
      { heading: 'What you need to do', body: 'Have your coffee plots mapped (a Champion can walk the boundary with Kungula Trace), confirm your land details and give consent for your co-operative and exporter to use the map.' },
      { heading: 'What you get', body: 'You stay in premium supply chains. Mapping is free for farmers — exporters pay for it.' },
      { heading: 'Do not clear forest', body: 'Expanding coffee into forest after 2020 can make your coffee unsellable in Europe. Expand on existing farmland instead.' },
    ],
    quiz: [
      { q: 'The forest cut-off date is…', options: ['31 Dec 2020', '1 Jan 2026', 'No date'], answer: 0, why: 'Plots deforested after this date cannot supply the EU.' },
      { q: 'Who pays for mapping on Kungula?', options: ['The farmer', 'Exporters and co-operatives', 'Nobody'], answer: 1, why: 'Kungula Trace is paid by exporters.' },
      { q: 'What does mapping record?', options: ['Your plot boundary GPS points', 'Your phone contacts', 'Your bank PIN'], answer: 0, why: 'GPS location of the plot is what the rule needs.' },
    ],
  },
];

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
