// julyTimelineData.js
// Static, source-backed timeline of the July 2024 movement in Bangladesh.
// Deliberately multi-region: Dhaka, Rangpur, Chattogram, Sylhet, Narsingdi,
// Savar, Mymensingh, Narayanganj, Rajshahi, Bogura, Tangail, national events.
//
// Notes for whoever maintains this file:
// - Casualty figures below are drawn from public reporting (Prothom Alo, The Daily
//   Star, Netra News, Amnesty International, Fortify Rights, OHCHR). Verified
//   totals for the whole movement vary by source (govt MOHFW ~1,000+, OHCHR ~1,400+,
//   Students Against Discrimination ~1,581). Where a per-day or per-location number
//   is cited here it should stay attributed to its source in `source`; do not
//   present a single number as an uncontested final count in the UI copy.
// - Keep entries factual/descriptive. Avoid adjectives that editorialize beyond
//   what the cited source says.
// - `region` powers the region filter pills. `tag` powers the category filter.

export const REGIONS = [
  { id: "all", en: "All regions", bn: "সব অঞ্চল" },
  { id: "dhaka", en: "Dhaka", bn: "ঢাকা" },
  { id: "rangpur", en: "Rangpur", bn: "রংপুর" },
  { id: "chattogram", en: "Chattogram", bn: "চট্টগ্রাম" },
  { id: "sylhet", en: "Sylhet", bn: "সিলেট" },
  { id: "narayanganj", en: "Narayanganj", bn: "নারায়ণগঞ্জ" },
  { id: "rajshahi", en: "Rajshahi", bn: "রাজশাহী" },
  { id: "mymensingh", en: "Mymensingh", bn: "ময়মনসিংহ" },
  { id: "other", en: "Other districts", bn: "অন্যান্য জেলা" },
  { id: "national", en: "Nationwide", bn: "সারাদেশ" },
];

export const TAGS = [
  { id: "protest", en: "Protest", bn: "বিক্ষোভ" },
  { id: "crackdown", en: "Crackdown", bn: "দমন" },
  { id: "death", en: "Reported deaths", bn: "মৃত্যুর খবর" },
  { id: "shutdown", en: "Communications shutdown", bn: "যোগাযোগ বিচ্ছিন্ন" },
  { id: "political", en: "Political response", bn: "রাজনৈতিক প্রতিক্রিয়া" },
  { id: "international", en: "International reaction", bn: "আন্তর্জাতিক প্রতিক্রিয়া" },
  { id: "turning-point", en: "Turning point", bn: "মোড় ঘোরানো মুহূর্ত" },
];

