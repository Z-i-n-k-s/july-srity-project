import archivePhoto from "../assets/archive/archive-01.avif";
import archiveVideo from "../assets/archive/archive-02.jpg";
import archiveStory from "../assets/archive/archive-03.jpg";
import archiveDocument from "../assets/archive/archive-04.jpg";

import archive01 from "../assets/featuredArchive/archive-01.jpg";
import archive02 from "../assets/featuredArchive/archive-02.jpg";
import archive03 from "../assets/featuredArchive/archive-03.jpg";
import archive04 from "../assets/featuredArchive/archive-04.jpg";
import archive05 from "../assets/featuredArchive/archive-05.jpg";
import archive06 from "../assets/featuredArchive/archive-06.jpg";

import stories01 from "../assets/stories/abu.webp";
import stories02 from "../assets/stories/mugdho.jpg";
import stories03 from "../assets/stories/wasim.jpg";
import stories04 from "../assets/stories/priyo.webp";

/*
 * These filenames must match the real files inside:
 * src/assets/voices/
 */
import salmanImg from "../assets/voices/salman.jpg";
import siamImg from "../assets/voices/siam.jpg";
import rafsanImg from "../assets/voices/rafsan.jpg";
import arunaImg from "../assets/voices/aurna.jpg";
import aloAshbeiImg from "../assets/voices/alo.jpg";

import chakma from "../assets/aynaghor/chakma.jpg";
import ayman from "../assets/aynaghor/ayman.jpg";
import azim from "../assets/aynaghor/azim.jpg";


