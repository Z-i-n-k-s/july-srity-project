export const divisionMapMeta = [
  {
    slug: "rangpur",
    name: "Rangpur",
    nameBn: "রংপুর",
    svgId: "Rongpur",
    color: "#62c86d",
    marker: { x: 24, y: 14 },
    label: { x: 5, y: 13, align: "left" },
  },
  {
    slug: "mymensingh",
    name: "Mymensingh",
    nameBn: "ময়মনসিংহ",
    svgId: "Mymensingh",
    color: "#43b79d",
    marker: { x: 48, y: 31 },
    label: { x: 40, y: 24, align: "left" },
  },
  {
    slug: "sylhet",
    name: "Sylhet",
    nameBn: "সিলেট",
    svgId: "Sylhet",
    color: "#ff8745",
    marker: { x: 76, y: 31 },
    label: { x: 78, y: 36, align: "right" },
  },
  {
    slug: "rajshahi",
    name: "Rajshahi",
    nameBn: "রাজশাহী",
    svgId: "Rajshahi",
    color: "#b57ce8",
    marker: { x: 26, y: 43 },
    label: { x: 0, y: 38, align: "left" },
  },
  {
    slug: "dhaka",
    name: "Dhaka",
    nameBn: "ঢাকা",
    svgId: "Dhaka",
    color: "#3389ff",
    marker: { x: 52, y: 53 },
    label: { x: 40, y: 46, align: "left" },
  },
  {
    slug: "khulna",
    name: "Khulna",
    nameBn: "খুলনা",
    svgId: "Khulna",
    color: "#e7c143",
    marker: { x: 35, y: 68 },
    label: { x: 4, y: 67, align: "left" },
  },
  {
    slug: "barishal",
    name: "Barishal",
    nameBn: "বরিশাল",
    svgId: "Barisal",
    color: "#3eb7aa",
    marker: { x: 54, y: 72 },
    label: { x: 43, y: 81, align: "left" },
  },
  {
    slug: "chattogram",
    name: "Chattogram",
    nameBn: "চট্টগ্রাম",
    svgId: "Chittagong",
    color: "#e14f56",
    marker: { x: 73, y: 70 },
    label: { x: 69, y: 67, align: "left" },
  },
];

export const mapFilters = [
  { id: "all", label: "All", labelBn: "সব" },
  { id: "photo", label: "Photo", labelBn: "ছবি" },
  { id: "video", label: "Video", labelBn: "ভিডিও" },
  { id: "testimony", label: "Testimony", labelBn: "সাক্ষ্য" },
  { id: "document", label: "Document", labelBn: "নথি" },
];