export const timelineEvents = [
  {
    id: "jul01",
    date: "July 1",
    year: 2024,
    region: "national",
    tags: ["protest"],
    title: "Students resume the quota-reform sit-ins",
    titleBn: "কোটা সংস্কার আন্দোলন পুনরায় শুরু",
    location: "Dhaka University and other public universities",
    locationBn: "ঢাকা বিশ্ববিদ্যালয় ও অন্যান্য পাবলিক বিশ্ববিদ্যালয়",
    summary:
      "Weeks after the High Court reinstated the 2018 quota system, students under the banner Students Against Discrimination restart peaceful sit-ins demanding a merit-based recruitment system. Public university teachers separately begin a strike over pension reform, shutting down classes nationwide.",
    summaryBn:
      "হাইকোর্ট ২০১৮ সালের কোটা ব্যবস্থা পুনর্বহাল করার কয়েক সপ্তাহ পর, ‘বৈষম্যবিরোধী ছাত্র আন্দোলন’ ব্যানারে শিক্ষার্থীরা মেধাভিত্তিক নিয়োগের দাবিতে শান্তিপূর্ণ অবস্থান কর্মসূচি পুনরায় শুরু করে। একই সময়ে পাবলিক বিশ্ববিদ্যালয়ের শিক্ষকরা পেনশন সংস্কারের প্রতিবাদে ধর্মঘট শুরু করলে সারাদেশে ক্লাস বন্ধ হয়ে যায়।",
    source: "Wikipedia — Timeline of 2024 Bangladesh quota reform movement; The Daily Star",
  },
  {
    id: "jul07",
    date: "July 7",
    year: 2024,
    region: "national",
    tags: ["protest"],
    title: "\"Bangla Blockade\" shuts down major roads",
    titleBn: "‘বাংলা ব্লকেড’ কর্মসূচিতে প্রধান সড়ক অবরুদ্ধ",
    location: "Dhaka, Chattogram, Rajshahi, Khulna and other cities",
    locationBn: "ঢাকা, চট্টগ্রাম, রাজশাহী, খুলনাসহ বিভিন্ন শহর",
    summary:
      "Students launch the nationwide \"Bangla Blockade,\" occupying key highways and intersections for hours. The protest expands from campuses onto public roads for the first time, disrupting traffic in several divisional cities simultaneously.",
    summaryBn:
      "শিক্ষার্থীরা সারাদেশে ‘বাংলা ব্লকেড’ কর্মসূচি শুরু করে, ঘণ্টার পর ঘণ্টা গুরুত্বপূর্ণ মহাসড়ক ও মোড় অবরোধ করে রাখে। আন্দোলন প্রথমবারের মতো ক্যাম্পাস ছাড়িয়ে সড়কে ছড়িয়ে পড়ে এবং একইসাথে একাধিক বিভাগীয় শহরে যান চলাচল ব্যাহত হয়।",
    source: "Wikipedia — 2024 Bangladesh quota reform movement",
  },
  {
    id: "jul10",
    date: "July 10",
    year: 2024,
    region: "national",
    tags: ["political"],
    title: "Appellate Division declines to stay the quota verdict",
    titleBn: "আপিল বিভাগ রায় স্থগিত করেনি",
    location: "Supreme Court, Dhaka",
    locationBn: "সুপ্রিম কোর্ট, ঢাকা",
    summary:
      "The Appellate Division does not stay the High Court order that had invalidated the government's 2018 circular cancelling the quota system, leaving the reinstated quotas in place and prolonging uncertainty for protesters.",
    summaryBn:
      "আপিল বিভাগ হাইকোর্টের সেই রায় স্থগিত করেনি যা ২০১৮ সালের কোটা বাতিলের সরকারি প্রজ্ঞাপনকে অবৈধ ঘোষণা করেছিল। ফলে পুনর্বহাল কোটা বহাল থাকে এবং আন্দোলনকারীদের অনিশ্চয়তা দীর্ঘায়িত হয়।",
    source: "Prothom Alo — Quota movement timeline",
  },
  {
    id: "jul14",
    date: "July 14",
    year: 2024,
    region: "dhaka",
    tags: ["turning-point"],
    title: "\"Razakar\" remark inflames the movement",
    titleBn: "‘রাজাকার’ মন্তব্য আন্দোলনে নতুন মাত্রা যোগ করে",
    location: "Dhaka",
    locationBn: "ঢাকা",
    summary:
      "At a press briefing, remarks from the ruling party linking quota protesters to \"Razakars\" — collaborators from the 1971 Liberation War — spread quickly on social media. Students respond overnight with chants reclaiming the term, sharply escalating tensions before dawn marches the next day.",
    summaryBn:
      "এক সংবাদ সম্মেলনে ক্ষমতাসীন দলের পক্ষ থেকে কোটা আন্দোলনকারীদের ‘রাজাকার’ (১৯৭১ সালের মুক্তিযুদ্ধের দোসর) এর সাথে তুলনা করে দেওয়া মন্তব্য সামাজিক যোগাযোগমাধ্যমে দ্রুত ছড়িয়ে পড়ে। শিক্ষার্থীরা রাতারাতি এই শব্দকে প্রতিবাদী স্লোগানে রূপান্তরিত করে, যা পরদিন ভোরের মিছিলের আগেই উত্তেজনা তীব্র করে তোলে।",
    source: "Prothom Alo — Quota movement timeline",
  },
  {
    id: "jul15-dhaka",
    date: "July 15",
    year: 2024,
    region: "dhaka",
    tags: ["crackdown", "turning-point"],
    title: "Armed attack on peaceful sit-in at Dhaka University",
    titleBn: "ঢাকা বিশ্ববিদ্যালয়ে শান্তিপূর্ণ অবস্থানে সশস্ত্র হামলা",
    location: "Dhaka University campus",
    locationBn: "ঢাকা বিশ্ববিদ্যালয় ক্যাম্পাস",
    summary:
      "Students holding placards on campus are attacked by groups armed with rods, sticks and, according to witnesses, firearms — widely reported to be linked to the ruling party's student wing. Within hours, similar attacks are reported on protesters in other cities, marking the shift from student demonstration to violent confrontation.",
    summaryBn:
      "ক্যাম্পাসে প্ল্যাকার্ড হাতে অবস্থানরত শিক্ষার্থীদের ওপর রড, লাঠি এবং সাক্ষীদের ভাষ্যমতে অস্ত্রধারী দলের হামলা হয়, যাদের ক্ষমতাসীন দলের ছাত্র সংগঠনের সাথে সম্পৃক্ত বলে ব্যাপকভাবে জানানো হয়। কয়েক ঘণ্টার মধ্যেই অন্যান্য শহরেও একই ধরনের হামলার খবর আসে, যা ছাত্র বিক্ষোভ থেকে সহিংস সংঘর্ষে রূপান্তরের সূচনা করে।",
    source: "Amnesty International; Fortify Rights",
  },
  {
    id: "jul16-rangpur",
    date: "July 16",
    year: 2024,
    region: "rangpur",
    tags: ["death", "turning-point"],
    title: "Abu Sayed killed by police gunfire in Rangpur",
    titleBn: "রংপুরে পুলিশের গুলিতে আবু সাঈদের মৃত্যু",
    location: "Begum Rokeya University, Rangpur",
    locationBn: "বেগম রোকেয়া বিশ্ববিদ্যালয়, রংপুর",
    summary:
      "Police fire tear gas and charge protesters outside Begum Rokeya University. Protest coordinator Abu Sayed stands with arms spread facing police lines and is shot dead. Footage of his killing spreads nationwide within hours and becomes a defining image of the crackdown, hardening public opinion against the government response.",
    summaryBn:
      "বেগম রোকেয়া বিশ্ববিদ্যালয়ের সামনে পুলিশ টিয়ারশেল ছোঁড়ে এবং বিক্ষোভকারীদের ওপর লাঠিচার্জ করে। আন্দোলনের অন্যতম সমন্বয়ক আবু সাঈদ হাত প্রসারিত করে পুলিশের মুখোমুখি দাঁড়ালে তাকে গুলি করে হত্যা করা হয়। কয়েক ঘণ্টার মধ্যে তার মৃত্যুর ভিডিও সারাদেশে ছড়িয়ে পড়ে এবং সরকারি দমননীতির বিরুদ্ধে জনমত কঠোর করার একটি প্রতীকী মুহূর্তে পরিণত হয়।",
    source: "Al Jazeera / Amnesty International — \"What is happening at the quota-reform protests\"",
  },
  {
    id: "jul16-national",
    date: "July 16",
    year: 2024,
    region: "national",
    tags: ["death", "crackdown"],
    title: "Six killed as violence spreads to multiple districts",
    titleBn: "একাধিক জেলায় সহিংসতা ছড়িয়ে ছয়জনের মৃত্যু",
    location: "Dhaka, Rangpur, and other districts",
    locationBn: "ঢাকা, রংপুর ও অন্যান্য জেলা",
    summary:
      "Beyond Rangpur, ruling-party-linked activists and police clash with protesters in several districts on the same day; six deaths are reported nationwide. The ruling party's student-wing president states publicly that \"movements will come and go\" but the organisation will remain.",
    summaryBn:
      "রংপুরের বাইরেও একই দিনে ক্ষমতাসীন দলের সাথে সংশ্লিষ্ট কর্মী ও পুলিশের সাথে বিক্ষোভকারীদের সংঘর্ষ হয় বিভিন্ন জেলায়; সারাদেশে ছয়জনের মৃত্যুর খবর পাওয়া যায়। ক্ষমতাসীন দলের ছাত্র সংগঠনের সভাপতি প্রকাশ্যে বলেন, ‘আন্দোলন আসবে যাবে’ কিন্তু সংগঠনটি টিকে থাকবে।",
    source: "Prothom Alo — Quota movement timeline",
  },
  {
    id: "jul17",
    date: "July 17",
    year: 2024,
    region: "national",
    tags: ["protest", "shutdown"],
    title: "Universities shut down, funeral prayers held in absentia",
    titleBn: "বিশ্ববিদ্যালয় বন্ধ, গায়েবানা জানাজা অনুষ্ঠিত",
    location: "Campuses nationwide",
    locationBn: "সারাদেশের ক্যাম্পাস",
    summary:
      "Following the deaths of the previous two days, universities and colleges across the country announce indefinite closures and student halls are ordered vacated. Protesters organise \"gayebana janaza\" (funeral prayers in absentia) and symbolic coffin processions for those killed.",
    summaryBn:
      "আগের দুই দিনের মৃত্যুর ঘটনার পর সারাদেশে বিশ্ববিদ্যালয় ও কলেজ অনির্দিষ্টকালের জন্য বন্ধ ঘোষণা করা হয় এবং হল ছাড়ার নির্দেশ দেওয়া হয়। আন্দোলনকারীরা নিহতদের স্মরণে গায়েবানা জানাজা ও প্রতীকী খাটিয়া মিছিলের আয়োজন করে।",
    source: "Prothom Alo — Quota movement timeline",
  },
  {
    id: "jul18-national",
    date: "July 18",
    year: 2024,
    region: "national",
    tags: ["death", "crackdown", "shutdown"],
    title: "Death toll passes 32 as protests intensify nationwide",
    titleBn: "সারাদেশে বিক্ষোভ তীব্র হওয়ায় মৃত্যু ৩২ ছাড়ায়",
    location: "Dhaka, Chattogram, Narayanganj, and other cities",
    locationBn: "ঢাকা, চট্টগ্রাম, নারায়ণগঞ্জসহ বিভিন্ন শহর",
    summary:
      "Reported deaths since July 16 reach at least 32 as clashes continue in multiple cities. Authorities begin restricting mobile internet in parts of the country. Coordinators reject a government offer of talks, citing the mounting toll.",
    summaryBn:
      "১৬ জুলাই থেকে সংঘটিত সহিংসতায় মৃত্যুর সংখ্যা অন্তত ৩২-এ পৌঁছায় এবং একাধিক শহরে সংঘর্ষ অব্যাহত থাকে। কর্তৃপক্ষ দেশের কিছু অংশে মোবাইল ইন্টারনেট সীমিত করতে শুরু করে। ক্রমবর্ধমান মৃত্যুর সংখ্যার কারণ দেখিয়ে সমন্বয়করা সরকারের আলোচনার প্রস্তাব প্রত্যাখ্যান করে।",
    source: "Amnesty International; Wikipedia — Timeline of 2024 Bangladesh quota reform movement",
  },
  {
    id: "jul19-dhaka",
    date: "July 19",
    year: 2024,
    region: "dhaka",
    tags: ["death", "crackdown", "turning-point"],
    title: "Deadliest single day: clashes at Jatrabari and the Dhaka–Chattogram highway",
    titleBn: "সবচেয়ে রক্তক্ষয়ী দিন: যাত্রাবাড়ী ও ঢাকা-চট্টগ্রাম মহাসড়কে সংঘর্ষ",
    location: "Jatrabari, Wari, and the Dhaka–Chattogram highway (N1)",
    locationBn: "যাত্রাবাড়ী, ওয়ারী ও ঢাকা-চট্টগ্রাম মহাসড়ক (এন১)",
    summary:
      "The single deadliest day of the movement: security forces move to clear protesters blocking the Dhaka–Chattogram highway, a critical economic corridor. Rights investigators later trace dozens of fatal shootings in the Jatrabari and adjoining Narayanganj areas over the following days. Nationally reported deaths for the day reach into the dozens.",
    summaryBn:
      "আন্দোলনের সবচেয়ে রক্তক্ষয়ী দিন এটি: নিরাপত্তা বাহিনী ঢাকা-চট্টগ্রাম মহাসড়ক, যা দেশের একটি গুরুত্বপূর্ণ অর্থনৈতিক করিডোর, অবরোধমুক্ত করতে অভিযান চালায়। পরবর্তীতে মানবাধিকার তদন্তকারীরা যাত্রাবাড়ী ও সংলগ্ন নারায়ণগঞ্জ এলাকায় পরবর্তী কয়েকদিনে বহু প্রাণঘাতী গুলিবর্ষণের ঘটনা চিহ্নিত করেন। এই দিনে সারাদেশে নিহতের সংখ্যা কয়েক ডজনে পৌঁছায়।",
    source: "Netra News — \"Counting the Monsoon Massacre\"; OHCHR fact-finding report",
  },
  {
    id: "jul19-sylhet",
    date: "July 19",
    year: 2024,
    region: "sylhet",
    tags: ["death"],
    title: "Journalist ATM Turab killed in Bandarbazar clash",
    titleBn: "বন্দরবাজার সংঘর্ষে সাংবাদিক এটিএম তুরাব নিহত",
    location: "Bandarbazar, Sylhet",
    locationBn: "বন্দরবাজার, সিলেট",
    summary:
      "Journalist ATM Turab of Naya Diganta is killed after being struck by shotgun pellets while covering a clash between protesters and law enforcement in Sylhet's Bandarbazar area, part of a wider pattern of journalists and bystanders being harmed while covering the unrest.",
    summaryBn:
      "নয়া দিগন্ত পত্রিকার সাংবাদিক এটিএম তুরাব সিলেটের বন্দরবাজার এলাকায় বিক্ষোভকারী ও আইনশৃঙ্খলা বাহিনীর সংঘর্ষ কভার করার সময় শটগানের ছররা গুলিতে নিহত হন, যা সহিংসতার সময় সাংবাদিক ও পথচারীদের ক্ষতিগ্রস্ত হওয়ার বৃহত্তর ধারারই অংশ।",
    source: "The Daily Star — \"July 19, 2024: Country descends into deeper crisis\"",
  },
  {
    id: "jul19-narsingdi",
    date: "July 19",
    year: 2024,
    region: "other",
    tags: ["death"],
    title: "Confrontation near Madhabdi municipal office, Narsingdi",
    titleBn: "নরসিংদীর মাধবদী পৌর ভবনের কাছে সংঘর্ষ",
    location: "Madhabdi, Narsingdi",
    locationBn: "মাধবদী, নরসিংদী",
    summary:
      "At least two protesters are killed and dozens injured in a confrontation near the Madhabdi municipal office, one of several district-level flashpoints reported the same day alongside Bogura, Mymensingh and Savar.",
    summaryBn:
      "মাধবদী পৌর ভবনের কাছে সংঘর্ষে অন্তত দুইজন বিক্ষোভকারী নিহত এবং কয়েক ডজন আহত হন। একই দিনে বগুড়া, ময়মনসিংহ ও সাভারসহ বিভিন্ন জেলায় এই ধরনের একাধিক উত্তপ্ত ঘটনা রিপোর্ট হয়।",
    source: "The Daily Star — \"July 19, 2024: Country descends into deeper crisis\"",
  },
  {
    id: "jul19-savar",
    date: "July 19",
    year: 2024,
    region: "other",
    tags: ["death"],
    title: "Student Al Amin killed in Savar",
    titleBn: "সাভারে শিক্ষার্থী আল আমিনের মৃত্যু",
    location: "Radio Colony, Savar",
    locationBn: "রেডিও কলোনি, সাভার",
    summary:
      "Al Amin, a 24-year-old student of Bangladesh Open University, is killed during a clash in Savar's Radio Colony area, one of the industrial-belt districts around Dhaka that saw sustained clashes through the following week.",
    summaryBn:
      "বাংলাদেশ উন্মুক্ত বিশ্ববিদ্যালয়ের ২৪ বছর বয়সী শিক্ষার্থী আল আমিন সাভারের রেডিও কলোনি এলাকায় সংঘর্ষে নিহত হন। ঢাকার আশপাশের শিল্পাঞ্চল জেলাগুলোর মধ্যে সাভার পরবর্তী সপ্তাহজুড়ে দীর্ঘস্থায়ী সংঘর্ষের সাক্ষী হয়।",
    source: "The Daily Star — \"July 19, 2024: Country descends into deeper crisis\"",
  },
  {
    id: "jul19-mymensingh",
    date: "July 19",
    year: 2024,
    region: "mymensingh",
    tags: ["death"],
    title: "Seventeen-year-old Sagor killed in Mymensingh",
    titleBn: "ময়মনসিংহে ১৭ বছর বয়সী সাগরের মৃত্যু",
    location: "Mymensingh town",
    locationBn: "ময়মনসিংহ শহর",
    summary:
      "Seventeen-year-old Sagor is killed during clashes between ruling-party activists and protesters in Mymensingh, one of several minors reported among the dead in different districts around this date.",
    summaryBn:
      "ময়মনসিংহে ক্ষমতাসীন দলের কর্মী ও বিক্ষোভকারীদের সংঘর্ষে ১৭ বছর বয়সী সাগর নিহত হয়। এই সময়ের আশেপাশে বিভিন্ন জেলায় নিহতদের মধ্যে বেশ কয়েকজন কিশোরের কথা জানা যায়।",
    source: "The Daily Star — \"July 19, 2024: Country descends into deeper crisis\"",
  },
  {
    id: "jul19-narayanganj",
    date: "July 19",
    year: 2024,
    region: "narayanganj",
    tags: ["crackdown"],
    title: "District PBI office and police vehicles set ablaze",
    titleBn: "জেলা পিবিআই কার্যালয় ও পুলিশের যানবাহনে অগ্নিসংযোগ",
    location: "Narayanganj town and Jalkuri",
    locationBn: "নারায়ণগঞ্জ শহর ও জালকুড়ি",
    summary:
      "Narayanganj's PBI office, five police vehicles, and fire-service trucks are burned amid escalating unrest. In Jalkuri, at least 26 buses linked to a local ruling-party lawmaker are torched and the municipal building (Nagar Bhaban) is vandalised.",
    summaryBn:
      "ক্রমবর্ধমান অস্থিরতার মধ্যে নারায়ণগঞ্জের পিবিআই কার্যালয়, পাঁচটি পুলিশ যানবাহন এবং ফায়ার সার্ভিসের গাড়ি পুড়িয়ে দেওয়া হয়। জালকুড়িতে স্থানীয় ক্ষমতাসীন দলের এমপির সাথে সংশ্লিষ্ট অন্তত ২৬টি বাস পুড়িয়ে দেওয়া হয় এবং নগর ভবনে ভাঙচুর চালানো হয়।",
    source: "The Daily Star — \"July 19, 2024: Country descends into deeper crisis\"",
  },
  {
    id: "jul19-shutdown",
    date: "July 19",
    year: 2024,
    region: "national",
    tags: ["shutdown", "turning-point"],
    title: "Nationwide internet blackout begins",
    titleBn: "সারাদেশে ইন্টারনেট বন্ধ শুরু",
    location: "Nationwide",
    locationBn: "সারাদেশ",
    summary:
      "The government imposes a nationwide communications blackout, cutting mobile and broadband internet across the country. Television channels go off-air in parts of the country and international communication with Bangladesh largely breaks down for several days, leaving families and the outside world unable to confirm what was happening on the ground.",
    summaryBn:
      "সরকার সারাদেশে যোগাযোগ ব্যবস্থা বন্ধ ঘোষণা করে, মোবাইল ও ব্রডব্যান্ড ইন্টারনেট সংযোগ বিচ্ছিন্ন করে দেয়। দেশের কিছু অংশে টেলিভিশন চ্যানেল সম্প্রচার বন্ধ হয়ে যায় এবং কয়েকদিনের জন্য বাংলাদেশের সাথে আন্তর্জাতিক যোগাযোগ প্রায় সম্পূর্ণ বিচ্ছিন্ন হয়ে পড়ে, ফলে পরিবার ও বহির্বিশ্ব মাটিতে প্রকৃতপক্ষে কী ঘটছে তা নিশ্চিত করতে পারেনি।",
    source: "Al Jazeera / Amnesty International",
  },
  {
    id: "jul21",
    date: "July 21",
    year: 2024,
    region: "national",
    tags: ["political", "crackdown"],
    title: "Supreme Court scales back quotas; curfew already in force",
    titleBn: "সুপ্রিম কোর্ট কোটা কমায়; ততক্ষণে কারফিউ জারি",
    location: "Nationwide",
    locationBn: "সারাদেশ",
    summary:
      "The Appellate Division rules to cut quotas to roughly 7% of posts, a key demand of the protest movement, but the decision comes after days of lethal crackdowns under a curfew already in force, with the reported death toll continuing to climb.",
    summaryBn:
      "আপিল বিভাগ কোটা কমিয়ে প্রায় ৭ শতাংশে নামিয়ে আনার রায় দেয়, যা আন্দোলনের অন্যতম মূল দাবি ছিল। তবে এই সিদ্ধান্ত আসে জারিকৃত কারফিউয়ের মধ্যে কয়েকদিনের প্রাণঘাতী দমনাভিযানের পর, এবং রিপোর্ট হওয়া মৃত্যুর সংখ্যা তখনও ঊর্ধ্বমুখী ছিল।",
    source: "The Daily Star — Timeline of student protests",
  },
  {
    id: "jul22",
    date: "July 22",
    year: 2024,
    region: "narayanganj",
    tags: ["death", "crackdown"],
    title: "Clearing operations continue along the highway corridor",
    titleBn: "মহাসড়ক করিডোরে অভিযান অব্যাহত",
    location: "Jatrabari and Narayanganj's Chittagong Road area",
    locationBn: "যাত্রাবাড়ী ও নারায়ণগঞ্জের চট্টগ্রাম রোড এলাকা",
    summary:
      "Senior police officials visit Jatrabari after what internal accounts describe as a completed clearing operation. Rights investigators later document that most fatal shootings in adjacent Narayanganj neighbourhoods during this stretch occurred in areas directly bordering the highway.",
    summaryBn:
      "অভ্যন্তরীণ সূত্রে ‘সফল’ আখ্যায়িত এক ক্লিয়ারিং অপারেশনের পর ঊর্ধ্বতন পুলিশ কর্মকর্তারা যাত্রাবাড়ী পরিদর্শন করেন। মানবাধিকার তদন্তকারীরা পরে নথিভুক্ত করেন যে এই সময়ে সংলগ্ন নারায়ণগঞ্জ এলাকায় সংঘটিত অধিকাংশ প্রাণঘাতী গুলিবর্ষণ মহাসড়ক-সংলগ্ন এলাকাতেই ঘটেছিল।",
    source: "Netra News — \"Counting the Monsoon Massacre\"",
  },
  {
    id: "jul23",
    date: "July 23",
    year: 2024,
    region: "national",
    tags: ["shutdown", "crackdown"],
    title: "Broadband partially restored, arrests of coordinators continue",
    titleBn: "আংশিক ব্রডব্যান্ড চালু, সমন্বয়কদের গ্রেপ্তার অব্যাহত",
    location: "Nationwide",
    locationBn: "সারাদেশ",
    summary:
      "Broadband internet returns in selected areas while mobile data remains restricted. Detective Branch police detain several protest coordinators, including from Dhaka, in what rights groups describe as enforced or coercive circumstances.",
    summaryBn:
      "কিছু এলাকায় ব্রডব্যান্ড ইন্টারনেট চালু হয়, তবে মোবাইল ডেটা তখনও সীমিত থাকে। গোয়েন্দা শাখা পুলিশ ঢাকাসহ বিভিন্ন স্থান থেকে একাধিক আন্দোলন সমন্বয়ককে আটক করে, যা মানবাধিকার সংগঠনগুলো জোরপূর্বক বা চাপ প্রয়োগমূলক পরিস্থিতি হিসেবে বর্ণনা করে।",
    source: "The Daily Star — Timeline of student protests",
  },
  {
    id: "jul24",
    date: "July 24",
    year: 2024,
    region: "national",
    tags: ["political", "international"],
    title: "Death toll cited at 146; foreign missions raise concern",
    titleBn: "মৃতের সংখ্যা ১৪৬ বলে উল্লেখ; বিদেশি মিশনগুলোর উদ্বেগ",
    location: "Nationwide",
    locationBn: "সারাদেশ",
    summary:
      "Reported cumulative deaths reach 146 as six more people injured in earlier clashes die of their wounds. The heads of the three armed services meet with Prime Minister Sheikh Hasina as the United Nations, European Union and United Kingdom publicly voice concern over the violence.",
    summaryBn:
      "আগের সংঘর্ষে আহত আরও ছয়জনের মৃত্যুর পর সারাদেশে সঞ্চিত মৃতের সংখ্যা ১৪৬-এ পৌঁছায়। জাতিসংঘ, ইউরোপীয় ইউনিয়ন ও যুক্তরাজ্য প্রকাশ্যে সহিংসতা নিয়ে উদ্বেগ প্রকাশ করার মধ্যে তিন বাহিনীর প্রধানরা প্রধানমন্ত্রী শেখ হাসিনার সাথে সাক্ষাৎ করেন।",
    source: "The Daily Star — Timeline of student protests",
  },
  {
    id: "jul25",
    date: "July 25",
    year: 2024,
    region: "national",
    tags: ["political", "crackdown"],
    title: "Warnings to opposition parties as arrests continue",
    titleBn: "বিরোধী দলগুলোকে সতর্কবার্তা, গ্রেপ্তার অব্যাহত",
    location: "Nationwide",
    locationBn: "সারাদেশ",
    summary:
      "Sheikh Hasina warns the BNP and Jamaat-e-Islami of consequences, accusing opposition parties of exploiting the unrest. Arrests of opposition figures and demonstrators continue under the curfew already in place.",
    summaryBn:
      "শেখ হাসিনা বিএনপি ও জামায়াতে ইসলামীকে পরিণতির ব্যাপারে সতর্ক করেন এবং বিরোধী দলগুলোর বিরুদ্ধে অস্থিরতাকে কাজে লাগানোর অভিযোগ আনেন। ততক্ষণে জারি থাকা কারফিউয়ের মধ্যে বিরোধী দলীয় ব্যক্তি ও বিক্ষোভকারীদের গ্রেপ্তার অব্যাহত থাকে।",
    source: "The Daily Star — Timeline of student protests",
  },
  {
    id: "jul27",
    date: "July 27",
    year: 2024,
    region: "national",
    tags: ["political"],
    title: "Government issues a quota-reform circular; organisers reject it",
    titleBn: "সরকার কোটা সংস্কার প্রজ্ঞাপন জারি করে; সমন্বয়করা প্রত্যাখ্যান করে",
    location: "Dhaka",
    locationBn: "ঢাকা",
    summary:
      "The government issues an official circular reforming the quota system in line with the Appellate Division's ruling. Four quota-reform organisers publicly reject the move, citing the scale of the crackdown and demanding accountability before any settlement.",
    summaryBn:
      "আপিল বিভাগের রায় অনুযায়ী কোটা ব্যবস্থা সংস্কার করে সরকার একটি আনুষ্ঠানিক প্রজ্ঞাপন জারি করে। আন্দোলনের চারজন সমন্বয়ক প্রকাশ্যে এই পদক্ষেপ প্রত্যাখ্যান করেন এবং দমননীতির মাত্রা তুলে ধরে যেকোনো সমঝোতার আগে জবাবদিহিতার দাবি জানান।",
    source: "The Daily Star — Timeline of student protests",
  },
  {
    id: "jul29",
    date: "July 29",
    year: 2024,
    region: "dhaka",
    tags: ["protest"],
    title: "Teachers hold the \"Anti-Repression Rally\" at Dhaka University",
    titleBn: "ঢাকা বিশ্ববিদ্যালয়ে শিক্ষকদের ‘দমন-বিরোধী সমাবেশ’",
    location: "Aparajeyo Bangla, Dhaka University",
    locationBn: "অপরাজেয় বাংলা, ঢাকা বিশ্ববিদ্যালয়",
    summary:
      "University professors nationwide, under the banner \"Anti-Repression Teachers Rally,\" gather at Dhaka University's Aparajeyo Bangla monument. The rally opens with a moment of silence for students killed in what the teachers call the \"July massacre,\" and calls for the release of detained students.",
    summaryBn:
      "সারাদেশের বিশ্ববিদ্যালয় শিক্ষকরা ‘দমন-বিরোধী শিক্ষক সমাবেশ’ ব্যানারে ঢাকা বিশ্ববিদ্যালয়ের অপরাজেয় বাংলা চত্বরে সমবেত হন। সমাবেশ শুরু হয় শিক্ষকদের ভাষায় ‘জুলাই গণহত্যা’-য় নিহত শিক্ষার্থীদের স্মরণে এক মিনিট নীরবতা পালনের মধ্য দিয়ে, এবং আটক শিক্ষার্থীদের মুক্তির দাবি জানানো হয়।",
    source: "Wikipedia — Timeline of 2024 Bangladesh quota reform movement",
  },
  {
    id: "jul30",
    date: "July 30",
    year: 2024,
    region: "national",
    tags: ["political"],
    title: "Government declares a day of nationwide mourning",
    titleBn: "সরকার সারাদেশে শোক দিবস ঘোষণা করে",
    location: "Nationwide",
    locationBn: "সারাদেশ",
    summary:
      "Following a cabinet meeting chaired by the Prime Minister, the government declares July 30 a day of nationwide mourning for those killed during the unrest. The move draws a mixed public reaction, with many on social media adopting red profile images instead of the officially encouraged black, saying they would mourn once accountability was delivered.",
    summaryBn:
      "প্রধানমন্ত্রীর সভাপতিত্বে অনুষ্ঠিত এক মন্ত্রিসভা বৈঠকের পর সরকার আন্দোলনে নিহতদের স্মরণে ৩০ জুলাই সারাদেশে শোক দিবস ঘোষণা করে। এই পদক্ষেপে মিশ্র প্রতিক্রিয়া দেখা যায়; সামাজিক যোগাযোগমাধ্যমে সরকার নির্ধারিত কালোর পরিবর্তে অনেকেই লাল রঙের প্রোফাইল ছবি ব্যবহার করেন, বলেন যে জবাবদিহিতা নিশ্চিত হলেই তারা শোক পালন করবেন।",
    source: "Wikipedia — Timeline of Student–People's uprising",
  },
  {
    id: "aug04",
    date: "August 4",
    year: 2024,
    region: "national",
    tags: ["crackdown", "death", "turning-point"],
    title: "Non-cooperation movement begins amid renewed lethal clashes",
    titleBn: "নতুন করে প্রাণঘাতী সংঘর্ষের মধ্যে অসহযোগ আন্দোলন শুরু",
    location: "Nationwide",
    locationBn: "সারাদেশ",
    summary:
      "With the quota issue effectively resolved but the death toll continuing to rise, the Students Against Discrimination platform calls for a nationwide \"non-cooperation movement,\" formally shifting the demand from quota reform toward the resignation of the government.",
    summaryBn:
      "কোটা ইস্যু কার্যত সমাধান হলেও মৃতের সংখ্যা ক্রমাগত বাড়তে থাকায়, ‘বৈষম্যবিরোধী ছাত্র আন্দোলন’ প্ল্যাটফর্ম সারাদেশে ‘অসহযোগ আন্দোলনে’র ডাক দেয়, আনুষ্ঠানিকভাবে দাবি কোটা সংস্কার থেকে সরকারের পদত্যাগের দিকে সরিয়ে নেয়।",
    source: "Wikipedia — July Uprising",
  },
  {
    id: "aug05-dhaka",
    date: "August 5",
    year: 2024,
    region: "dhaka",
    tags: ["death", "turning-point"],
    title: "Long March to Dhaka; Sheikh Hasina resigns and leaves the country",
    titleBn: "ঢাকা অভিমুখে ‘লং মার্চ’; শেখ হাসিনার পদত্যাগ ও দেশত্যাগ",
    location: "Chankharpul and central Dhaka",
    locationBn: "চানখারপুল ও কেন্দ্রীয় ঢাকা",
    summary:
      "Hundreds of thousands join a \"Long March to Dhaka.\" Fatal clashes are reported at Chankharpul among other central Dhaka locations even as the march converges on the capital. Later that day, Sheikh Hasina resigns as Prime Minister and leaves the country, ending 15 years in power and closing the uprising's most intense phase.",
    summaryBn:
      "লক্ষ লক্ষ মানুষ ‘ঢাকা অভিমুখে লং মার্চ’-এ অংশ নেন। মিছিল রাজধানীর কেন্দ্রে পৌঁছানোর সময়েও চানখারপুলসহ কেন্দ্রীয় ঢাকার কয়েকটি স্থানে প্রাণঘাতী সংঘর্ষের খবর পাওয়া যায়। ওইদিনই পরে শেখ হাসিনা প্রধানমন্ত্রীর পদ থেকে পদত্যাগ করে দেশ ত্যাগ করেন, যা তার ১৫ বছরের ক্ষমতার অবসান ঘটায় এবং অভ্যুত্থানের সবচেয়ে তীব্র পর্বের সমাপ্তি টানে।",
    source: "Wikipedia — Chankharpul massacre; July Uprising",
  },
];

// Sorted chronologically by an explicit index rather than string date parsing,
// since the array above is already authored in order. Exported separately in
// case a consumer needs a stable sort key.
export const timelineOrder = timelineEvents.map((e) => e.id);