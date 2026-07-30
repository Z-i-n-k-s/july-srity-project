const Location = require("../models/locationModel");

const DIVISIONS = [
  {
    slug: "barishal",
    name: "Barishal",
    nameBn: "বরিশাল",
    aliases: ["barishal", "barisal", "বরিশাল"],
  },
  {
    slug: "chattogram",
    name: "Chattogram",
    nameBn: "চট্টগ্রাম",
    aliases: ["chattogram", "chittagong", "চট্টগ্রাম"],
  },
  {
    slug: "dhaka",
    name: "Dhaka",
    nameBn: "ঢাকা",
    aliases: ["dhaka", "ঢাকা"],
  },
  {
    slug: "khulna",
    name: "Khulna",
    nameBn: "খুলনা",
    aliases: ["khulna", "খুলনা"],
  },
  {
    slug: "mymensingh",
    name: "Mymensingh",
    nameBn: "ময়মনসিংহ",
    aliases: ["mymensingh", "mymensing", "ময়মনসিংহ", "ময়মনসিংহ"],
  },
  {
    slug: "rajshahi",
    name: "Rajshahi",
    nameBn: "রাজশাহী",
    aliases: ["rajshahi", "রাজশাহী"],
  },
  {
    slug: "rangpur",
    name: "Rangpur",
    nameBn: "রংপুর",
    aliases: ["rangpur", "rongpur", "রংপুর"],
  },
  {
    slug: "sylhet",
    name: "Sylhet",
    nameBn: "সিলেট",
    aliases: ["sylhet", "সিলেট"],
  },
];

const LOCATION_INDEX_TTL_MS = 5 * 60 * 1000;
let cachedLocationIndex = null;
let cachedLocationIndexExpiresAt = 0;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function getDivision(value) {
  const normalized = normalize(value);
  if (!normalized) return null;

  return (
    DIVISIONS.find(
      (division) =>
        division.slug === normalized ||
        division.aliases.some((alias) => normalize(alias) === normalized),
    ) || null
  );
}

function divisionFromText(value) {
  const normalized = normalize(value);
  if (!normalized) return null;

  return (
    DIVISIONS.find((division) =>
      division.aliases.some((alias) => normalized.includes(normalize(alias))),
    ) || null
  );
}

function divisionDescriptionRegex(division) {
  return new RegExp(division.aliases.map(escapeRegex).join("|"), "i");
}

async function buildDivisionLocationIndex(options = {}) {
  const forceRefresh = Boolean(options.forceRefresh);
  if (!forceRefresh && cachedLocationIndex && Date.now() < cachedLocationIndexExpiresAt) {
    return cachedLocationIndex;
  }

  const locations = await Location.find({}, "_id name nameBn type parentLocationId").lean();
  const byId = new Map(locations.map((location) => [String(location._id), location]));
  const locationToDivision = new Map();
  const divisionToLocationIds = new Map(DIVISIONS.map((division) => [division.slug, new Set()]));
  const primaryDivisionIds = new Map();

  const resolveLocationDivision = (location) => {
    const startId = String(location?._id || "");
    if (!startId) return null;
    if (locationToDivision.has(startId)) return locationToDivision.get(startId);

    let current = location;
    const visited = new Set();
    let resolved = null;

    while (current && !visited.has(String(current._id))) {
      const currentId = String(current._id);
      visited.add(currentId);

      const byName = divisionFromText(`${current.name || ""} ${current.nameBn || ""}`);
      if (byName) {
        resolved = byName;
        if (current.type === "DIVISION" && !primaryDivisionIds.has(byName.slug)) {
          primaryDivisionIds.set(byName.slug, currentId);
        }
        break;
      }

      current = current.parentLocationId
        ? byId.get(String(current.parentLocationId))
        : null;
    }

    locationToDivision.set(startId, resolved);
    return resolved;
  };

  locations.forEach((location) => {
    const division = resolveLocationDivision(location);
    if (division) {
      divisionToLocationIds.get(division.slug).add(location._id);
    }
  });

  cachedLocationIndex = {
    locations,
    locationToDivision,
    divisionToLocationIds,
    primaryDivisionIds,
  };
  cachedLocationIndexExpiresAt = Date.now() + LOCATION_INDEX_TTL_MS;

  return cachedLocationIndex;
}

module.exports = {
  DIVISIONS,
  getDivision,
  divisionFromText,
  divisionDescriptionRegex,
  buildDivisionLocationIndex,
};
