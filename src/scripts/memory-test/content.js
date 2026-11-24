/* BrainoDad Exam Memory Test — test content, copied unchanged from the approved prototype (v4).
   Each level has Form A (before class) and Form B (after class) of equal difficulty.
   Changing anything here changes the test: keep it frozen so weekly results stay comparable. */
export const VERSION = "v4";

export const PAIRS = {
  A: ["Mount Selva", "River Tavi", "Fort Kandar", "Lake Mirun", "Port Arvel", "Valley Zoren"],
  B: ["Mount Orin", "River Pelan", "Fort Dasara", "Lake Vemor", "Port Kelna", "Valley Rusan"],
};

export const LEVELS_CONTENT = {
  ms: { label: "Class 6–8", sub: "School exams and Olympiads", readSec: 60,
    A: { words: ["Rocket","Elephant","Volcano","Magnet","Rainbow","Lantern","Bridge","Tiger","Camera","Crown"],
      seqTitle: "The story of Varna Town", seq: ["Well dug","School built","Market opened","Big flood","Bridge built","Temple painted"],
      passage: { title: "The Mira Fish", text: "The Mira fish lives in warm, shallow lakes. It is bright orange with three black stripes on its tail. A Mira fish eats small water plants and tiny insects found near the shore. In the rainy season, it lays its eggs under floating leaves. The eggs hatch after ten days. Mira fish swim together in groups of about twenty to stay safe from birds.",
        qs: [{ q: "Where does the Mira fish live?", a: "Warm, shallow lakes", o: ["Cold rivers","The deep sea","Mountain streams"] },
             { q: "How many black stripes are on its tail?", a: "Three", o: ["Two","Four","Five"] },
             { q: "Where does it lay its eggs?", a: "Under floating leaves", o: ["In the sand","Between rocks","On tree roots"] },
             { q: "When do the eggs hatch?", a: "After ten days", o: ["After two days","After one month","After twenty days"] },
             { q: "Why do Mira fish swim in groups?", a: "To stay safe from birds", o: ["To find food","To stay warm","To guard their eggs"] }] } },
    B: { words: ["Balloon","Peacock","Island","Battery","Thunder","Candle","Castle","Dolphin","Ladder","Mirror"],
      seqTitle: "The story of Selun Village", seq: ["Pond dug","Library built","Bus service started","Big storm","Hospital opened","Park made"],
      passage: { title: "The Tolu Tree", text: "The Tolu tree grows near the sea. It grows best in sandy soil. Its leaves are wide and shaped like a heart. The tree gives small purple fruits in May. Monkeys and parrots love to eat these sweet fruits. Villagers use the strong wood of the Tolu tree to build boats. A Tolu tree can live for about two hundred years and grow taller than a house.",
        qs: [{ q: "Where does the Tolu tree grow?", a: "Near the sea", o: ["In deserts","On mountains","Near rivers"] },
             { q: "What shape are its leaves?", a: "Like a heart", o: ["Like a star","Round","Like needles"] },
             { q: "In which month does it give fruits?", a: "May", o: ["January","August","December"] },
             { q: "Which animals love its fruits?", a: "Monkeys and parrots", o: ["Goats and crows","Squirrels and bats","Deer and sparrows"] },
             { q: "What do villagers build with its wood?", a: "Boats", o: ["Houses","Bridges","Carts"] }] } } },
  hs: { label: "Class 9–12", sub: "Board exams, JEE and NEET foundation", readSec: 70,
    A: { words: ["Oxygen","Parliament","Equator","Protein","Magnet","Empire","Rocket","Budget","Volcano","Treaty","Telescope","Monsoon"],
      seqTitle: "History of the Varna Kingdom", seq: ["River dam built","Copper coins introduced","First library opened","Port city founded","Great drought","Capital moved inland","Peace treaty signed"],
      passage: { title: "The Kelvar Plant", text: "The Kelvar plant grows in the dry hills of the Ranu region, about 900 metres above sea level. Its leaves look silver because they are covered with tiny hairs that reflect sunlight and reduce water loss. The plant stores water in its thick roots, which can reach 3 metres deep. Kelvar flowers open only at night and are pollinated by moths. Farmers boil the roots to make a blue dye that has been used for over 400 years. The plant is now protected by law because its numbers fell by half after 1990.",
        qs: [{ q: "Why do Kelvar leaves look silver?", a: "Tiny hairs reflect sunlight", o: ["A coat of wax","Silver minerals in the soil","Morning frost"] },
             { q: "Where does the plant store water?", a: "In its thick roots", o: ["In its leaves","In its stem","In its flowers"] },
             { q: "How deep can the roots reach?", a: "3 metres", o: ["1 metre","9 metres","30 centimetres"] },
             { q: "Which animal pollinates the flowers?", a: "Moths", o: ["Bees","Bats","Birds"] },
             { q: "Why is the plant protected by law?", a: "Its numbers fell by half after 1990", o: ["Its dye is very costly","It grows only at night","Farmers stopped growing it"] }] } },
    B: { words: ["Carbon","Assembly","Tropic","Enzyme","Battery","Dynasty","Satellite","Tariff","Glacier","Charter","Microscope","Cyclone"],
      seqTitle: "History of the Selun Republic", seq: ["Railway line opened","Women's college started","Silk trade began","Major earthquake","New constitution written","Space centre built","Olympics hosted"],
      passage: { title: "The Sarun Glacier", text: "The Sarun glacier lies between two peaks in the Tolam mountain range, about 4,000 metres above sea level. It moves slowly, about 40 metres every year. Its ice looks blue because it is very old and has almost no air bubbles. Melting water from Sarun feeds the Veda river, which supplies water to 12 villages and two small towns in the valley below. Scientists from the Tolam Research Centre visit and measure the glacier every April. Since 2001, the glacier has become 200 metres shorter, mainly because summers have become warmer.",
        qs: [{ q: "How far does the glacier move each year?", a: "About 40 metres", o: ["About 4 metres","About 400 metres","About 14 metres"] },
             { q: "Why does the ice look blue?", a: "It has almost no air bubbles", o: ["It has blue minerals","It reflects the sky","Tiny plants grow in it"] },
             { q: "Which river does the glacier feed?", a: "The Veda river", o: ["The Tolam river","The Sarun river","The Rani river"] },
             { q: "In which month do scientists measure it?", a: "April", o: ["January","July","October"] },
             { q: "Why has the glacier become shorter?", a: "Summers have become warmer", o: ["Less snow falls in winter","Villages use its water","An earthquake broke it"] }] } } },
  comp: { label: "Competitive exams", sub: "NEET, JEE, UPSC, TNPSC, SSC, Bank, Railway", readSec: 75,
    A: { words: ["Oxygen","Parliament","Equator","Protein","Census","Volcano","Magnet","Empire","Budget","Neuron","Monsoon","Treaty"],
      seqTitle: "History of the Tarvel Empire", seq: ["Salt tax introduced","Northern fort built","University founded","Famine years","Silk route opened","Silver coins issued","Royal court moved","Trade treaty signed"],
      passage: { title: "The Darsh Wetland", text: "The Darsh wetland covers about 85 square kilometres along the lower Kemi river. It was declared a protected area in 1978, after farmers had drained nearly one-third of it for rice fields. Today it supports over 210 species of birds, including the rare grey-crowned ibis, a tall wading bird which nests only between November and February. The wetland works like a natural sponge: during heavy rains it absorbs floodwater, and in dry months it slowly releases water back into the river. A 2015 survey found that fish catches in nearby villages were 40 percent higher than in similar areas without wetlands. However, plastic waste from nearby towns and two new roads now threaten its northern edge.",
        qs: [{ q: "In which year was the wetland declared a protected area?", a: "1978", o: ["1987","1968","1998"] },
             { q: "How many bird species does it support?", a: "Over 210", o: ["Over 120","Over 21","Over 250"] },
             { q: "When does the grey-crowned ibis nest?", a: "November to February", o: ["June to September","March to May","December to April"] },
             { q: "Which statement is TRUE?", a: "It absorbs floodwater during heavy rains", o: ["Farmers drained half of it for wheat","Fish catches nearby were 40 percent lower","It lies along the upper Kemi river"] },
             { q: "What threatens its northern edge?", a: "Plastic waste and new roads", o: ["Rice farming and fishing","Sand mining","Factories and a dam"] }] } },
    B: { words: ["Carbon","Assembly","Tropic","Enzyme","Survey","Glacier","Battery","Dynasty","Tariff","Hormone","Cyclone","Charter"],
      seqTitle: "History of the Orinda Republic", seq: ["First election held","Steel plant opened","Delta floods","Women got the vote","Railway reached the coast","New currency issued","Border agreement signed","Space programme began"],
      passage: { title: "The Varel Canal", text: "The Varel canal is 142 kilometres long and links the Sona river to the dry eastern plains of the region. Work began in 1956 and was completed in 1964, using the labour of about 30,000 workers from nearby villages. The canal irrigates nearly 2 lakh hectares of farmland, mainly growing cotton and millet. Its water is shared by three districts under an agreement signed in 1971, which gives the largest share to Pirol district. Because the canal bed is not lined with concrete, roughly one-fifth of its water seeps into the ground before reaching the fields. In 2019, solar panels were installed over a 10-kilometre stretch to reduce evaporation and to produce clean electricity.",
        qs: [{ q: "How long is the canal?", a: "142 kilometres", o: ["124 kilometres","241 kilometres","412 kilometres"] },
             { q: "In which year was the canal completed?", a: "1964", o: ["1956","1971","1946"] },
             { q: "Which crops does it mainly water?", a: "Cotton and millet", o: ["Rice and wheat","Sugarcane and maize","Tea and pulses"] },
             { q: "Which statement is TRUE?", a: "About one-fifth of its water seeps into the ground", o: ["Its bed is lined with concrete","Four districts share its water","Solar panels cover the whole canal"] },
             { q: "Which district gets the largest share of water?", a: "Pirol", o: ["Sona","Varel","Kemi"] }] } } },
};

