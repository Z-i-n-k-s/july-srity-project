import {
  Archive,
  Camera,
  CheckCircle2,
  Clock3,
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
  { label: "Home", labelBn: "হোম", to: "/home" },
  { label: "Archive", labelBn: "আর্কাইভ", to: "/archive" },
  { label: "Timeline", labelBn: "টাইমলাইন", to: "/timeline" },
  { label: "Stories", labelBn: "গল্প", to: "/stories" },
  { label: "Support", labelBn: "সহায়তা", to: "/support" },
  { label: "Missing Persons", labelBn: "নিখোঁজ ব্যক্তি", to: "/missing-persons" },
  { label: "About", labelBn: "আমাদের সম্পর্কে", to: "/about" },
];

export const heroSlides = [
  { id: "hero-1", image: "/images/hero/july-protest-01.svg", alt: "An archival illustration representing a public gathering at Shahbag", location: "Dhaka, July 2024", source: "Community archive" },
  { id: "hero-2", image: "/images/hero/july-protest-02.svg", alt: "An archival illustration representing students gathered on a university campus", location: "University campus", source: "Verified contributor" },
  { id: "hero-3", image: "/images/hero/july-protest-03.svg", alt: "An archival illustration representing a candlelight remembrance", location: "Dhaka", source: "Memorial record" },
  { id: "hero-4", image: "/images/hero/july-protest-04.svg", alt: "An archival illustration representing saved messages and documentary records", location: "Bangladesh", source: "Digital archive" },
];

export const trustSignals = [
  { label: "Community submitted", icon: Users },
  { label: "Admin verified", icon: ShieldCheck },
  { label: "Consent-based publishing", icon: FileCheck2 },
  { label: "Sensitive data protected", icon: LockKeyhole },
];

export const archiveCategories = [
  { id: "photos", name: "Photographs", description: "Verified visual records with dates, places and source context.", count: "640 records", image: "/images/archive/archive-01.svg", icon: Camera, size: "large", accent: "amber" },
  { id: "videos", name: "Videos", description: "Documentary footage preserved with review notes.", count: "184 records", image: "/images/archive/archive-02.svg", icon: Video, size: "small", accent: "teal" },
  { id: "stories", name: "Stories and testimonies", description: "First-hand accounts published with consent and privacy choices.", count: "380 stories", image: "/images/archive/archive-03.svg", icon: MessageSquareText, size: "medium", accent: "rose" },
  { id: "documents", name: "Historical documents", description: "Notices, messages, newspapers and source materials.", count: "216 records", image: "/images/archive/archive-04.svg", icon: FileText, size: "wide", accent: "amber" },
];

export const featuredArchive = [
  { id: "arc-001", type: "Photograph", verified: true, title: "Students gathering at Shahbag", date: "16 July 2024", location: "Shahbag, Dhaka", description: "A verified set of photographs documenting a student gathering, preserved with contributor notes and approximate time metadata.", contributor: "Anonymous contributor", image: "/images/archive/archive-01.svg", tags: ["Crowd", "Shahbag"] },
  { id: "arc-002", type: "Testimony", verified: true, title: "A family’s account from Mirpur", date: "19 July 2024", location: "Mirpur, Dhaka", description: "A consent-based family testimony describing communication difficulties and community support during the period.", contributor: "Identity protected", image: "/images/stories/story-02.svg", tags: ["Family", "Testimony"] },
  { id: "arc-003", type: "Document", verified: true, title: "Messages during the internet blackout", date: "18–23 July 2024", location: "Multiple locations", description: "Screenshots and written records presented with source context. Personal identifiers have been removed.", contributor: "Multiple contributors", image: "/images/archive/archive-04.svg", tags: ["Digital", "Messages"] },
  { id: "arc-004", type: "Photograph", verified: true, title: "Photographs from university campuses", date: "July 2024", location: "Dhaka", description: "A curated collection of campus photographs, reviewed for dates, locations and publication consent.", contributor: "Community archive", image: "/images/archive/archive-05.svg", tags: ["Campus", "Students"] },
  { id: "arc-005", type: "Story", verified: true, title: "Medical volunteers during the crisis", date: "20 July 2024", location: "Dhaka", description: "Accounts of volunteers organising first aid and safe transport, published without sensitive medical information.", contributor: "Verified volunteers", image: "/images/archive/archive-06.svg", tags: ["Volunteers", "Support"] },
  { id: "arc-006", type: "Timeline", verified: true, title: "A timeline of the final days of July", date: "28–31 July 2024", location: "Bangladesh", description: "A chronological preview assembled from reviewed records. Each event links back to its source material.", contributor: "July Smriti editorial team", image: "/images/archive/archive-02.svg", tags: ["Timeline", "Events"] },
];

export const timelineEvents = [
  { id: "tl-1", date: "01 July", year: "2024", title: "Public demonstrations expand", location: "Dhaka", summary: "Student gatherings and public discussions grow across multiple campuses.", mediaCount: 42, verified: true },
  { id: "tl-2", date: "16 July", year: "2024", title: "A day preserved through many witnesses", location: "Dhaka and other cities", summary: "Photographs, testimonies and public records document a major turning point.", mediaCount: 128, verified: true },
  { id: "tl-3", date: "18 July", year: "2024", title: "Communication becomes difficult", location: "Nationwide", summary: "Contributors preserve messages and offline notes during severe internet disruption.", mediaCount: 76, verified: true },
  { id: "tl-4", date: "24 July", year: "2024", title: "Families search for reliable information", location: "Multiple locations", summary: "Community networks exchange updates while verification remains essential.", mediaCount: 61, verified: true },
  { id: "tl-5", date: "31 July", year: "2024", title: "Memories continue to be collected", location: "Bangladesh", summary: "Documentation and testimony preservation continue beyond the immediate events.", mediaCount: 94, verified: true },
];