const demoRecords = {
  dhaka: [
    {
      id: "arc-001",
      _id: "arc-001",
      type: "Photograph",
      status: "Corroborated",
      verified: true,
      title: "Students gathering at Shahbag",
      date: "16 Jul 2024",
      eventDate: "2024-07-16",
      location: "Shahbag, Dhaka",
      contributor: "Identity protected",
      description: "Students gathered at Shahbag demanding justice and democratic accountability.",
      image: "/images/archive/archive-01.svg",
      thumbnail: "/images/archive/archive-01.svg",
      verificationNote: "Source context and location references were reviewed before publication.",
      media: [{ id: "arc-001-cover", url: "/images/archive/archive-01.svg", mimeType: "image/svg+xml", name: "Shahbag gathering" }],
    },
    {
      id: "arc-004",
      _id: "arc-004",
      type: "Video",
      status: "Partially Verified",
      verified: true,
      title: "Internet shutdown in Dhaka",
      date: "18 Jul 2024",
      eventDate: "2024-07-18",
      location: "Dhaka",
      contributor: "Community archive",
      description: "A contextual record of communication disruption and public movement during the shutdown.",
      image: "/images/archive/archive-04.svg",
      thumbnail: "/images/archive/archive-04.svg",
      verificationNote: "The source was checked; some exact timing details remain under review.",
      media: [{ id: "arc-004-cover", url: "/images/archive/archive-04.svg", mimeType: "image/svg+xml", name: "Shutdown record" }],
    },
    {
      id: "arc-002",
      _id: "arc-002",
      type: "Testimony",
      status: "Source Checked",
      verified: true,
      title: "A day of courage",
      date: "19 Jul 2024",
      eventDate: "2024-07-19",
      location: "Mirpur, Dhaka",
      contributor: "Identity protected",
      description: "A consent-based witness account describing community support and efforts to reach safety.",
      image: "/images/stories/story-02.svg",
      thumbnail: "/images/stories/story-02.svg",
      verificationNote: "Contributor identity is protected and supporting context was reviewed.",
      media: [{ id: "arc-002-cover", url: "/images/stories/story-02.svg", mimeType: "image/svg+xml", name: "Testimony illustration" }],
    },
    {
      id: "arc-006",
      _id: "arc-006",
      type: "Photograph",
      status: "Corroborated",
      verified: true,
      title: "Helping the injured",
      date: "20 Jul 2024",
      eventDate: "2024-07-20",
      location: "Dhaka",
      contributor: "Verified volunteers",
      description: "Volunteers organised first aid and safe transport while protecting sensitive medical information.",
      image: "/images/archive/archive-06.svg",
      thumbnail: "/images/archive/archive-06.svg",
      verificationNote: "The public description excludes private medical details.",
      media: [{ id: "arc-006-cover", url: "/images/archive/archive-06.svg", mimeType: "image/svg+xml", name: "Volunteer support" }],
    },
  ],
  rangpur: [
    {
      id: "story-abu-sayed",
      _id: "story-abu-sayed",
      type: "Testimony",
      status: "Source Checked",
      verified: true,
      title: "A turning point remembered in Rangpur",
      date: "16 Jul 2024",
      location: "Rangpur",
      contributor: "Community archive",
      description: "A memorial record preserving public accounts of courage and the movement's turning point in Rangpur.",
      image: "/images/stories/story-01.svg",
      thumbnail: "/images/stories/story-01.svg",
      media: [{ id: "rangpur-cover", url: "/images/stories/story-01.svg", mimeType: "image/svg+xml", name: "Rangpur memorial" }],
    },
  ],
  chattogram: [
    {
      id: "story-wasim-akram",
      _id: "story-wasim-akram",
      type: "Testimony",
      status: "Source Checked",
      verified: true,
      title: "A student remembered across Chattogram",
      date: "16 Jul 2024",
      location: "Muradpur, Chattogram",
      contributor: "Community archive",
      description: "A privacy-aware memorial record from Chattogram.",
      image: "/images/stories/story-03.svg",
      thumbnail: "/images/stories/story-03.svg",
      media: [{ id: "chattogram-cover", url: "/images/stories/story-03.svg", mimeType: "image/svg+xml", name: "Chattogram memorial" }],
    },
  ],
};

const demoCounts = {
  rangpur: 350,
  mymensingh: 280,
  sylhet: 2000,
  rajshahi: 850,
  dhaka: 1000,
  khulna: 600,
  barishal: 400,
  chattogram: 1200,
};

export const fallbackMapSummary = {
  success: true,
  data: divisionMapMeta.map((division) => ({
    id: division.slug,
    slug: division.slug,
    name: division.name,
    nameBn: division.nameBn,
    count: demoCounts[division.slug] || 0,
  })),
  meta: {
    total: Object.values(demoCounts).reduce((sum, count) => sum + count, 0),
    divisions: divisionMapMeta.length,
    demo: true,
  },
};

export function fallbackMapMemories(divisionSlug, filter = "all") {
  const base = demoRecords[divisionSlug] || [];
  const normalized = String(filter || "all").toLowerCase();
  const filtered = normalized === "all"
    ? base
    : base.filter((item) => {
        if (normalized === "photo") return item.type === "Photograph";
        if (normalized === "document") return item.type === "Document";
        if (normalized === "testimony") return ["Testimony", "Story"].includes(item.type);
        return item.type.toLowerCase() === normalized;
      });

  const division = divisionMapMeta.find((item) => item.slug === divisionSlug) || divisionMapMeta[0];

  return {
    success: true,
    data: filtered,
    meta: {
      division: {
        slug: division.slug,
        name: division.name,
        nameBn: division.nameBn,
      },
      total: normalized === "all" ? demoCounts[divisionSlug] || filtered.length : filtered.length,
      limit: 10,
      hasMore: false,
      nextCursor: null,
      type: normalized,
      demo: true,
    },
  };
}