import {
  Archive,
  Camera,
  CheckCircle2,
  FileCheck2,
  FileText,
  HeartHandshake,
  History,
  Image as ImageIcon,
  LockKeyhole,
  MessageSquareText,
  Search,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";

export const navigationItems = [
  {
    label: "Home",
    labelBn: "হোম",
    to: "/home",
  },
  {
    label: "Archive",
    labelBn: "আর্কাইভ",
    to: "/archive",
  },
  {
    label: "Timeline",
    labelBn: "টাইমলাইন",
    to: "/timeline",
  },
  {
    label: "Hero Stories",
    labelBn: "বীরদের গল্প",
    to: "/stories",
  },
  {
    label: "Aynaghor",
    labelBn: "আয়নাঘর",
    to: "/aynaghor",
  },
  {
    label: "Voices of July",
    labelBn: "জুলাইয়ের কণ্ঠস্বর",
    to: "/voices",
  },
  {
    label: "Support",
    labelBn: "সহায়তা",
    to: "/support",
  },
  {
    label: "Missing Persons",
    labelBn: "নিখোঁজ ব্যক্তি",
    to: "/missing-persons",
  },
  {
    label: "About",
    labelBn: "আমাদের সম্পর্কে",
    to: "/about",
  },
];

export const heroSlides = [
  {
    id: "hero-1",
    image: "/images/hero/july-protest-01.svg",
    alt:
      "An archival illustration representing a public gathering at Shahbag",
    location: "Dhaka, July 2024",
    source: "Community archive",
  },
  {
    id: "hero-2",
    image: "/images/hero/july-protest-02.svg",
    alt:
      "An archival illustration representing students gathered on a university campus",
    location: "University campus",
    source: "Verified contributor",
  },
  {
    id: "hero-3",
    image: "/images/hero/july-protest-03.svg",
    alt:
      "An archival illustration representing a candlelight remembrance",
    location: "Dhaka",
    source: "Memorial record",
  },
  {
    id: "hero-4",
    image: "/images/hero/july-protest-04.svg",
    alt:
      "An archival illustration representing saved messages and documentary records",
    location: "Bangladesh",
    source: "Digital archive",
  },
];

export const trustSignals = [
  {
    label: "Community submitted",
    icon: Users,
  },
  {
    label: "Admin verified",
    icon: ShieldCheck,
  },
  {
    label: "Consent-based publishing",
    icon: FileCheck2,
  },
  {
    label: "Sensitive data protected",
    icon: LockKeyhole,
  },
];

export const archiveCategories = [
  {
    id: "photos",
    name: "Photographs",
    description:
      "Verified visual records with dates, places and source context.",
    count: "640 records",
    image: archivePhoto,
    icon: Camera,
    size: "large",
    accent: "amber",
  },
  {
    id: "videos",
    name: "Videos",
    description:
      "Documentary footage preserved with review notes.",
    count: "184 records",
    image: archiveVideo,
    icon: Video,
    size: "small",
    accent: "teal",
  },
  {
    id: "stories",
    name: "Stories and testimonies",
    description:
      "First-hand accounts published with consent and privacy choices.",
    count: "380 stories",
    image: archiveStory,
    icon: MessageSquareText,
    size: "medium",
    accent: "rose",
  },
  {
    id: "documents",
    name: "Historical documents",
    description:
      "Notices, messages, newspapers and source materials.",
    count: "216 records",
    image: archiveDocument,
    icon: FileText,
    size: "wide",
    accent: "amber",
  },
];

export const featuredArchive = [
  {
    id: "arc-001",
    type: "Photograph",
    verified: true,
    title: "Students gathering at Shahbag",
    date: "16 July 2024",
    location: "Shahbag, Dhaka",
    description:
      "A verified set of photographs documenting a student gathering, preserved with contributor notes and approximate time metadata.",
    contributor: "Anonymous contributor",
    image: archive01,
    tags: ["Crowd", "Shahbag"],
  },
  {
    id: "arc-002",
    type: "Testimony",
    verified: true,
    title: "A family’s account from Mirpur",
    date: "19 July 2024",
    location: "Mirpur, Dhaka",
    description:
      "A consent-based family testimony describing communication difficulties and community support during the period.",
    contributor: "Identity protected",
    image: archive02,
    tags: ["Family", "Testimony"],
  },
  {
    id: "arc-003",
    type: "Document",
    verified: true,
    title: "Messages during the internet blackout",
    date: "18–23 July 2024",
    location: "Multiple locations",
    description:
      "Screenshots and written records presented with source context. Personal identifiers have been removed.",
    contributor: "Multiple contributors",
    image: archive03,
    tags: ["Digital", "Messages"],
  },
  {
    id: "arc-004",
    type: "Photograph",
    verified: true,
    title: "Photographs from university campuses",
    date: "July 2024",
    location: "Dhaka",
    description:
      "A curated collection of campus photographs, reviewed for dates, locations and publication consent.",
    contributor: "Community archive",
    image: archive04,
    tags: ["Campus", "Students"],
  },
  {
    id: "arc-005",
    type: "Story",
    verified: true,
    title: "Medical volunteers during the crisis",
    date: "20 July 2024",
    location: "Dhaka",
    description:
      "Accounts of volunteers organising first aid and safe transport, published without sensitive medical information.",
    contributor: "Verified volunteers",
    image: archive05,
    tags: ["Volunteers", "Support"],
  },
  {
    id: "arc-006",
    type: "Timeline",
    verified: true,
    title: "A timeline of the final days of July",
    date: "28–31 July 2024",
    location: "Bangladesh",
    description:
      "A chronological preview assembled from reviewed records. Each event links back to its source material.",
    contributor: "July Smriti editorial team",
    image: archive06,
    tags: ["Timeline", "Events"],
  },
];

export const timelineEvents = [
  {
    id: "tl-1",
    date: "01 July",
    year: "2024",
    title: "Public demonstrations expand",
    location: "Dhaka",
    summary:
      "Student gatherings and public discussions grow across multiple campuses.",
    mediaCount: 42,
    verified: true,
  },
  {
    id: "tl-2",
    date: "16 July",
    year: "2024",
    title: "A day preserved through many witnesses",
    location: "Dhaka and other cities",
    summary:
      "Photographs, testimonies and public records document a major turning point.",
    mediaCount: 128,
    verified: true,
  },
  {
    id: "tl-3",
    date: "18 July",
    year: "2024",
    title: "Communication becomes difficult",
    location: "Nationwide",
    summary:
      "Contributors preserve messages and offline notes during severe internet disruption.",
    mediaCount: 76,
    verified: true,
  },
  {
    id: "tl-4",
    date: "24 July",
    year: "2024",
    title: "Families search for reliable information",
    location: "Multiple locations",
    summary:
      "Community networks exchange updates while verification remains essential.",
    mediaCount: 61,
    verified: true,
  },
  {
    id: "tl-5",
    date: "31 July",
    year: "2024",
    title: "Memories continue to be collected",
    location: "Bangladesh",
    summary:
      "Documentation and testimony preservation continue beyond the immediate events.",
    mediaCount: 94,
    verified: true,
  },
];

export const julyMovementSummary = {
  label: "The July Uprising in brief",

  title:
    "From public-service quota reform to a nationwide demand for accountability",

  intro:
    "The immediate 2024 movement began after a court decision restored quotas in government recruitment, including BCS and other public-service posts. Students organised around a merit-based reform demand. The movement widened after confrontations, deaths, mass arrests, internet shutdowns and public anger over the state response.",

  closing:
    "On 5 August 2024, Sheikh Hasina resigned and left Bangladesh for India. In the days that followed, several people held for years in secret detention returned, bringing renewed attention to enforced disappearances and the detention system publicly known as Aynaghor. Many families, however, continued to wait for answers.",

  stages: [
    {
      date: "5 June 2024",
      title: "Quota dispute returns",
      text:
        "A High Court decision restored the freedom-fighter descendants' quota in public employment. Students renewed demands for a fair, merit-focused recruitment system.",
    },
    {
      date: "1–14 July",
      title:
        "Campus protest becomes a national conversation",
      text:
        "Blockades, marches and class boycotts spread. A remark by Sheikh Hasina contrasting descendants of freedom fighters with descendants of collaborators was understood by protesters as branding them 'Razakar', intensifying anger.",
    },
    {
      date: "15–19 July",
      title:
        "Violence, deaths and communication blackout",
      text:
        "Clashes and a severe crackdown followed. Abu Sayed's death on 16 July became a defining image of the movement. Internet access was heavily restricted as deaths, injuries and arrests mounted.",
    },
    {
      date: "21 July–2 August",
      title:
        "Quota ruling changes, demands expand",
      text:
        "The Supreme Court sharply reduced the quota share, but the movement had moved beyond recruitment reform. Students and families demanded justice, accountability and the release of detainees.",
    },
    {
      date: "3–5 August",
      title:
        "One-point demand and fall of the government",
      text:
        "The movement announced a one-point demand for the prime minister's resignation. On 5 August, Sheikh Hasina resigned and left the country as crowds gathered across Dhaka and other cities.",
    },
    {
      date: "After 5 August",
      title:
        "Aynaghor survivors return; unanswered cases remain",
      text:
        "The return of long-disappeared detainees exposed a hidden chapter of state repression to a much wider public. Their survival brought relief, but families of many missing people still sought truth and accountability.",
    },
  ],

  sources: [
    {
      name:
        "Reuters — quota protests, 15 July 2024",
      url:
        "https://www.reuters.com/world/asia-pacific/bangladesh-students-clash-job-quota-protests-least-100-injured-2024-07-15/",
    },
    {
      name:
        "VOA — timeline to 5 August 2024",
      url:
        "https://www.voanews.com/a/timeline-of-events-leading-to-the-resignation-of-bangladesh-prime-minister-sheikh-hasina/7731456.html",
    },
    {
      name:
        "Amnesty International — quota-reform protests",
      url:
        "https://www.amnesty.org/en/latest/news/2024/07/what-is-happening-at-the-quota-reform-protests-in-bangladesh/",
    },
  ],
};

export const aynaghorOverview = {
  label: "A hidden chapter",

  title: "What is Aynaghor?",

  meaning:
    "Aynaghor literally means 'House of Mirrors'. The name became associated with secret detention cells described by survivors, families and investigative reporting.",

  description:
    "Public reports have alleged that detainees were held incommunicado in facilities linked to security or intelligence agencies, without families knowing where they were. After the change of government in August 2024, Michael Chakma, Abdullahil Amaan Azmi and Mir Ahmad Bin Quasem returned after years of disappearance. Their return did not resolve the many other cases that remained unaccounted for.",

  editorialNote:
    "This section uses public reporting, survivor accounts and family testimony. It avoids graphic descriptions, does not treat an allegation as a court finding, and marks unresolved stories clearly.",
};

export const heroStories = [
  {
    id: "story-abu-sayed",
    collection: "heroes",
    name: "Abu Sayed",

    title:
      "A student whose courage became a national turning point",

    summary:
      "An English student and protest coordinator at Begum Rokeya University, Abu Sayed was killed in Rangpur on 16 July 2024. Images of his final moments became a defining symbol of the uprising.",

    body:
      "Abu Sayed studied in the English Department at Begum Rokeya University, Rangpur, and was active in the Anti-Discrimination Student Movement. On 16 July, he stood in an open area facing police during the protest. His death caused nationwide outrage and strengthened calls for justice, accountability and an end to violence against students.",

    legacy:
      "His courage remains one of the most recognisable memories of July.",

    date: "16 July 2024",
    location: "Rangpur",
    category: "Student organiser",
    image: stories01,
    imageAlt: "Abu Sayed",
    featured: true,
    sourceName: "Amnesty International",

    sourceUrl:
      "https://www.amnesty.org/en/latest/news/2024/07/what-is-happening-at-the-quota-reform-protests-in-bangladesh/",
  },
  {
    id: "story-mir-mugdho",
    collection: "heroes",
    name: "Mir Mahfuzur Rahman Mugdho",

    title:
      "Compassion in the middle of chaos",

    summary:
      "Mir Mugdho was distributing water and food to protesters in Uttara before losing his life on 18 July 2024.",

    body:
      "Remembered for his kindness, Mir Mugdho spent the day helping people by providing drinking water and biscuits. His story became a lasting reminder that courage appeared not only at the front of a march, but also in acts of care for strangers.",

    legacy:
      "Remembered for humanity, service and kindness.",

    date: "18 July 2024",
    location: "Uttara, Dhaka",
    category: "Volunteer",
    image: stories02,
    imageAlt: "Mir Mugdho",
    sourceName: "The Daily Star",

    sourceUrl:
      "https://www.thedailystar.net/news/bangladesh/lives-we-lost/news/promising-life-cut-short-bullet-3668151",
  },
  {
    id: "story-wasim-akram",
    collection: "heroes",
    name: "Wasim Akram",

    title:
      "A young life that inspired Chattogram",

    summary:
      "Wasim Akram, a student of Chattogram College, was killed during the protests on 16 July 2024.",

    body:
      "Wasim Akram participated in the Anti-Discrimination Student Movement. His death deeply affected people in Chattogram and became one of the early losses remembered across the country as the movement expanded.",

    legacy:
      "Remembered among the young lives lost during the July movement.",

    date: "16 July 2024",
    location: "Chattogram",
    category: "Student",
    image: stories03,
    imageAlt: "Wasim Akram",
    sourceName: "The Daily Star",

    sourceUrl:
      "https://www.thedailystar.net/news/bangladesh/news/another-life-lost-bcl-student-clash-ctg-death-toll-now-3-3658366",
  },
  {
    id: "story-tahir-priyo",
    collection: "heroes",
    name: "Tahir Zaman Priyo",

    title:
      "Documenting history until his final moment",

    summary:
      "Journalist and videographer Tahir Zaman Priyo was killed while documenting the protests in Dhaka.",

    body:
      "Priyo continued documenting events despite serious personal risk. His work reflected the importance of preserving evidence during a crisis, and his death highlighted the danger faced by journalists, photographers and witnesses.",

    legacy:
      "Remembered for protecting truth through documentation.",

    date: "19 July 2024",
    location: "Dhaka",
    category: "Journalist",
    image: stories04,
    imageAlt: "Tahir Zaman Priyo",

    sourceName:
      "UNESCO Observatory of Killed Journalists",

    sourceUrl:
      "https://www.unesco.org/en/safety-journalists/observatory/000df36c-b500-4b9d-833a-dad56047348b",
  },
  {
    id: "story-anonymous-volunteer",
    collection: "heroes",
    anonymous: true,

    title: "The unnamed volunteers",

    summary:
      "Many people carried the injured, distributed food and water, shared safe routes and helped strangers without seeking recognition.",

    body:
      "Across Bangladesh, volunteers stepped forward during dangerous and uncertain days. Some arranged transport, some opened homes, some supplied medicine and some preserved evidence. Their identities are intentionally hidden here so remembrance does not compromise privacy or safety.",

    legacy:
      "Their unnamed acts of care remain part of the history of July.",

    date: "July–August 2024",
    location: "Bangladesh",
    category: "Anonymous volunteers",
    image: null,
    imageAlt: "",
  },
];

export const aynaghorStories = [
  {
    id: "aynaghor-michael-chakma",
    collection: "aynaghor",
    status: "Returned",
    name: "Michael Chakma",

    title:
      "Returned after more than five years",

    summary:
      "Indigenous rights activist Michael Chakma disappeared in April 2019 and returned in August 2024 after the fall of the previous government.",

    body:
      "Michael Chakma's whereabouts were unknown to his family and supporters for more than five years. After his release, public reporting described his account of being held in secret detention. His return showed that some long-running disappearance cases could still end with a survivor coming home, while also deepening questions about everyone who had not returned.",

    legacy:
      "A return that gave one family an answer and many other families a renewed reason to keep asking.",

    date: "Returned in early August 2024",
    location: "Bangladesh",
    category: "Aynaghor survivor",

    image: chakma,

    imageAlt:
      "Michael Chakma — replace with a licensed project asset",

    sourceName:
      "Prothom Alo / The Guardian",

    sourceUrl:
      "https://en.prothomalo.com/bangladesh/czennpwfpd",
  },
  {
    id:
      "aynaghor-mir-ahmad-bin-quasem",
    collection: "aynaghor",
    status: "Returned",
    name:
      "Mir Ahmad Bin Quasem (Arman)",

    title:
      "A family saw him return after nearly eight years",

    summary:
      "Lawyer Mir Ahmad Bin Quasem disappeared in August 2016 and returned home shortly after 5 August 2024.",

    body:
      "For nearly eight years, his family did not know where he was. His return became one of the first widely reported releases from secret detention after the change of government. The story is presented here as a record of disappearance, survival and reunion—not as a substitute for an independent investigation.",

    legacy:
      "Years of uncertainty ended with a return, but the public questions remained.",

    date: "Returned in early August 2024",
    location: "Dhaka",
    category: "Returned detainee",

    image: ayman,

    imageAlt:
      "Mir Ahmad Bin Quasem — replace with a licensed project asset",

    sourceName: "Prothom Alo",

    sourceUrl:
      "https://en.prothomalo.com/bangladesh/czennpwfpd",
  },
  {
    id:
      "aynaghor-abdullahil-amaan-azmi",
    collection: "aynaghor",
    status: "Returned",
    name: "Abdullahil Amaan Azmi",

    title:
      "Returned after disappearing in 2016",

    summary:
      "Former military officer Abdullahil Amaan Azmi disappeared in August 2016 and returned in August 2024.",

    body:
      "His family spent years without reliable information about his location or condition. His return alongside other long-disappeared detainees drew national attention to secret confinement and to the need for records, testimony and accountable investigation.",

    legacy:
      "A homecoming that made the hidden detention system harder to ignore.",

    date: "Returned in early August 2024",
    location: "Dhaka",
    category: "Returned detainee",

    image:azim,

    imageAlt:
      "Abdullahil Amaan Azmi — replace with a licensed project asset",

    sourceName:
      "The Guardian / Prothom Alo",

    sourceUrl:
      "https://www.theguardian.com/global-development/article/2024/aug/15/bangladesh-sheikh-hasina-michael-chakma-disappeared",
  },
  {
    id:
      "aynaghor-family-still-waiting",
    collection: "aynaghor",
    status: "Still missing",
    anonymous: true,

    title:
      "A family still waiting for a knock at the door",

    summary:
      "For many families, the August releases brought hope but no personal answer. Their relatives' whereabouts remained unknown.",

    body:
      "This composite, identity-protected account represents families who kept photographs, case papers and memories ready while searching hospitals, police records, prisons and public offices. Some had stayed silent out of fear. After August 2024, they came forward again to ask a basic question: where is our family member? This entry does not combine names or unverified allegations into a single factual case; it preserves the shared reality of waiting.",

    legacy:
      "A disappearance is also a continuing story lived by every person left behind.",

    date: "Unresolved",
    location: "Identity protected",
    category: "Family testimony",
    image: null,
    imageAlt: "",

    sourceName:
      "The Guardian — families of the disappeared",

    sourceUrl:
      "https://www.theguardian.com/global-development/article/2024/aug/15/bangladesh-sheikh-hasina-michael-chakma-disappeared",
  },
  {
    id:
      "aynaghor-records-and-truth",
    collection: "aynaghor",
    status: "Unresolved",
    anonymous: true,

    title:
      "Beyond one cell: the search for records and truth",

    summary:
      "Aynaghor is not only a story about one building. It represents a wider demand to identify detention sites, preserve evidence and account for every missing person.",

    body:
      "Survivor testimony and investigative reporting describe a system in which people could be held outside ordinary legal safeguards. A responsible archive must separate confirmed facts, first-person testimony, reported allegations and unresolved claims. It must also protect families from rumours and avoid declaring someone dead or detained without reliable evidence.",

    legacy:
      "Every unresolved name is a reason to preserve records carefully and continue the search lawfully.",

    date: "Ongoing",
    location: "Bangladesh",
    category: "Archive context",
    image: null,
    imageAlt: "",
  },
];

export const stories = [
  ...heroStories,
  ...aynaghorStories,
];

export const storyCollections = [
  {
    id: "heroes",

    label:
      "Heroes of July",

    labelBn:
      "জুলাইয়ের বীরদের গল্প",

    description:
      "Students, volunteers, journalists and unnamed people whose courage and care shaped the movement.",

    accent: "amber",
    stories: heroStories,
  },
  {
    id: "aynaghor",

    label:
      "Aynaghor, returned and still missing",

    labelBn:
      "আয়নাঘর, ফিরে আসা ও এখনও নিখোঁজ",

    description:
      "Survivors, identity-protected family accounts and the continuing search for truth.",

    accent: "teal",
    stories: aynaghorStories,
  },
];

const voiceEntries = [
  {
    id: "voice-salman-muqtadir",
    group: "solidarity",

    name:
      "Salman Mohammad Muqtadir",

    role:
      "Content creator and actor",

    position:
      "Offered accommodation and practical assistance to protesting and affected students.",

    context:
      "Public reporting and widely shared posts documented his direct offer of help during the quota-reform protests.",

    image: salmanImg,
    imageAlt:
      "Salman Mohammad Muqtadir",

    sourceName:
      "Dhaka Tribune",

    sourceUrl:
      "https://www.dhakatribune.com/showtime/352392/quota-protest-actors-filmmakers-musicians",

    approved: true,
    published: true,
    enabled: true,
  },
  {
    id: "voice-siam-ahmed",
    group: "solidarity",

    name: "Siam Ahmed",

    role: "Actor",

    position:
      "Argued that artistes should use their voices and creative work to oppose injustice.",

    context:
      "His post-uprising interview connected public trust in artists with speaking honestly during injustice.",

    image: siamImg,
    imageAlt: "Siam Ahmed",

    sourceName:
      "The Daily Star",

    sourceUrl:
      "https://www.thedailystar.net/entertainment/tv-film/news/steadfast-siam-valiant-siam-3695331",

    approved: true,
    published: true,
    enabled: true,
  },
  {
    id: "voice-rafsan",
    group: "solidarity",

    name: "Iftekhar Rafsan",

    role:
      "Content creator",

    position:
      "Said campuses should be safe for students and that the violence was unacceptable.",

    context:
      "His public statement was included among celebrity expressions of solidarity with students.",

    image: rafsanImg,
    imageAlt:
      "Iftekhar Rafsan",

    sourceName:
      "Dhaka Tribune",

    sourceUrl:
      "https://www.dhakatribune.com/showtime/352392/quota-protest-actors-filmmakers-musicians",

    approved: true,
    published: true,
    enabled: true,
  },
  {
    id: "voice-aruna-biswas",
    group: "contested",

    name: "Aruna Biswas",

    role:
      "Actor and former Censor Board member",

    position:
      "A leaked group message attributed a 'pour hot water' remark to her. She acknowledged the words but said they referred to people vandalising the hospital area, not student protesters.",

    context:
      "The archive records both the reported remark and her explanation. Inclusion is not a legal finding.",

    image: arunaImg,
    imageAlt: "Aruna Biswas",

    sourceName:
      "The Daily Star",

    sourceUrl:
      "https://www.thedailystar.net/entertainment/tv-film/news/throw-hot-water-protesters-alo-ashbei-artistes-whatsapp-group-under-fire-3693581",

    approved: true,
    published: true,
    enabled: true,
  },
  {
    id: "voice-alo-ashbei",
    group: "contested",

    name:
      "The 'Alo Ashbei' group",

    role:
      "Reported private WhatsApp group of artistes, journalists and political figures",

    position:
      "Leaked screenshots led to criticism over discussions opposing the student-led movement and responses to the unrest.",

    context:
      "Membership alone does not prove that every person shared every remark. A reported participant also said members did not all hold the same views.",

    image: aloAshbeiImg,
    imageAlt:
      "Alo Ashbei group",

    sourceName:
      "The Daily Star",

    sourceUrl:
      "https://www.thedailystar.net/entertainment/tv-film/news/throw-hot-water-protesters-alo-ashbei-artistes-whatsapp-group-under-fire-3693581",

    approved: true,
    published: true,
    enabled: true,
  },
];

export const voices = voiceEntries;
export const publicVoices = voiceEntries;

export const supportBenefits = [
  {
    title:
      "Private communication",

    description:
      "Only the requester and authorised support administrators can access the room.",

    icon: LockKeyhole,
  },
  {
    title:
      "Clear case progress",

    description:
      "Follow review, information requests and support updates in one timeline.",

    icon: History,
  },
  {
    title:
      "Documents in one place",

    description:
      "Share only requested documents through a protected workflow.",

    icon: FileCheck2,
  },
];

export const missingPersons = [
  {
    id: "mp-001",

    name:
      "Demo profile — Rahim A.",

    age: 21,

    lastSeenLocation:
      "Farmgate, Dhaka",

    lastSeenDate:
      "20 July 2024",

    verified: true,

    image:
      "/images/missing/person-01.svg",

    clothing:
      "Dark shirt and backpack",

    description:
      "This is placeholder content for UI demonstration. Replace it with admin-verified public information only.",
  },
  {
    id: "mp-002",

    name:
      "Demo profile — Nusrat J.",

    age: 24,

    lastSeenLocation:
      "Mirpur 10, Dhaka",

    lastSeenDate:
      "21 July 2024",

    verified: true,

    image:
      "/images/missing/person-02.svg",

    clothing:
      "Light-coloured scarf",

    description:
      "This is placeholder content for UI demonstration. Private phone numbers are never shown publicly.",
  },
  {
    id: "mp-003",

    name:
      "Demo profile — S. Hasan",

    age: 19,

    lastSeenLocation:
      "Jatrabari, Dhaka",

    lastSeenDate:
      "19 July 2024",

    verified: true,

    image:
      "/images/missing/person-03.svg",

    clothing:
      "Blue shirt",

    description:
      "This is placeholder content for UI demonstration. Sighting reports remain private until reviewed.",
  },
];

export const verificationSteps = [
  {
    number: "01",
    title: "Submit",

    description:
      "A contributor shares a record, source details, date, place, consent and privacy preference.",

    icon: FileText,
  },
  {
    number: "02",
    title: "Admin review",

    description:
      "An authorised reviewer checks completeness, privacy risks and relevance.",

    icon: Search,
  },
  {
    number: "03",
    title:
      "Source verification",

    description:
      "Dates, locations, source context and supporting records are compared.",

    icon: FileCheck2,
  },
  {
    number: "04",

    title:
      "Consent confirmation",

    description:
      "Publication choices and identity protection are confirmed before release.",

    icon: ShieldCheck,
  },
  {
    number: "05",

    title:
      "Publish or support",

    description:
      "Approved public records are published; private support cases remain protected.",

    icon: CheckCircle2,
  },
];

export const statistics = [
  {
    label:
      "Verified documentary records",

    value: 1240,
    suffix: "+",
    icon: Archive,
  },
  {
    label:
      "Stories preserved",

    value: 380,
    suffix: "+",
    icon: MessageSquareText,
  },
  {
    label:
      "Support cases managed",

    value: 175,
    suffix: "+",
    icon: HeartHandshake,
  },
  {
    label:
      "Missing-person reports reviewed",

    value: 92,
    suffix: "+",
    icon: Search,
  },
];

export const footerLinks = {
  Platform:
    navigationItems.slice(1, 7),

  Contribute: [
    {
      label:
        "Submit Evidence",

      to: "/submit",
    },
    {
      label:
        "Share a Story",

      to:
        "/submit?type=story",
    },
    {
      label:
        "Report a Missing Person",

      to:
        "/missing-persons/report",
    },
    {
      label:
        "Request Support",

      to:
        "/support/new",
    },
  ],

  Information: [
    {
      label:
        "About July Smriti",

      to: "/about",
    },
    {
      label:
        "Verification Policy",

      to:
        "/about#verification",
    },
    {
      label:
        "Privacy Policy",

      to:
        "/about#privacy",
    },
    {
      label:
        "Content Guidelines",

      to:
        "/about#guidelines",
    },
    {
      label:
        "Contact",

      to:
        "/about#contact",
    },
  ],

  Account: [
    {
      label:
        "Sign In",

      to:
        "/login",
    },
    {
      label:
        "Create Account",

      to:
        "/sign-up",
    },
    {
      label:
        "My Submissions",

      to:
        "/account/submissions",
    },
    {
      label:
        "My Support Rooms",

      to:
        "/account/support-rooms",
    },
  ],
};

export const dashboardQuickActions = [
  {
    title:
      "Submit evidence",

    description:
      "Share pictures, written stories, testimony, videos, audio and documents in one protected submission.",

    to: "/submit",
    icon: FileText,
  },
  {
    title:
      "Open support request",

    description:
      "Create a private request and follow its progress.",

    to:
      "/support/new",

    icon:
      HeartHandshake,
  },
  {
    title:
      "Report a missing person",

    description:
      "Send information for administrator verification.",

    to:
      "/missing-persons/report",

    icon: Search,
  },
  {
    title:
      "Browse verified archive",

    description:
      "Explore published records and stories.",

    to:
      "/archive",

    icon:
      ImageIcon,
  },
];