export const stories = [
  { id: "story-001", name: "Identity protected", quote: "We kept writing down what we saw because we were afraid the details would disappear.", location: "Dhaka", category: "First-hand testimony", image: "/images/stories/story-01.svg", featured: true, body: "This demonstration story shows how a privacy-protected account can be presented. The full production archive should include only reviewed material with explicit consent." },
  { id: "story-002", name: "A family from Mirpur", quote: "Reliable information mattered as much as immediate help.", location: "Mirpur", category: "Family account", image: "/images/stories/story-02.svg", body: "A demo family account describing the need for verified communication, respectful support and protected contact details." },
  { id: "story-003", name: "Community volunteer", quote: "People organised quietly, one task and one person at a time.", location: "Dhaka", category: "Volunteer memory", image: "/images/stories/story-03.svg", body: "A demo story about community coordination. It avoids identifying private individuals or publishing sensitive claims." },
];

export const supportBenefits = [
  { title: "Private communication", description: "Only the requester and authorised support administrators can access the room.", icon: LockKeyhole },
  { title: "Clear case progress", description: "Follow review, information requests and support updates in one timeline.", icon: History },
  { title: "Documents in one place", description: "Share only requested documents through a protected workflow.", icon: FileCheck2 },
];

export const missingPersons = [
  { id: "mp-001", name: "Demo profile — Rahim A.", age: 21, lastSeenLocation: "Farmgate, Dhaka", lastSeenDate: "20 July 2024", verified: true, image: "/images/missing/person-01.svg", clothing: "Dark shirt and backpack", description: "This is placeholder content for UI demonstration. Replace it with admin-verified public information only." },
  { id: "mp-002", name: "Demo profile — Nusrat J.", age: 24, lastSeenLocation: "Mirpur 10, Dhaka", lastSeenDate: "21 July 2024", verified: true, image: "/images/missing/person-02.svg", clothing: "Light-coloured scarf", description: "This is placeholder content for UI demonstration. Private phone numbers are never shown publicly." },
  { id: "mp-003", name: "Demo profile — S. Hasan", age: 19, lastSeenLocation: "Jatrabari, Dhaka", lastSeenDate: "19 July 2024", verified: true, image: "/images/missing/person-03.svg", clothing: "Blue shirt", description: "This is placeholder content for UI demonstration. Sighting reports remain private until reviewed." },
];

export const verificationSteps = [
  { number: "01", title: "Submit", description: "A contributor shares a record, source details, date, place, consent and privacy preference.", icon: FileText },
  { number: "02", title: "Admin review", description: "An authorised reviewer checks completeness, privacy risks and relevance.", icon: Search },
  { number: "03", title: "Source verification", description: "Dates, locations, source context and supporting records are compared.", icon: FileCheck2 },
  { number: "04", title: "Consent confirmation", description: "Publication choices and identity protection are confirmed before release.", icon: ShieldCheck },
  { number: "05", title: "Publish or support", description: "Approved public records are published; private support cases remain protected.", icon: CheckCircle2 },
];

export const statistics = [
  { label: "Verified documentary records", value: 1240, suffix: "+", icon: Archive },
  { label: "Stories preserved", value: 380, suffix: "+", icon: MessageSquareText },
  { label: "Support cases managed", value: 175, suffix: "+", icon: HeartHandshake },
  { label: "Missing-person reports reviewed", value: 92, suffix: "+", icon: Search },
];

export const footerLinks = {
  Platform: navigationItems.slice(1, 6),
  Contribute: [
    { label: "Submit Evidence", to: "/submit" },
    { label: "Share a Story", to: "/submit?type=story" },
    { label: "Report a Missing Person", to: "/missing-persons/report" },
    { label: "Request Support", to: "/support/new" },
  ],
  Information: [
    { label: "About July Smriti", to: "/about" },
    { label: "Verification Policy", to: "/about#verification" },
    { label: "Privacy Policy", to: "/about#privacy" },
    { label: "Content Guidelines", to: "/about#guidelines" },
    { label: "Contact", to: "/about#contact" },
  ],
  Account: [
    { label: "Sign In", to: "/login" },
    { label: "Create Account", to: "/sign-up" },
    { label: "My Submissions", to: "/account/submissions" },
    { label: "My Support Rooms", to: "/account/support-rooms" },
  ],
};

export const dashboardQuickActions = [
  { title: "Submit evidence", description: "Share pictures, written stories, testimony, videos, audio and documents in one protected submission.", to: "/submit", icon: FileText },
  { title: "Open support request", description: "Create a private request and follow its progress.", to: "/support/new", icon: HeartHandshake },
  { title: "Report a missing person", description: "Send information for administrator verification.", to: "/missing-persons/report", icon: Search },
  { title: "Browse verified archive", description: "Explore published records and stories.", to: "/archive", icon: ImageIcon },
];
