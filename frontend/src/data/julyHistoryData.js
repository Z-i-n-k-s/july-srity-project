import Abu from "../assets/stories/abu.webp";
import Mugdho from "../assets/stories/mugdho.jpg";
import Priyo from "../assets/stories/priyo.webp";
import Wasim from "../assets/stories/wasim.jpg";

export const julyChapterSources = [
  {
    label: "UN Human Rights fact-finding report",
    url: "https://www.ohchr.org/sites/default/files/documents/countries/bangladesh/ohchr-fftb-hr-violations-bd.pdf",
  },
  {
    label: "Amnesty International — quota protests and internet shutdown",
    url: "https://www.amnesty.org/en/latest/news/2024/07/what-is-happening-at-the-quota-reform-protests-in-bangladesh/",
  },
  {
    label: "Reuters — Muhammad Yunus sworn in, 8 August 2024",
    url: "https://www.reuters.com/world/asia-pacific/bangladesh-nobel-laureate-muhammad-yunus-takes-charge-caretaker-government-2024-08-08/",
  },
  {
    label: "The Daily Star — public statements during the quota protests",
    url: "https://www.thedailystar.net/news/bangladesh/news/quotes-quota-3656936",
  },
  {
    label: "Freedom House — Bangladesh internet restrictions in 2024",
    url: "https://freedomhouse.org/country/bangladesh/freedom-net/2024",
  },
];

export const augustFiveHighlight = {
  id: "august-5",
  eyebrow: "5 August 2024",
  title: "The day the uprising changed the state",
  titleBn: "যে দিনে গণঅভ্যুত্থান রাষ্ট্রের গতিপথ বদলে দেয়",
  description:
    "After weeks of student-led protest, mass mobilisation, deaths, injuries, arrests and communication restrictions, Sheikh Hasina resigned and left Bangladesh on 5 August 2024. Crowds gathered across the country, while students and citizens described the moment with phrases such as ‘Independence 2.0’. The phrase is a popular political and cultural description; Bangladesh's official Independence Day remains 26 March.",
  descriptionBn:
    "শিক্ষার্থী-নেতৃত্বাধীন আন্দোলন, গণসমাবেশ, মৃত্যু, আহত, গ্রেপ্তার ও যোগাযোগ নিষেধাজ্ঞার কয়েক সপ্তাহ পর ৫ আগস্ট ২০২৪ শেখ হাসিনা পদত্যাগ করে বাংলাদেশ ত্যাগ করেন। দেশজুড়ে মানুষ সমবেত হয় এবং অনেকে দিনটিকে ‘স্বাধীনতা ২.০’ নামে বর্ণনা করেন। এটি একটি জনপ্রিয় রাজনৈতিক ও সাংস্কৃতিক অভিব্যক্তি; বাংলাদেশের সরকারি স্বাধীনতা দিবস ২৬ মার্চ।",
  moments: [
    "The one-point demand transformed the movement from quota reform into a national call for political change.",
    "The planned March to Dhaka brought students and citizens toward the capital despite curfew and fear.",
    "The resignation ended Sheikh Hasina's fifteen-year continuous period as prime minister.",
    "Students immediately called for a civilian interim administration and urged people to protect communities and public property.",
  ],
};

export const blackoutChapter = {
  id: "blackout",
  eyebrow: "Communication under pressure",
  title: "The internet blackout days",
  titleBn: "ইন্টারনেট ব্ল্যাকআউটের দিনগুলো",
  description:
    "Mobile and broadband access was cut or heavily restricted during the deadliest period of the protests. Social platforms and messaging services were also blocked. The shutdown made it harder to verify casualties, contact families, locate medical help and document events.",
  descriptionBn:
    "আন্দোলনের সবচেয়ে প্রাণঘাতী সময়ে মোবাইল ও ব্রডব্যান্ড ইন্টারনেট বন্ধ বা কঠোরভাবে সীমিত করা হয়। সামাজিক যোগাযোগমাধ্যম ও বার্তা আদান-প্রদানের সেবাও বন্ধ ছিল। এতে হতাহতের তথ্য যাচাই, পরিবারের সঙ্গে যোগাযোগ, চিকিৎসা সহায়তা খোঁজা এবং ঘটনা নথিভুক্ত করা কঠিন হয়ে পড়ে।",
  facts: [
    "A nationwide internet shutdown began during the escalation around 18 July.",
    "Broadband returned partially after several days, while mobile internet remained unavailable longer.",
    "Facebook, Messenger, WhatsApp, YouTube and other services remained restricted even after some connectivity returned.",
    "A second disruption occurred in early August before services returned after the government fell.",
  ],
};

