// Kungula Scan knowledge base: crop and animal conditions common in Uganda.
// Each condition lists the visible signs a farmer can tick. Scan ranks
// conditions by how well the ticked signs match. Treatment advice follows
// widely published MAAIF / NARO / extension guidance and always tells the
// farmer to read the product label. It must be reviewed by an agronomist and
// a vet before public launch.

export type Urgency = 'act24' | 'watch3' | 'prevent';

export interface Symptom { id: string; label: string; lg?: string }

export interface Treatment {
  type: 'cultural' | 'organic' | 'chemical' | 'vet';
  text: string;
  product?: string; // generic active ingredient, searched in Duka
  dose?: string; // in local measures
  phi?: string; // pre-harvest interval / withdrawal period
}

export interface Condition {
  id: string;
  subject: string; // crop or animal id
  name: string;
  lg?: string;
  cause: string;
  kind: 'fungal' | 'bacterial' | 'viral' | 'pest' | 'deficiency' | 'parasite';
  signs: Record<string, number>; // symptom id -> weight (1-3)
  urgency: Urgency;
  spreads: string;
  explain: string;
  treatments: Treatment[];
  prevention: string[];
  notifiable?: boolean;
  vetRequired?: boolean;
}

export const SYMPTOMS: Record<string, Symptom[]> = {
  coffee: [
    { id: 'wilt_whole', label: 'Whole tree wilting, leaves dry but stay hanging' },
    { id: 'bark_stripe', label: 'Blue-black stripes under the bark of the stem' },
    { id: 'orange_powder', label: 'Orange-yellow powder under the leaves' },
    { id: 'yellow_spots_top', label: 'Pale yellow spots on top of the leaves' },
    { id: 'leaf_drop', label: 'Many leaves falling early' },
    { id: 'berry_dark', label: 'Dark sunken patches on green berries' },
    { id: 'berry_drop', label: 'Green berries rotting and falling' },
    { id: 'twig_hole', label: 'Tiny pin hole on twigs, twig tip dies' },
    { id: 'twig_wilt', label: 'Young branches wilting and drying' },
    { id: 'yellow_general', label: 'Leaves pale or yellow all over' },
  ],
  banana: [
    { id: 'yellow_leaves', label: 'Leaves turning yellow and wilting' },
    { id: 'male_bud_shrivel', label: 'Male bud shrivelling / bracts drying' },
    { id: 'uneven_ripen', label: 'Fruits ripen early and unevenly' },
    { id: 'yellow_ooze', label: 'Yellow liquid (ooze) when stem is cut' },
    { id: 'pulp_brown', label: 'Brown stains inside fruit pulp' },
    { id: 'old_leaves_yellow_edge', label: 'Old leaves yellow from the edges, hang down' },
    { id: 'stem_split', label: 'Base of the stem splits' },
    { id: 'purple_ring', label: 'Brown-red ring inside the stem (corm) when cut' },
    { id: 'weevil_tunnels', label: 'Tunnels in the corm, plants fall over' },
  ],
  maize: [
    { id: 'streaks_yellow', label: 'Thin yellow streaks along the leaves' },
    { id: 'stunted', label: 'Plants stunted' },
    { id: 'mottled', label: 'Yellow mottling / mosaic on leaves' },
    { id: 'leaf_edge_dry', label: 'Leaves drying from the edges inward' },
    { id: 'dead_heart', label: 'Central leaves die ("dead heart")' },
    { id: 'poor_cobs', label: 'Small cobs with few grains' },
    { id: 'ragged_holes', label: 'Ragged holes in leaves, window-like patches' },
    { id: 'frass', label: 'Sawdust-like droppings in the funnel' },
    { id: 'caterpillar', label: 'Caterpillar with inverted "Y" on its head' },
    { id: 'purple_leaves', label: 'Leaves purple-red' },
  ],
  cassava: [
    { id: 'mosaic', label: 'Yellow-green mosaic pattern on leaves' },
    { id: 'leaf_twist', label: 'Leaves twisted, curled or reduced in size' },
    { id: 'stunted', label: 'Plants stunted' },
    { id: 'vein_yellow', label: 'Yellow patches along leaf veins (older leaves)' },
    { id: 'stem_streak', label: 'Brown streaks on green stem' },
    { id: 'root_rot', label: 'Brown, dry rot inside roots' },
    { id: 'root_constrict', label: 'Roots constricted / pitted' },
  ],
  beans: [
    { id: 'rust_pustules', label: 'Small red-brown raised spots under leaves' },
    { id: 'yellow_halo', label: 'Yellow ring around the spots' },
    { id: 'angular_spots', label: 'Grey-brown angular spots limited by veins' },
    { id: 'pod_spots', label: 'Red-brown spots on pods' },
    { id: 'leaf_drop', label: 'Leaves fall early' },
    { id: 'wilting', label: 'Plants wilting in the day' },
  ],
  tomato: [
    { id: 'target_rings', label: 'Brown spots with rings like a target, older leaves first' },
    { id: 'yellow_around', label: 'Yellowing around spots' },
    { id: 'water_patches', label: 'Large dark water-soaked patches, spreads fast' },
    { id: 'white_mould', label: 'White mould under leaves in wet weather' },
    { id: 'fruit_rot_brown', label: 'Firm brown greasy patches on fruit' },
    { id: 'stem_lesion', label: 'Dark patches on the stem' },
    { id: 'sudden_wilt', label: 'Plant wilts suddenly while still green' },
    { id: 'fruit_end_black', label: 'Black sunken patch at bottom end of fruit' },
  ],
  poultry: [
    { id: 'twisted_neck', label: 'Twisted neck, paralysis, walking in circles' },
    { id: 'gasping', label: 'Gasping, coughing, sneezing' },
    { id: 'green_diarrhoea', label: 'Green watery droppings' },
    { id: 'sudden_deaths', label: 'Many birds dying quickly' },
    { id: 'egg_drop', label: 'Sudden drop in eggs, soft shells' },
    { id: 'white_diarrhoea', label: 'White watery droppings, pecking at vent' },
    { id: 'ruffled', label: 'Ruffled feathers, sleepy, huddled' },
    { id: 'young_3_6wk', label: 'Mostly young birds (3–6 weeks)' },
    { id: 'bloody_droppings', label: 'Bloody or brown droppings' },
    { id: 'pale_comb', label: 'Pale comb, birds not growing' },
  ],
  cattle: [
    { id: 'swollen_nodes', label: 'Swollen lymph nodes (below ear, in front of shoulder)' },
    { id: 'high_fever', label: 'High fever, not eating' },
    { id: 'breathing', label: 'Fast or difficult breathing, froth at nose' },
    { id: 'ticks', label: 'Many ticks on the animal' },
    { id: 'skin_lumps', label: 'Round firm lumps all over the skin' },
    { id: 'mouth_blisters', label: 'Blisters in mouth, drooling saliva' },
    { id: 'lameness', label: 'Lameness, sores between the hooves' },
    { id: 'milk_drop', label: 'Sudden drop in milk' },
    { id: 'eye_discharge', label: 'Watery eyes and nose' },
  ],
  pigs: [
    { id: 'high_fever', label: 'High fever, not eating' },
    { id: 'red_skin', label: 'Red-purple patches on ears, belly, legs' },
    { id: 'sudden_deaths', label: 'Sudden deaths of several pigs' },
    { id: 'bloody_diarrhoea', label: 'Bloody diarrhoea or vomiting' },
    { id: 'huddling', label: 'Pigs huddle together, weak' },
    { id: 'cough', label: 'Coughing' },
  ],
  goats: [
    { id: 'high_fever', label: 'High fever, not eating' },
    { id: 'diarrhoea', label: 'Diarrhoea' },
    { id: 'eye_discharge', label: 'Discharge from eyes and nose' },
    { id: 'mouth_sores', label: 'Sores in the mouth' },
    { id: 'pale_eyelids', label: 'Pale eyelids, weak, bottle jaw' },
    { id: 'cough', label: 'Coughing, difficult breathing' },
  ],
};

