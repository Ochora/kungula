// Crops and animals Kungula supports. Emoji are used as icons because they
// render on every Android phone and need no reading to recognise.

export interface CropDef { id: string; name: string; lg: string; sw: string; icon: string; unit: string }
export interface AnimalDef { id: string; name: string; lg: string; sw: string; icon: string }

export const CROPS: CropDef[] = [
  { id: 'coffee', name: 'Coffee', lg: 'Emmwanyi', sw: 'Kahawa', icon: '☕', unit: 'kg (FAQ)' },
  { id: 'banana', name: 'Banana / Matooke', lg: 'Matooke', sw: 'Ndizi', icon: '🍌', unit: 'bunch' },
  { id: 'maize', name: 'Maize', lg: 'Kasooli', sw: 'Mahindi', icon: '🌽', unit: 'kg' },
  { id: 'beans', name: 'Beans', lg: 'Ebijanjaalo', sw: 'Maharagwe', icon: '🫘', unit: 'kg' },
  { id: 'cassava', name: 'Cassava', lg: 'Muwogo', sw: 'Muhogo', icon: '🥔', unit: 'kg' },
  { id: 'tomato', name: 'Tomato', lg: 'Nnyaanya', sw: 'Nyanya', icon: '🍅', unit: 'kg' },
  { id: 'soya', name: 'Soya beans', lg: 'Soya', sw: 'Soya', icon: '🌱', unit: 'kg' },
  { id: 'sesame', name: 'Sesame (simsim)', lg: 'Ntungo', sw: 'Ufuta', icon: '🌾', unit: 'kg' },
  { id: 'groundnuts', name: 'Groundnuts', lg: 'Ebinyeebwa', sw: 'Karanga', icon: '🥜', unit: 'kg' },
  { id: 'rice', name: 'Rice', lg: 'Omuceere', sw: 'Mchele', icon: '🍚', unit: 'kg' },
  { id: 'cabbage', name: 'Cabbage', lg: 'Kabbeeji', sw: 'Kabichi', icon: '🥬', unit: 'head' },
  { id: 'onion', name: 'Onion', lg: 'Obutungulu', sw: 'Kitunguu', icon: '🧅', unit: 'kg' },
];

export const ANIMALS: AnimalDef[] = [
  { id: 'poultry', name: 'Poultry', lg: 'Enkoko', sw: 'Kuku', icon: '🐔' },
  { id: 'cattle', name: 'Cattle', lg: 'Ente', sw: 'Ng’ombe', icon: '🐄' },
  { id: 'goats', name: 'Goats', lg: 'Embuzi', sw: 'Mbuzi', icon: '🐐' },
  { id: 'pigs', name: 'Pigs', lg: 'Embizzi', sw: 'Nguruwe', icon: '🐖' },
  { id: 'fish', name: 'Fish', lg: 'Ebyennyanja', sw: 'Samaki', icon: '🐟' },
  { id: 'sheep', name: 'Sheep', lg: 'Endiga', sw: 'Kondoo', icon: '🐑' },
];

export const DISTRICTS = [
  'Arua', 'Bugiri', 'Bushenyi', 'Gulu', 'Hoima', 'Ibanda', 'Iganga', 'Jinja', 'Kabale', 'Kabarole',
  'Kagadi', 'Kalungu', 'Kampala', 'Kamuli', 'Kapchorwa', 'Kasese', 'Kayunga', 'Kibaale', 'Kiboga',
  'Kiruhura', 'Kisoro', 'Kitgum', 'Kyotera', 'Lira', 'Luweero', 'Lwengo', 'Masaka', 'Masindi',
  'Mbale', 'Mbarara', 'Mityana', 'Mpigi', 'Mubende', 'Mukono', 'Nakaseke', 'Nakasongola', 'Ntungamo',
  'Oyam', 'Pader', 'Rakai', 'Rukungiri', 'Sembabule', 'Sironko', 'Soroti', 'Tororo', 'Wakiso', 'Other',
];

export const cropById = (id: string) => CROPS.find((c) => c.id === id);
export const animalById = (id: string) => ANIMALS.find((a) => a.id === id);
export const subjectById = (id: string) => cropById(id) ?? animalById(id);
export const subjectName = (id: string) => subjectById(id)?.name ?? id;
export const subjectIcon = (id: string) => subjectById(id)?.icon ?? '🌿';