export const offlineResistance = [
  {
    title: "Human relay networks",
    titleBn: "মানুষ-নির্ভর বার্তা নেটওয়ার্ক",
    text: "Students, families, journalists, doctors and volunteers carried information through phone calls, SMS, in-person couriers and trusted contact chains when normal online communication failed.",
  },
  {
    title: "Offline-capable messaging",
    titleBn: "অফলাইন বার্তা আদান-প্রদান",
    text: "Participants later described using offline-capable messaging tools where available. The archive treats these accounts as testimony and does not claim that one application connected the entire country.",
  },
  {
    title: "Medical and safety coordination",
    titleBn: "চিকিৎসা ও নিরাপত্তা সমন্বয়",
    text: "Local volunteers shared hospital availability, blood needs, safe routes and missing-person information through whatever channels remained usable.",
  },
  {
    title: "Documentation after reconnection",
    titleBn: "সংযোগ ফেরার পর নথিভুক্তকরণ",
    text: "Videos, photographs, lists and eyewitness accounts saved during the blackout were uploaded later, helping families, journalists and rights organisations reconstruct events.",
  },
];

export const securityResponse = [
  {
    name: "Bangladesh Police",
    role: "Primary protest-policing force",
    summary:
      "Amnesty International verified incidents of unlawful force, including lethal and less-lethal weapons, against protesters. The UN fact-finding report later described a broader coordinated policy of violent repression requiring further investigation and accountability.",
  },
  {
    name: "Rapid Action Battalion (RAB)",
    role: "Special security force",
    summary:
      "RAB was among the forces deployed during the crackdown. Public reporting and the UN inquiry documented allegations of arbitrary detention, ill-treatment and participation in repression.",
  },
  {
    name: "Border Guard Bangladesh (BGB)",
    role: "Paramilitary deployment",
    summary:
      "BGB personnel were deployed as protests expanded and curfew measures were imposed. The archive records deployment and reported incidents without attributing individual responsibility without verified evidence.",
  },
  {
    name: "Bangladesh Army",
    role: "Curfew deployment",
    summary:
      "The army was deployed after curfew was announced. Its institutional role changed again on 5 August when the army chief announced that an interim government would be formed.",
  },
  {
    name: "Bangladesh Chhatra League and allied groups",
    role: "Ruling-party student and political networks",
    summary:
      "Students and rights groups reported coordinated attacks by people associated with the then-ruling party and its student wing. These allegations must be attributed to evidence and investigations rather than presented as blanket guilt for every member.",
  },
];

export const formerGovernmentFigures = [
  {
    name: "Sheikh Hasina",
    office: "Prime Minister until 5 August 2024",
    quotation: "‘grandchildren of Razakars’",
    context:
      "Her 14 July response to a quota question was interpreted by students as disparaging their movement and triggered overnight campus protests. Her government later imposed curfew and oversaw the security response before she resigned and left the country.",
  },
  {
    name: "Obaidul Quader",
    office:
      "Road Transport and Bridges Minister; Awami League general secretary",
    quotation:
      "The movement was being turned into an anti-government agitation.",
    context:
      "He publicly framed the protests as being influenced by opposition forces. Student demands later included accountability from senior political figures.",
  },
  {
    name: "Asaduzzaman Khan Kamal",
    office: "Home Minister",
    quotation: "Publicly defended law-and-order measures.",
    context:
      "As home minister, he held political responsibility for the ministry overseeing major law-enforcement agencies during the crackdown. The page presents this institutional role and sourced statements, not an independent judicial finding.",
  },
  {
    name: "Zunaid Ahmed Palak",
    office:
      "State Minister for Posts, Telecommunications and Information Technology",
    quotation: "Initially attributed outages to damaged infrastructure.",
    context:
      "Internet providers and later reporting documented government instructions to restrict connectivity. This section contrasts contemporary official explanations with later evidence and testimony.",
  },
  {
    name: "Hasan Mahmud",
    office: "Foreign Minister",
    quotation: "Called the quota dispute a ‘sub judice’ issue.",
    context:
      "He argued that the court process limited government action while protests were continuing.",
  },
  {
    name: "Mohammad Ali Arafat",
    office: "State Minister for Information and Broadcasting",
    quotation: "Argued that street protest could not change a court order.",
    context:
      "He defended the government's public position and later its response to unrest in media interviews.",
  },
];