const t = (type: Treatment['type'], text: string, extra: Partial<Treatment> = {}): Treatment => ({ type, text, ...extra });

export const CONDITIONS: Condition[] = [
  // ---------- COFFEE ----------
  {
    id: 'coffee_wilt', subject: 'coffee', name: 'Coffee wilt disease', cause: 'Fungus (Gibberella xylarioides)', kind: 'fungal',
    signs: { wilt_whole: 3, bark_stripe: 3, leaf_drop: 1, berry_drop: 1 }, urgency: 'act24',
    spreads: 'Spreads through soil, tools and moving infected wood.',
    explain: 'The fungus blocks water inside the tree. A tree with coffee wilt cannot be cured, but you can stop it reaching the rest of your garden.',
    treatments: [
      t('cultural', 'Uproot the sick tree and burn it on the spot. Do not carry it across the garden.'),
      t('cultural', 'Clean pangas and hoes with fire or JIK (1 cup in 10 litres of water) after touching the tree.'),
      t('cultural', 'Do not replant coffee in the same hole for at least 6 months. Replant with wilt-resistant robusta (from NARO/MAAIF nurseries).'),
    ],
    prevention: ['Use clean, certified wilt-resistant seedlings.', 'Avoid wounding stems when weeding.', 'Check trees every week and act early.'],
  },
  {
    id: 'coffee_leaf_rust', subject: 'coffee', name: 'Coffee leaf rust', cause: 'Fungus (Hemileia vastatrix)', kind: 'fungal',
    signs: { orange_powder: 3, yellow_spots_top: 2, leaf_drop: 2 }, urgency: 'watch3',
    spreads: 'Spores blow in wind and rain splash; worse in wet, warm weather.',
    explain: 'Rust eats the leaves, so the tree makes less food and gives fewer berries next season.',
    treatments: [
      t('chemical', 'Spray a copper fungicide on both sides of the leaves.', { product: 'copper', dose: 'About 3 heaped tablespoons (≈50 g) in a 20-litre tank — follow the label', phi: 'Usually 14–21 days before harvest; check label' }),
      t('cultural', 'Prune to open the canopy so leaves dry faster. Remove suckers.'),
    ],
    prevention: ['Good spacing and pruning.', 'Feed trees well (manure, mulch).', 'Spray at the start of rains if rust appeared last season.'],
  },
  {
    id: 'coffee_berry_disease', subject: 'coffee', name: 'Coffee berry disease', cause: 'Fungus (Colletotrichum kahawae) — mainly arabica', kind: 'fungal',
    signs: { berry_dark: 3, berry_drop: 2 }, urgency: 'act24',
    spreads: 'Rain splash between berries; mostly arabica at high altitude (Bugisu, Kapchorwa, West Nile highlands).',
    explain: 'The fungus rots green berries so they fall before harvest.',
    treatments: [
      t('chemical', 'Spray a copper fungicide when berries are forming, repeat in rains as on the label.', { product: 'copper', dose: '≈50 g per 20-litre tank — follow the label', phi: 'Check label' }),
      t('cultural', 'Pick and bury diseased berries. Prune old wood and open the canopy.'),
    ],
    prevention: ['Plant resistant arabica varieties.', 'Prune after harvest.', 'Keep the garden clean.'],
  },
  {
    id: 'coffee_twig_borer', subject: 'coffee', name: 'Black coffee twig borer', cause: 'Beetle (Xylosandrus compactus)', kind: 'pest',
    signs: { twig_hole: 3, twig_wilt: 3, leaf_drop: 1 }, urgency: 'watch3',
    spreads: 'Small beetles fly between trees and many other host plants.',
    explain: 'A tiny beetle bores into young branches and the branch dies beyond the hole.',
    treatments: [
      t('cultural', 'Cut the attacked twig 5 cm below the hole and burn the cuttings the same day.'),
      t('cultural', 'Do this across your whole garden and agree with neighbours to do the same.'),
      t('chemical', 'Only if MAAIF/extension advises: a registered insecticide for twig borer.', { product: 'insecticide', dose: 'As on the label' }),
    ],
    prevention: ['Prune and burn regularly.', 'Feed trees well; stressed trees are attacked more.', 'Remove alternative host plants nearby.'],
  },
  {
    id: 'coffee_deficiency', subject: 'coffee', name: 'Nutrient shortage (likely nitrogen)', cause: 'Poor soil fertility', kind: 'deficiency',
    signs: { yellow_general: 3, leaf_drop: 1 }, urgency: 'prevent',
    spreads: 'Not infectious.',
    explain: 'Leaves turn pale when the soil lacks food, often nitrogen. It is common after heavy cropping.',
    treatments: [
      t('organic', 'Apply well-rotted manure or compost around the tree (not touching the stem) and mulch.', { dose: '1–2 basins (≈10–20 kg) per tree per season' }),
      t('chemical', 'Apply NPK or CAN fertiliser at the start of rains.', { product: 'fertiliser', dose: 'Often 2–4 handfuls (≈100–200 g) per mature tree, split over the two rains — confirm with your extension officer' }),
    ],
    prevention: ['Test your soil.', 'Mulch every season.', 'Intercrop with beans to add nitrogen.'],
  },

  // ---------- BANANA ----------
  {
    id: 'banana_bxw', subject: 'banana', name: 'Banana Xanthomonas wilt (BXW)', lg: 'Kiwotoka', cause: 'Bacteria (Xanthomonas)', kind: 'bacterial',
    signs: { yellow_leaves: 2, male_bud_shrivel: 3, uneven_ripen: 3, yellow_ooze: 3, pulp_brown: 3 }, urgency: 'act24',
    spreads: 'Insects visiting the male flower, dirty tools and moving infected suckers.',
    explain: 'BXW (kiwotoka) kills the whole mat and spreads very fast. There is no spray that cures it.',
    treatments: [
      t('cultural', 'Cut the sick plant down at soil level, chop it into small pieces and leave or bury them on the spot.'),
      t('cultural', 'Clean tools with fire or JIK after every cut.'),
      t('cultural', 'Remove male buds with a forked stick (not a knife) once the last hand forms.'),
    ],
    prevention: ['Use clean suckers from a healthy garden.', 'De-bud with a forked stick.', 'Do not move banana peels and leaves from other gardens.'],
  },
  {
    id: 'banana_fusarium', subject: 'banana', name: 'Fusarium wilt (Panama disease)', cause: 'Soil fungus (Fusarium oxysporum)', kind: 'fungal',
    signs: { old_leaves_yellow_edge: 3, stem_split: 2, purple_ring: 3, yellow_leaves: 1 }, urgency: 'watch3',
    spreads: 'Lives in soil for many years; spreads in soil on feet, tools and suckers.',
    explain: 'Mainly attacks sweet and beer bananas (e.g. Sukari ndizi, Kayinja). The fungus blocks water in the stem.',
    treatments: [
      t('cultural', 'Remove the affected mat and do not replant susceptible varieties there.'),
      t('cultural', 'Plant resistant cooking types (most East African Highland matooke are tolerant).'),
    ],
    prevention: ['Use clean planting material.', 'Keep soil off tools and boots when moving between gardens.'],
  },
  {
    id: 'banana_weevil', subject: 'banana', name: 'Banana weevil', cause: 'Beetle (Cosmopolites sordidus)', kind: 'pest',
    signs: { weevil_tunnels: 3, yellow_leaves: 1 }, urgency: 'watch3',
    spreads: 'Weevils live in old stems and corms.',
    explain: 'Weevil grubs dig tunnels in the corm, so plants are weak, give small bunches and fall over.',
    treatments: [
      t('cultural', 'Split old stems lengthwise and lay them face-down as traps; collect and kill weevils every few days.'),
      t('cultural', 'Cut harvested stems at ground level and cover the stump with soil.'),
    ],
    prevention: ['Pare and clean suckers before planting (hot water 52°C for 20 minutes where possible).', 'Keep the garden clean of old stems.'],
  },

  // ---------- MAIZE ----------
  {
    id: 'maize_streak', subject: 'maize', name: 'Maize streak virus', cause: 'Virus spread by leafhoppers', kind: 'viral',
    signs: { streaks_yellow: 3, stunted: 2, poor_cobs: 1 }, urgency: 'watch3',
    spreads: 'Tiny leafhopper insects carry the virus, especially in late-planted maize.',
    explain: 'Sick plants cannot be cured. Early-infected plants give little or no grain.',
    treatments: [
      t('cultural', 'Pull out badly affected young plants early so leafhoppers do not pick the virus from them.'),
      t('cultural', 'Next season plant streak-tolerant varieties and plant early with the rains.'),
    ],
    prevention: ['Plant tolerant varieties.', 'Plant at the same time as neighbours.', 'Remove grass weeds around the garden.'],
  },
  {
    id: 'maize_mln', subject: 'maize', name: 'Maize lethal necrosis (MLN)', cause: 'Two viruses together', kind: 'viral',
    signs: { mottled: 2, leaf_edge_dry: 3, dead_heart: 3, stunted: 2, poor_cobs: 2 }, urgency: 'act24',
    spreads: 'Insects (thrips, aphids, beetles) and seed.',
    explain: 'MLN can wipe out a whole field. No cure — act to protect next season.',
    treatments: [
      t('cultural', 'Uproot and destroy affected plants.'),
      t('cultural', 'Do not plant maize again on this plot for one or two seasons — rotate with beans, soya or groundnuts.'),
      t('cultural', 'Report to your extension officer; MLN is monitored.'),
    ],
    prevention: ['Buy certified seed only.', 'Rotate crops.', 'Control insects early.'],
  },
  {
    id: 'maize_faw', subject: 'maize', name: 'Fall armyworm', cause: 'Caterpillar (Spodoptera frugiperda)', kind: 'pest',
    signs: { ragged_holes: 3, frass: 3, caterpillar: 3, dead_heart: 1 }, urgency: 'act24',
    spreads: 'Moths fly long distances and lay eggs on young maize.',
    explain: 'Caterpillars feed inside the funnel of young maize. Small caterpillars are easiest to kill.',
    treatments: [
      t('cultural', 'Check 20 plants in a W shape across the field. If 1 in 5 plants is attacked, act.'),
      t('organic', 'Put a pinch of dry sand, wood ash or soil into each funnel to kill small caterpillars.'),
      t('chemical', 'Spray a registered fall-armyworm insecticide into the funnel early morning or evening.', { product: 'emamectin', dose: 'Follow the label (often 1 bottle-top per 20-litre tank)', phi: 'Check label' }),
    ],
    prevention: ['Plant early.', 'Intercrop with beans; push-pull with desmodium and Napier.', 'Scout twice a week in the first 6 weeks.'],
  },
  {
    id: 'maize_phosphorus', subject: 'maize', name: 'Phosphorus shortage', cause: 'Poor soil or cold, wet soil', kind: 'deficiency',
    signs: { purple_leaves: 3, stunted: 1 }, urgency: 'prevent',
    spreads: 'Not infectious.',
    explain: 'Purple leaves on young maize usually mean the roots cannot get enough phosphorus.',
    treatments: [
      t('chemical', 'At next planting, put DAP or NPK in the planting hole and cover with soil before the seed.', { product: 'fertiliser', dose: '1 level bottle-top per hole — follow extension advice' }),
      t('organic', 'Add compost or well-rotted manure.'),
    ],
    prevention: ['Soil test.', 'Use manure and fertiliser at planting.'],
  },

  // ---------- CASSAVA ----------
  {
    id: 'cassava_cmd', subject: 'cassava', name: 'Cassava mosaic disease', cause: 'Virus spread by whiteflies and cuttings', kind: 'viral',
    signs: { mosaic: 3, leaf_twist: 3, stunted: 2 }, urgency: 'watch3',
    spreads: 'Whiteflies and planting infected cuttings.',
    explain: 'No cure. Infected plants give fewer and smaller roots.',
    treatments: [
      t('cultural', 'Pull out infected plants early (first 3 months) and replace with clean cuttings.'),
      t('cultural', 'Never take cuttings from sick plants.'),
    ],
    prevention: ['Plant tolerant varieties (e.g. NASE series) from certified multipliers.', 'Remove sick plants early.'],
  },
  {
    id: 'cassava_cbsd', subject: 'cassava', name: 'Cassava brown streak disease', cause: 'Virus spread by whiteflies and cuttings', kind: 'viral',
    signs: { vein_yellow: 3, stem_streak: 2, root_rot: 3, root_constrict: 2 }, urgency: 'watch3',
    spreads: 'Whiteflies and infected cuttings.',
    explain: 'Leaves may look mild but the roots rot inside, making them unfit to eat or sell.',
    treatments: [
      t('cultural', 'Harvest early if roots are still good. Do not use these stems as planting material.'),
      t('cultural', 'Uproot and destroy infected plants.'),
    ],
    prevention: ['Clean certified cuttings.', 'Tolerant varieties.', 'Rogue sick plants early.'],
  },

  // ---------- BEANS ----------
  {
    id: 'bean_rust', subject: 'beans', name: 'Bean rust', cause: 'Fungus (Uromyces appendiculatus)', kind: 'fungal',
    signs: { rust_pustules: 3, yellow_halo: 2, leaf_drop: 1 }, urgency: 'watch3',
    spreads: 'Spores in wind; worse in cool, humid weather.',
    explain: 'Rust spots reduce leaf area so pods fill poorly.',
    treatments: [
      t('chemical', 'Spray mancozeb when the first spots appear; repeat after 10–14 days if needed.', { product: 'mancozeb', dose: '≈3 level tablespoons (40–50 g) per 20-litre tank — follow label', phi: 'Usually 7–14 days; check label' }),
      t('cultural', 'Remove and bury badly infected plants after harvest.'),
    ],
    prevention: ['Plant tolerant varieties.', 'Rotate with maize or cassava.', 'Wider spacing for air movement.'],
  },
  {
    id: 'bean_als', subject: 'beans', name: 'Angular leaf spot', cause: 'Fungus (Pseudocercospora griseola)', kind: 'fungal',
    signs: { angular_spots: 3, pod_spots: 2, leaf_drop: 2 }, urgency: 'watch3',
    spreads: 'Infected seed and crop residue; rain splash.',
    explain: 'Spots are square-ish because leaf veins stop them spreading. Badly infected plants drop leaves early.',
    treatments: [
      t('chemical', 'Spray mancozeb or a copper fungicide at first signs.', { product: 'mancozeb', dose: '≈40–50 g per 20-litre tank — follow label', phi: 'Check label' }),
      t('cultural', 'Do not keep seed from infected plants.'),
    ],
    prevention: ['Clean certified seed.', 'Rotate crops for two seasons.', 'Burn or bury residues.'],
  },

  // ---------- TOMATO ----------
  {
    id: 'tomato_early_blight', subject: 'tomato', name: 'Early blight', cause: 'Fungus (Alternaria solani)', kind: 'fungal',
    signs: { target_rings: 3, yellow_around: 2, stem_lesion: 1 }, urgency: 'watch3',
    spreads: 'Spores from soil and old leaves splash up in rain.',
    explain: 'Starts on the lower, older leaves and moves up. Fruits get sunburnt when leaves fall.',
    treatments: [
      t('cultural', 'Pick off affected lower leaves and bury or burn them.'),
      t('chemical', 'Spray mancozeb every 7–10 days in wet weather.', { product: 'mancozeb', dose: '≈3 level tablespoons (40–50 g) per 20-litre tank — follow label', phi: 'Usually 7 days; check label' }),
    ],
    prevention: ['Stake and prune for airflow.', 'Mulch so soil does not splash.', 'Rotate — no tomato, potato or eggplant on the plot for 2 seasons.'],
  },
  {
    id: 'tomato_late_blight', subject: 'tomato', name: 'Late blight', cause: 'Water mould (Phytophthora infestans)', kind: 'fungal',
    signs: { water_patches: 3, white_mould: 3, fruit_rot_brown: 3, stem_lesion: 2 }, urgency: 'act24',
    spreads: 'Very fast in cool, wet weather — a field can be lost in a week.',
    explain: 'The most destructive tomato disease. Act immediately to protect the healthy plants.',
    treatments: [
      t('chemical', 'Spray a metalaxyl + mancozeb fungicide immediately, then follow with mancozeb as on the label.', { product: 'metalaxyl', dose: '≈50 g per 20-litre tank — follow label', phi: 'Usually 7–14 days; check label' }),
      t('cultural', 'Remove and destroy badly affected plants. Do not compost them.'),
    ],
    prevention: ['Spray protectively during cold rainy spells.', 'Do not plant near potatoes.', 'Water at the base, not on leaves.'],
  },
  {
    id: 'tomato_bacterial_wilt', subject: 'tomato', name: 'Bacterial wilt', cause: 'Bacteria (Ralstonia) in soil', kind: 'bacterial',
    signs: { sudden_wilt: 3 }, urgency: 'act24',
    spreads: 'Soil, water and tools.',
    explain: 'The plant wilts while still green. Test: put a cut stem in clear water — white milky threads flowing out confirm it. No cure.',
    treatments: [
      t('cultural', 'Uproot wilted plants with the soil around roots and destroy them.'),
      t('cultural', 'Do not plant tomato, potato, eggplant or pepper there for 3+ seasons.'),
    ],
    prevention: ['Rotate with maize or beans.', 'Use raised beds and good drainage.', 'Grafted seedlings where available.'],
  },
  {
    id: 'tomato_ber', subject: 'tomato', name: 'Blossom end rot', cause: 'Calcium shortage from uneven watering', kind: 'deficiency',
    signs: { fruit_end_black: 3 }, urgency: 'prevent',
    spreads: 'Not infectious.',
    explain: 'Happens when watering is irregular so the fruit cannot get calcium.',
    treatments: [
      t('cultural', 'Water regularly and mulch to keep soil evenly moist.'),
      t('chemical', 'Apply a calcium foliar feed if available.', { product: 'calcium', dose: 'As on the label' }),
    ],
    prevention: ['Mulch.', 'Regular watering.', 'Add agricultural lime if soil is acidic.'],
  },

  // ---------- POULTRY ----------
  {
    id: 'poultry_newcastle', subject: 'poultry', name: 'Newcastle disease', lg: 'Mawuggwe', cause: 'Virus', kind: 'viral',
    signs: { twisted_neck: 3, gasping: 2, green_diarrhoea: 3, sudden_deaths: 3, egg_drop: 2, ruffled: 1 }, urgency: 'act24',
    spreads: 'Very fast through sick birds, people, egg trays, crates and visitors.',
    explain: 'Newcastle has no cure but you can save the birds that are still healthy. It is a controlled disease — inform your district veterinary officer.',
    treatments: [
      t('vet', 'Call a vet or the district veterinary officer today.'),
      t('cultural', 'Separate sick birds immediately. Burn or bury dead birds deep — do not sell or eat them.'),
      t('vet', 'Vaccinate healthy birds that are not yet sick (vet will advise: I-2 or LaSota eye/water drops).'),
      t('cultural', 'Stop visitors; disinfect feet, crates and egg trays.'),
    ],
    prevention: ['Vaccinate every 3 months.', 'Quarantine new birds for 2 weeks.', 'Keep wild birds away from feed and water.'],
    notifiable: true, vetRequired: true,
  },
  {
    id: 'poultry_gumboro', subject: 'poultry', name: 'Gumboro (IBD)', cause: 'Virus', kind: 'viral',
    signs: { white_diarrhoea: 3, ruffled: 2, young_3_6wk: 3, sudden_deaths: 2 }, urgency: 'act24',
    spreads: 'Droppings, litter and equipment; virus survives long in the house.',
    explain: 'Gumboro attacks young birds\' immune system. There is no cure, but good care reduces deaths.',
    treatments: [
      t('vet', 'Call a vet to confirm.'),
      t('cultural', 'Give clean water with electrolytes/vitamins; keep birds warm and comfortable.'),
      t('cultural', 'Remove dead birds and change wet litter.'),
    ],
    prevention: ['Vaccinate chicks (usually day 10–14 and repeat as the vet advises).', 'Clean and rest the house 2 weeks between batches.'],
    vetRequired: true,
  },
  {
    id: 'poultry_cocci', subject: 'poultry', name: 'Coccidiosis', cause: 'Parasite (Eimeria) in wet litter', kind: 'parasite',
    signs: { bloody_droppings: 3, ruffled: 2, pale_comb: 2, young_3_6wk: 1 }, urgency: 'act24',
    spreads: 'Wet, dirty litter and droppings.',
    explain: 'Common in chicks kept on wet litter. Treatable if caught early.',
    treatments: [
      t('vet', 'Give an anticoccidial in drinking water (e.g. amprolium) for the days on the label.', { product: 'amprolium', dose: 'As on the label, usually for 5–7 days', phi: 'Check egg/meat withdrawal on label' }),
      t('cultural', 'Replace wet litter, fix leaking drinkers, give vitamins after treatment.'),
    ],
    prevention: ['Keep litter dry.', 'Do not overcrowd.', 'Use coccidiostat feed for chicks.'],
  },

  // ---------- CATTLE ----------
  {
    id: 'cattle_ecf', subject: 'cattle', name: 'East Coast fever', cause: 'Parasite (Theileria) spread by brown ear ticks', kind: 'parasite',
    signs: { swollen_nodes: 3, high_fever: 3, breathing: 2, ticks: 2, eye_discharge: 1 }, urgency: 'act24',
    spreads: 'Ticks.',
    explain: 'ECF kills many calves and exotic cattle. Early treatment by a vet saves most animals.',
    treatments: [
      t('vet', 'Call a vet today for treatment (buparvaquone injection is given by a vet).'),
      t('cultural', 'Spray or dip all animals with an acaricide as on the label.', { product: 'acaricide', dose: 'As on the label' }),
    ],
    prevention: ['Regular tick control (spray/dip every 1–2 weeks in wet season).', 'ECF vaccination (ITM) through a vet.'],
    vetRequired: true,
  },
  {
    id: 'cattle_lsd', subject: 'cattle', name: 'Lumpy skin disease', cause: 'Virus spread by biting insects', kind: 'viral',
    signs: { skin_lumps: 3, high_fever: 2, milk_drop: 2, eye_discharge: 1, swollen_nodes: 1 }, urgency: 'act24',
    spreads: 'Biting flies and mosquitoes, moving animals.',
    explain: 'A controlled disease. Report it to your district veterinary officer.',
    treatments: [
      t('vet', 'Call your district veterinary officer. A vet may give treatment for secondary infections.'),
      t('cultural', 'Separate sick animals and control flies.'),
    ],
    prevention: ['Vaccinate the herd.', 'Control biting insects.', 'Do not buy animals from affected areas.'],
    notifiable: true, vetRequired: true,
  },
  {
    id: 'cattle_fmd', subject: 'cattle', name: 'Foot-and-mouth disease', cause: 'Virus', kind: 'viral',
    signs: { mouth_blisters: 3, lameness: 3, high_fever: 2, milk_drop: 2 }, urgency: 'act24',
    spreads: 'Very contagious through animals, people, vehicles and products.',
    explain: 'A notifiable disease. Quarantines may apply. Report it right away — do not sell or move animals.',
    treatments: [
      t('vet', 'Report to the district veterinary officer today.'),
      t('cultural', 'Keep animals on your farm; soft feed and clean water; wash sores with mild salt water.'),
    ],
    prevention: ['Vaccination campaigns.', 'Quarantine new animals.', 'Respect movement bans.'],
    notifiable: true, vetRequired: true,
  },

  // ---------- PIGS ----------
  {
    id: 'pigs_asf', subject: 'pigs', name: 'African swine fever', cause: 'Virus', kind: 'viral',
    signs: { high_fever: 2, red_skin: 3, sudden_deaths: 3, bloody_diarrhoea: 2, huddling: 2 }, urgency: 'act24',
    spreads: 'Sick pigs, pork, swill, people, vehicles and ticks.',
    explain: 'ASF has no cure and no vaccine and kills most pigs it infects. Report it and protect neighbours\' pigs.',
    treatments: [
      t('vet', 'Report to the district veterinary officer immediately.'),
      t('cultural', 'Do not sell, move or slaughter pigs. Bury dead pigs deep with lime.'),
      t('cultural', 'Stop all visitors; disinfect boots and equipment.'),
    ],
    prevention: ['Never feed swill containing pork.', 'Fence pigs; no free-range.', 'Buy pigs only from known healthy farms.'],
    notifiable: true, vetRequired: true,
  },

  // ---------- GOATS ----------
  {
    id: 'goats_ppr', subject: 'goats', name: 'Peste des petits ruminants (PPR)', cause: 'Virus', kind: 'viral',
    signs: { high_fever: 2, diarrhoea: 2, eye_discharge: 3, mouth_sores: 3, cough: 2 }, urgency: 'act24',
    spreads: 'Close contact between goats and sheep.',
    explain: 'PPR ("goat plague") spreads fast and can kill many goats. It is controlled — inform the district vet.',
    treatments: [
      t('vet', 'Call the district veterinary officer.'),
      t('cultural', 'Isolate sick animals, give clean water and soft feed.'),
    ],
    prevention: ['Vaccinate (one dose gives long protection).', 'Quarantine new animals.'],
    notifiable: true, vetRequired: true,
  },
  {
    id: 'goats_worms', subject: 'goats', name: 'Worms', cause: 'Internal parasites', kind: 'parasite',
    signs: { pale_eyelids: 3, diarrhoea: 2 }, urgency: 'watch3',
    spreads: 'Grazing on contaminated pasture.',
    explain: 'Pale eyelids mean blood loss from worms such as barber\'s pole worm.',
    treatments: [
      t('chemical', 'Deworm with a registered dewormer at the dose for the goat\'s weight.', { product: 'dewormer', dose: 'By body weight — follow the label', phi: 'Check meat/milk withdrawal on label' }),
    ],
    prevention: ['Rotate grazing.', 'Deworm every 3 months or as the vet advises.'],
  },
];

export const conditionById = (id: string) => CONDITIONS.find((c) => c.id === id);

export const URGENCY_LABEL: Record<Urgency, string> = {
  act24: 'Act within 24 hours',
  watch3: 'Treat now and watch for 3 days',
  prevent: 'Prevention only',
};