/* time limits in seconds */
export const T = { recallStudy: 40, recallAnswer: 90, seqStudy: 30, seqAnswer: 45, factsStudy: 35, factsAnswer: 45, perQuestion: 20, laterAnswer: 60 };

export const PARTS = [
  { key: "recall", name: "Keyword Recall", pts: 20, exam: "Like remembering the key terms of a chapter", fix: "the Story Method for keywords" },
  { key: "seq", name: "Timeline Order", pts: 15, exam: "Like remembering the order of events or process steps", fix: "the Link Method for sequences" },
  { key: "facts", name: "Facts & Figures", pts: 20, exam: "Like remembering years, article numbers and data", fix: "number mnemonics" },
  { key: "read", name: "Textbook Paragraph", pts: 25, exam: "Like reading a chapter and answering MCQs", fix: "Smart Reading" },
  { key: "later", name: "Exam-Day Recall", pts: 20, exam: "How much of what you study survives until the exam", fix: "retrieval practice and spaced revision" },
];

export const LEVELS = [
  { min: 85, name: "Memory Genius", color: "#ffd76a" },
  { min: 70, name: "Memory Pro", color: "#c9a7ff" },
  { min: 50, name: "Sharp Mind", color: "#7fb2ff" },
  { min: 30, name: "Memory Explorer", color: "#2ec4b6" },
  { min: 0, name: "Memory Starter", color: "#9aa6cc" },
];

export const MSG = {
  "Memory Genius": "Outstanding. You already use your memory like a topper. The methods will make it exam-proof.",
  "Memory Pro": "Strong memory. A few methods will move you into the top group.",
  "Sharp Mind": "Good base. With a system, your study hours will start giving far better results.",
  "Memory Explorer": "Your memory works, but without a system. That is exactly what the class gives you.",
  "Memory Starter": "Every expert starts somewhere. This is your starting point, not a verdict. Watch how fast it changes.",
};

export const levelOf = (s) => LEVELS.find((l) => s >= l.min);

/* School tracks: the student may be under 18. Their phone numbers and names are NEVER sent to Meta. */
export const SCHOOL_TRACKS = ["ms", "hs"];