export const interimAdvisers = [
  {
    name: "Muhammad Yunus",
    role: "Chief Adviser",
    focus:
      "Led the interim administration sworn in on 8 August 2024.",
  },
  {
    name: "Salehuddin Ahmed",
    role: "Adviser",
    focus: "Economic and financial administration.",
  },
  {
    name: "Asif Nazrul",
    role: "Adviser",
    focus: "Law, justice and parliamentary affairs.",
  },
  {
    name: "Adilur Rahman Khan",
    role: "Adviser",
    focus: "Human rights advocate serving in the advisory council.",
  },
  {
    name: "Touhid Hossain",
    role: "Adviser",
    focus: "Foreign affairs.",
  },
  {
    name: "Syeda Rizwana Hasan",
    role: "Adviser",
    focus: "Environment and institutional reform.",
  },
  {
    name: "Sharmeen Murshid",
    role: "Adviser",
    focus: "Social welfare and related responsibilities.",
  },
  {
    name: "Farida Akhter",
    role: "Adviser",
    focus:
      "Fisheries, livestock and public-interest advocacy.",
  },
  {
    name: "Nurjahan Begum",
    role: "Adviser",
    focus: "Health and family welfare responsibilities.",
  },
  {
    name: "AFM Khalid Hossain",
    role: "Adviser",
    focus: "Religious affairs.",
  },
  {
    name: "Brig Gen (retd) M Sakhawat Hossain",
    role: "Adviser",
    focus: "Initially assigned home-affairs responsibilities.",
  },
  {
    name: "Hassan Ariff",
    role: "Adviser",
    focus: "Local government and related administration.",
  },
  {
    name: "Nahid Islam",
    role: "Student representative and adviser",
    focus:
      "One of the movement coordinators appointed to the interim council.",
  },
  {
    name: "Asif Mahmud Shojib Bhuyain",
    role: "Student representative and adviser",
    focus:
      "Another movement coordinator appointed to the interim council.",
  },
];

export const memorialPeople = [
  {
    name: "Abu Sayed",
    image: Abu,
    imageAlt: "Abu Sayed",
    note:
      "Killed in Rangpur on 16 July; his final moments became a defining image of the uprising.",
  },
  {
    name: "Mir Mugdho",
    image: Mugdho,
    imageAlt: "Mir Mugdho",
    note:
      "A student and volunteer remembered for distributing water before he was killed in Dhaka.",
  },
  {
    name: "Wasim Akram",
    image: Wasim,
    imageAlt: "Wasim Akram",
    note:
      "A student killed during protest violence in Chattogram and remembered by fellow protesters.",
  },
  {
    name: "Tahir Zaman Priyo",
    image: Priyo,
    imageAlt: "Tahir Zaman Priyo",
    note:
      "A photographer and father killed while documenting events in Dhaka.",
  },
  {
    name: "Sheikh Ashhabul Yamin",
    image: null,
    imageAlt: "Sheikh Ashhabul Yamin",
    note:
      "A MIST student whose treatment after being shot was documented in verified video evidence.",
  },
  {
    name: "Riya Gop",
    image: null,
    imageAlt: "Riya Gop",
    note:
      "A child whose death became part of the wider record of children killed or injured during the unrest.",
  },
  {
    name: "Unidentified and under-documented victims",
    image: null,
    imageAlt: "Unidentified and under-documented victims",
    note:
      "The archive reserves space for verified records of people whose names, injuries or circumstances remain incomplete.",
  },
];

export const socialMemoryPosts = [
  {
    label: "Campus slogan",
    text: "Asked for rights, became a Razakar.",
    context:
      "A response to the controversy surrounding the prime minister's 14 July remarks.",
  },
  {
    label: "Emergency appeal",
    text: "Save Bangladesh's students.",
    context:
      "A widely repeated international-facing appeal across social platforms during the crackdown.",
  },
  {
    label: "Red profile campaign",
    text: "Red became a shared sign of mourning, anger and solidarity.",
    context:
      "Users replaced profile images or posted red graphics while platforms and connectivity were restricted.",
  },
  {
    label: "Verification culture",
    text: "Save the original file, date, location and source before reposting.",
    context:
      "A digital-safety practice used by volunteers trying to preserve evidence and reduce misinformation.",
  },
];

export const graffitiStories = [
  {
    title: "52 দেখিনি, 24 দেখেছি",
    translation: "We did not see 1952; we witnessed 2024.",
    theme: "Generational memory",
  },
  {
    title: "আমার ভাইকে মারলি কেন?",
    translation: "Why did you kill my brother?",
    theme: "Grief and accountability",
  },
  {
    title: "Save the country, join the fight",
    translation: "A call for collective participation.",
    theme: "Mobilisation",
  },
  {
    title: "একদিকে নাটক করে, অন্যদিকে গুম করে",
    translation:
      "A critique connecting public performance with disappearance allegations.",
    theme: "Aynaghor and enforced disappearance",
  },
  {
    title: "Abu Sayed with open arms",
    translation:
      "Murals recreated the posture seen before he was shot.",
    theme: "Courage and sacrifice",
  },
  {
    title: "Walls as a public archive",
    translation:
      "After 5 August, students painted flyovers, campuses and neighbourhood walls with names, demands and visions for a new Bangladesh.",
    theme: "Memory and rebuilding",
  },
];