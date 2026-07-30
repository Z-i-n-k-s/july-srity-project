import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileSearch,
  Filter,
  Loader2,
  MapPin,
  Phone,
  Search,
  ShieldAlert,
  Shirt,
  UserRound,
  UserRoundCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { adminApi, unwrap } from "../../lib/api";
import { adminMissingFallback } from "../../data/adminData";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import StatusBadge from "../../components/ui/StatusBadge";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

const STATUS_MAP = {
  approve: "VERIFIED_MISSING",
  request_information: "NEEDS_INFORMATION",
  reject: "REJECTED",
};

const STATUS_LABEL_MAP = {
  VERIFIED_MISSING: "Verified for publication",
  NEEDS_INFORMATION: "Information required",
  REJECTED: "Rejected",
};

const FILTER_OPTIONS = [
  {
    value: "all",
    label: "All reports",
    labelBn: "সব রিপোর্ট",
  },
  {
    value: "pending",
    label: "Pending review",
    labelBn: "পর্যালোচনাধীন",
  },
  {
    value: "verified",
    label: "Verified",
    labelBn: "যাচাইকৃত",
  },
  {
    value: "information",
    label: "Needs information",
    labelBn: "তথ্য প্রয়োজন",
  },
  {
    value: "rejected",
    label: "Rejected",
    labelBn: "প্রত্যাখ্যাত",
  },
];

function normalizeStatus(status = "") {
  return String(status)
    .trim()
    .toUpperCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function getStatusGroup(status) {
  const normalized = normalizeStatus(status);

  if (
    normalized.includes("VERIFIED") ||
    normalized.includes("APPROVED") ||
    normalized.includes("PUBLICATION")
  ) {
    return "verified";
  }

  if (
    normalized.includes("NEEDS_INFORMATION") ||
    normalized.includes("INFORMATION_REQUIRED") ||
    normalized.includes("ACTION_REQUIRED")
  ) {
    return "information";
  }

  if (
    normalized.includes("REJECTED") ||
    normalized.includes("FALSE_REPORT")
  ) {
    return "rejected";
  }

  return "pending";
}

/**
 * Returns the MongoDB document ID.
 *
 * `_id` is the database ID used by API routes.
 * `id` is normally the public report number such as MPR-20260730-XXXX.
 */
function getReportId(value) {
  if (!value) return null;

  const possibleId =
    value._id ||
    value.report?._id ||
    value.data?._id ||
    value.data?.report?._id ||
    value.reportId ||
    value.missingPersonReportId ||
    null;

  return possibleId ? String(possibleId) : null;
}

function normalizeReportDetails(value, listItem = null) {
  const rawData = value?.data ?? value ?? {};

  const rawReport =
    rawData.report ||
    rawData.missingPersonReport ||
    rawData.item ||
    rawData;

  const fallbackDatabaseId = getReportId(listItem);

  const report = {
    ...rawReport,

    _id: getReportId(rawReport) || fallbackDatabaseId,

    reportNumber:
      rawReport.reportNumber ||
      rawReport.id ||
      listItem?.id ||
      "",

    name:
      rawReport.name ||
      rawReport.person?.fullName ||
      listItem?.name ||
      "",

    image:
      rawReport.image ||
      rawReport.photo ||
      rawReport.profileMediaId?.secureUrl ||
      rawReport.profileMediaId?.url ||
      listItem?.image ||
      listItem?.photo ||
      "",

    description:
      rawReport.description ||
      rawReport.person?.publicDescription ||
      listItem?.description ||
      "",

    age:
      rawReport.age ||
      rawReport.person?.age ||
      listItem?.age ||
      "",

    clothing:
      rawReport.clothing ||
      rawReport.person?.clothingDescription ||
      listItem?.clothing ||
      "",

    reporter:
      rawReport.reporter ||
      listItem?.reporter ||
      "",

    relationship:
      rawReport.relationship ||
      listItem?.relationship ||
      "",

    lastSeenDate:
      rawReport.lastSeenDate ||
      rawReport.lastSeen?.dateTime ||
      listItem?.lastSeenDate ||
      "",

    lastSeenLocation:
      rawReport.lastSeenLocation ||
      rawReport.lastSeen?.locationId?.name ||
      rawReport.lastSeen?.locationId?.nameBn ||
      rawReport.lastSeen?.addressDescription ||
      listItem?.lastSeenLocation ||
      "",

    status:
      rawReport.status ||
      listItem?.status ||
      "PENDING_REVIEW",
  };

  return {
    report,

    privateDetails:
      rawData.privateDetails ||
      rawData.missingPersonPrivateDetails ||
      null,

    sightings: Array.isArray(rawData.sightings)
      ? rawData.sightings
      : [],
  };
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function valueOrFallback(value, fallback = "—") {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  return value;
}

export default function AdminMissingReports() {
  const [items, setItems] = useState(adminMissingFallback);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const toast = useToast();
  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;

    const loadReports = async () => {
      setLoadingList(true);

      try {
        const payload = await adminApi.missingReports(
          adminMissingFallback,
        );

        if (!active) return;

        const data = unwrap(payload);

        if (Array.isArray(data)) {
          setItems(data);
        } else if (Array.isArray(data?.reports)) {
          setItems(data.reports);
        } else if (Array.isArray(data?.items)) {
          setItems(data.items);
        }
      } catch (error) {
        if (!active) return;

        toast.error(
          error.message ||
            pick(
              "Unable to load missing-person reports.",
              "নিখোঁজ ব্যক্তির রিপোর্ট লোড করা যায়নি।",
            ),
        );
      } finally {
        if (active) {
          setLoadingList(false);
        }
      }
    };

    loadReports();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) return undefined;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        !saving &&
        !loadingReport
      ) {
        setSelected(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selected, saving, loadingReport]);

  const summary = useMemo(() => {
    return items.reduce(
      (result, item) => {
        result.total += 1;

        const group = getStatusGroup(item.status);

        if (group === "pending") {
          result.pending += 1;
        }

        if (group === "verified") {
          result.verified += 1;
        }

        if (group === "information") {
          result.information += 1;
        }

        return result;
      },
      {
        total: 0,
        pending: 0,
        verified: 0,
        information: 0,
      },
    );
  }, [items]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        getStatusGroup(item.status) === statusFilter;

      const searchableText = [
        item.id,
        item._id,
        item.name,
        item.lastSeenLocation,
        item.reporter,
        item.relationship,
        item.clothing,
        item.description,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        !normalizedQuery ||
        searchableText.includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [items, query, statusFilter]);

  const openReport = async (item) => {
    const databaseId = getReportId(item);

    if (!databaseId) {
      toast.error(
        pick(
          "The report database ID is missing.",
          "রিপোর্টের ডাটাবেস আইডি পাওয়া যায়নি।",
        ),
      );
      return;
    }

    setLoadingReport(true);

    try {
      const payload =
        await adminApi.missingReport(databaseId);

      const unwrappedData = unwrap(payload);

      const normalizedDetails = normalizeReportDetails(
        unwrappedData,
        item,
      );

      /*
       * Keep the list item's MongoDB ID even when
       * the detail endpoint does not return `_id`.
       */
      normalizedDetails.report._id =
        getReportId(normalizedDetails.report) || databaseId;

      setSelected(normalizedDetails);
      setNote("");
    } catch (error) {
      toast.error(
        error.message ||
          pick(
            "Unable to open this report.",
            "রিপোর্টটি খোলা যায়নি।",
          ),
      );
    } finally {
      setLoadingReport(false);
    }
  };

  const report = selected?.report || null;
  const privateDetails = selected?.privateDetails || {};

  const reporter = privateDetails?.reporterDetails || {};

  const missingPerson =
    privateDetails?.missingPersonDetails || {};

  const sightings = Array.isArray(selected?.sightings)
    ? selected.sightings
    : [];

  const profileImage =
    report?.profileMediaId?.secureUrl ||
    report?.profileMediaId?.url ||
    report?.image ||
    report?.photo ||
    "";

  const personName =
    report?.person?.fullName ||
    report?.name ||
    pick("Unknown person", "অজ্ঞাত ব্যক্তি");

  const personAge =
    report?.person?.age ??
    report?.age ??
    missingPerson?.age ??
    "—";

  const reporterName =
    reporter?.fullName ||
    report?.reporter ||
    "—";

  const reporterRelationship =
    reporter?.relationship ||
    report?.relationship ||
    "—";

  const reporterPhone =
    reporter?.phone ||
    reporter?.alternativePhone ||
    report?.reporterPhone ||
    "—";

  const lastSeenDate =
    report?.lastSeen?.dateTime ||
    report?.lastSeenDate ||
    null;

  const lastSeenLocation =
    report?.lastSeen?.locationId?.name ||
    report?.lastSeen?.locationId?.nameBn ||
    report?.lastSeen?.addressDescription ||
    report?.lastSeenLocation ||
    "—";

  const publicDescription =
    report?.person?.publicDescription ||
    report?.description ||
    pick(
      "No public description was provided.",
      "কোনো প্রকাশ্য বিবরণ দেওয়া হয়নি।",
    );

  const clothingDescription =
    report?.person?.clothingDescription ||
    report?.clothing ||
    pick(
      "No clothing description was provided.",
      "পোশাকের কোনো বিবরণ দেওয়া হয়নি।",
    );

  const identifyingMarks =
    report?.person?.identifyingMarks ||
    missingPerson?.identifyingMarks ||
    pick(
      "No identifying marks were provided.",
      "শনাক্তকারী কোনো চিহ্ন দেওয়া হয়নি।",
    );

  const review = async (action) => {
    const databaseId =
      getReportId(report) || getReportId(selected);

    if (!databaseId) {
      toast.error(
        pick(
          "The report database ID is missing. Close the report and open it again.",
          "রিপোর্টের ডাটাবেস আইডি পাওয়া যায়নি। রিপোর্টটি বন্ধ করে আবার খুলুন।",
        ),
      );
      return;
    }

    if (!STATUS_MAP[action]) {
      toast.error(
        pick(
          "The selected review action is invalid.",
          "নির্বাচিত রিভিউ কার্যক্রমটি সঠিক নয়।",
        ),
      );
      return;
    }

    if (
      action !== "approve" &&
      note.trim().length < 8
    ) {
      toast.warning(
        pick(
          "Add a clear review note of at least 8 characters.",
          "কমপক্ষে ৮ অক্ষরের একটি পরিষ্কার রিভিউ নোট দিন।",
        ),
      );
      return;
    }

    setSaving(true);

    try {
      const nextBackendStatus = STATUS_MAP[action];

      const nextDisplayStatus =
        STATUS_LABEL_MAP[nextBackendStatus];

      await adminApi.changeMissingStatus(databaseId, {
        status: nextBackendStatus,
        publicNote: note.trim() || undefined,
        privateNote: note.trim() || undefined,
      });

      setItems((currentItems) =>
        currentItems.map((item) => {
          const itemDatabaseId = getReportId(item);

          if (itemDatabaseId !== databaseId) {
            return item;
          }

          return {
            ...item,
            status: nextDisplayStatus,
            verified: action === "approve",
          };
        }),
      );

      setSelected((currentSelected) => {
        if (!currentSelected) {
          return currentSelected;
        }

        return {
          ...currentSelected,

          report: {
            ...currentSelected.report,
            _id: databaseId,
            status: nextBackendStatus,
            verified: action === "approve",
          },
        };
      });

      setNote("");

      toast.success(
        pick(
          `Report marked as ${nextDisplayStatus}.`,
          `রিপোর্টটি ${nextDisplayStatus} হিসেবে চিহ্নিত হয়েছে।`,
        ),
      );
    } catch (error) {
      toast.error(
        error.message ||
          pick(
            "Unable to update the report.",
            "রিপোর্ট আপডেট করা যায়নি।",
          ),
      );
    } finally {
      setSaving(false);
    }
  };

  const closeReport = () => {
    if (saving || loadingReport) return;

    setSelected(null);
    setNote("");
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-white/[0.055] via-white/[0.025] to-transparent p-6 shadow-2xl shadow-black/10 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-archive-rose/[0.08] blur-3xl" />

        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-archive-amber/[0.06] blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-archive-rose/20 bg-archive-rose/[0.08] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-archive-rose">
              <ShieldAlert className="h-4 w-4" />

              {pick(
                "Safety-first verification",
                "নিরাপত্তা-প্রথম যাচাই",
              )}
            </div>

            <h1 className="mt-5 max-w-4xl font-display text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              {pick(
                "Missing-person reports and private sightings",
                "নিখোঁজ ব্যক্তির রিপোর্ট ও ব্যক্তিগত দেখা-সংক্রান্ত তথ্য",
              )}
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-archive-muted sm:text-base">
              {pick(
                "Review reporter relationships, contact consent, image suitability and all public information before approving a listing. Unverified sightings must remain private.",
                "প্রকাশ্য তালিকা অনুমোদনের আগে রিপোর্টারের সম্পর্ক, যোগাযোগের সম্মতি, ছবির উপযোগিতা এবং সব প্রকাশ্য তথ্য যাচাই করুন। যাচাই না হওয়া দেখা-সংক্রান্ত তথ্য ব্যক্তিগত রাখতে হবে।",
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-archive-amber/15 bg-black/15 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-archive-amber/20 bg-archive-amber/10 text-archive-amber">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {pick(
                    "Private information",
                    "ব্যক্তিগত তথ্য",
                  )}
                </p>

                <p className="mt-1 text-xs leading-5 text-archive-muted">
                  {pick(
                    "Phone numbers, exact addresses and sightings are visible to reviewers only.",
                    "ফোন নম্বর, সঠিক ঠিকানা এবং দেখা-সংক্রান্ত তথ্য শুধু পর্যালোচকদের জন্য দৃশ্যমান।",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={FileSearch}
          label={pick("Total reports", "মোট রিপোর্ট")}
          value={summary.total}
          description={pick(
            "All submitted cases",
            "সকল জমা দেওয়া কেস",
          )}
          iconClass="border-white/10 bg-white/[0.05] text-white"
        />

        <SummaryCard
          icon={ClipboardCheck}
          label={pick("Pending review", "পর্যালোচনাধীন")}
          value={summary.pending}
          description={pick(
            "Waiting for verification",
            "যাচাইয়ের অপেক্ষায়",
          )}
          iconClass="border-archive-amber/20 bg-archive-amber/10 text-archive-amber"
        />

        <SummaryCard
          icon={CheckCircle2}
          label={pick("Verified", "যাচাইকৃত")}
          value={summary.verified}
          description={pick(
            "Approved public listings",
            "অনুমোদিত প্রকাশ্য তালিকা",
          )}
          iconClass="border-archive-teal/20 bg-archive-teal/10 text-archive-teal"
        />

        <SummaryCard
          icon={UserRoundCheck}
          label={pick(
            "Information required",
            "তথ্য প্রয়োজন",
          )}
          value={summary.information}
          description={pick(
            "Waiting for the reporter",
            "রিপোর্টারের উত্তরের অপেক্ষায়",
          )}
          iconClass="border-archive-rose/20 bg-archive-rose/10 text-archive-rose"
        />
      </section>

      {/* Search and filters */}
      <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block w-full xl:max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-archive-muted" />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              className="field-control h-12 w-full pl-12 pr-4"
              placeholder={pick(
                "Search ID, name, reporter, clothing or location",
                "আইডি, নাম, রিপোর্টার, পোশাক বা স্থান খুঁজুন",
              )}
            />
          </label>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <div className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-archive-muted">
              <Filter className="h-4 w-4" />
            </div>

            {FILTER_OPTIONS.map((option) => {
              const active =
                statusFilter === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(option.value)
                  }
                  className={`focus-ring shrink-0 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                    active
                      ? "border-archive-amber/30 bg-archive-amber/10 text-archive-amber"
                      : "border-white/[0.08] bg-white/[0.025] text-archive-muted hover:border-white/15 hover:text-white"
                  }`}
                >
                  {pick(option.label, option.labelBn)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
          <p className="text-sm text-archive-muted">
            <span className="font-semibold text-white">
              {filtered.length}
            </span>{" "}
            {pick(
              filtered.length === 1
                ? "report found"
                : "reports found",
              "টি রিপোর্ট পাওয়া গেছে",
            )}
          </p>

          {(query || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
              }}
              className="focus-ring text-xs font-semibold text-archive-amber transition hover:text-white"
            >
              {pick("Clear filters", "ফিল্টার মুছুন")}
            </button>
          )}
        </div>
      </section>

      {/* Report list */}
      <section>
        {loadingList ? (
          <div className="flex min-h-72 items-center justify-center rounded-[28px] border border-white/[0.08] bg-white/[0.025]">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-archive-amber" />

              <p className="mt-3 text-sm text-archive-muted">
                {pick(
                  "Loading reports…",
                  "রিপোর্ট লোড হচ্ছে…",
                )}
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] p-6">
            <div className="max-w-md text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-archive-muted">
                <Search className="h-6 w-6" />
              </div>

              <h3 className="mt-4 font-display text-xl font-semibold text-white">
                {pick(
                  "No matching reports",
                  "কোনো মিল পাওয়া যায়নি",
                )}
              </h3>

              <p className="mt-2 text-sm leading-6 text-archive-muted">
                {pick(
                  "Try another search term or select a different status filter.",
                  "অন্য শব্দ দিয়ে খুঁজুন অথবা ভিন্ন স্ট্যাটাস ফিল্টার নির্বাচন করুন।",
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((item) => {
              const imageSource =
                item.image || item.photo || "";

              return (
                <article
                  key={item._id || item.id}
                  className="group overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.025] transition duration-300 hover:-translate-y-1 hover:border-white/[0.15] hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-black/20"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-black/20">
                    <ImageWithFallback
                      src={imageSource}
                      alt={
                        item.name ||
                        pick(
                          "Missing person",
                          "নিখোঁজ ব্যক্তি",
                        )
                      }
                      className="h-full w-full"
                      imageClassName="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090B10] via-transparent to-black/20" />

                    <div className="absolute left-4 top-4">
                      <StatusBadge status={item.status} />
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-archive-rose">
                          {valueOrFallback(item.id)}
                        </p>

                        <h2 className="mt-1 font-display text-2xl font-semibold text-white">
                          {valueOrFallback(
                            item.name,
                            pick(
                              "Unknown person",
                              "অজ্ঞাত ব্যক্তি",
                            ),
                          )}
                        </h2>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                          item.priority === "High" ||
                          item.priority === "Urgent" ||
                          item.priority === "Critical"
                            ? "border-archive-rose/30 bg-archive-rose/15 text-archive-rose"
                            : "border-white/15 bg-black/30 text-[#D6D1CA]"
                        }`}
                      >
                        {valueOrFallback(
                          item.priority,
                          "Normal",
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InformationTile
                        icon={MapPin}
                        label={pick(
                          "Last seen location",
                          "শেষ দেখা স্থান",
                        )}
                        value={valueOrFallback(
                          item.lastSeenLocation,
                        )}
                      />

                      <InformationTile
                        icon={CalendarDays}
                        label={pick(
                          "Last seen date",
                          "শেষ দেখা তারিখ",
                        )}
                        value={valueOrFallback(
                          item.lastSeenDate,
                        )}
                      />
                    </div>

                    <p className="mt-4 line-clamp-3 min-h-[72px] text-sm leading-6 text-[#C6C2BC]">
                      {valueOrFallback(
                        item.description,
                        pick(
                          "No description was provided.",
                          "কোনো বিবরণ দেওয়া হয়নি।",
                        ),
                      )}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/[0.07] pt-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-archive-muted">
                          {pick(
                            "Reported by",
                            "রিপোর্ট করেছেন",
                          )}
                        </p>

                        <p className="mt-1 truncate text-sm font-medium text-white">
                          {valueOrFallback(item.reporter)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openReport(item)}
                        className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-xl border border-archive-amber/25 bg-archive-amber/10 px-4 py-2.5 text-xs font-semibold text-archive-amber transition hover:border-archive-amber/40 hover:bg-archive-amber/15"
                      >
                        <Eye className="h-4 w-4" />

                        {pick(
                          "Review report",
                          "রিপোর্ট দেখুন",
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Detail loading overlay */}
      {loadingReport && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="flex min-w-56 flex-col items-center rounded-2xl border border-white/10 bg-ink-800 p-7 text-center shadow-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-archive-amber" />

            <p className="mt-4 text-sm font-medium text-white">
              {pick(
                "Opening report…",
                "রিপোর্ট খোলা হচ্ছে…",
              )}
            </p>

            <p className="mt-1 text-xs text-archive-muted">
              {pick(
                "Loading private verification details",
                "ব্যক্তিগত যাচাইয়ের তথ্য লোড হচ্ছে",
              )}
            </p>
          </div>
        </div>
      )}

      {/* Report review modal */}
      {selected && !loadingReport && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="missing-report-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/85 backdrop-blur-md"
            onClick={closeReport}
            aria-label={pick(
              "Close report",
              "রিপোর্ট বন্ধ করুন",
            )}
          />

          <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#10141C] shadow-2xl shadow-black/60">
            {/* Modal header */}
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.08] bg-[#10141C]/95 px-5 py-4 backdrop-blur sm:px-7">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-archive-rose">
                  {valueOrFallback(
                    report?.reportNumber ||
                      report?.id,
                  )}
                </p>

                <h2
                  id="missing-report-title"
                  className="mt-1 truncate font-display text-xl font-semibold text-white sm:text-2xl"
                >
                  {personName}
                </h2>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={report?.status} />

                <button
                  type="button"
                  disabled={saving}
                  onClick={closeReport}
                  className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-archive-muted transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={pick(
                    "Close report",
                    "রিপোর্ট বন্ধ করুন",
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            {/* Modal content */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid lg:grid-cols-[360px_1fr]">
                <aside className="border-b border-white/[0.08] p-5 lg:border-b-0 lg:border-r sm:p-7">
                  <ImageWithFallback
                    src={profileImage}
                    alt={personName}
                    className="aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                    imageClassName="h-full w-full object-cover"
                  />

                  <div className="mt-5 rounded-2xl border border-archive-rose/20 bg-archive-rose/[0.065] p-4">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-archive-rose" />

                      <div>
                        <p className="text-sm font-semibold text-[#F5DCE1]">
                          {pick(
                            "Sensitive information",
                            "সংবেদনশীল তথ্য",
                          )}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#DAB8BF]">
                          {pick(
                            "Do not publish phone numbers, exact addresses or unverified sightings.",
                            "ফোন নম্বর, সঠিক ঠিকানা অথবা যাচাই না হওয়া দেখা-সংক্রান্ত তথ্য প্রকাশ করবেন না।",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-archive-amber" />

                      <h3 className="text-sm font-semibold text-white">
                        {pick(
                          "Reporter information",
                          "রিপোর্টারের তথ্য",
                        )}
                      </h3>
                    </div>

                    <dl className="mt-4 space-y-4">
                      <DetailRow
                        label={pick("Name", "নাম")}
                        value={reporterName}
                      />

                      <DetailRow
                        label={pick(
                          "Relationship",
                          "সম্পর্ক",
                        )}
                        value={reporterRelationship}
                      />

                      <DetailRow
                        label={pick(
                          "Private contact",
                          "ব্যক্তিগত যোগাযোগ",
                        )}
                        value={reporterPhone}
                        icon={Phone}
                      />
                    </dl>
                  </div>
                </aside>

                <main className="p-5 sm:p-7">
                  <section>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="eyebrow">
                          {pick(
                            "Person details",
                            "ব্যক্তির তথ্য",
                          )}
                        </p>

                        <h3 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
                          {personName}
                        </h3>
                      </div>

                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-archive-muted">
                          {pick(
                            "Private sightings",
                            "ব্যক্তিগত দেখা-তথ্য",
                          )}
                        </p>

                        <p className="mt-1 text-2xl font-semibold text-white">
                          {sightings.length}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <DetailCard
                        icon={Users}
                        label={pick("Age", "বয়স")}
                        value={personAge}
                      />

                      <DetailCard
                        icon={CalendarDays}
                        label={pick(
                          "Last seen",
                          "শেষ দেখা",
                        )}
                        value={formatDate(lastSeenDate)}
                      />

                      <DetailCard
                        icon={MapPin}
                        label={pick("Location", "স্থান")}
                        value={lastSeenLocation}
                      />
                    </div>
                  </section>

                  <section className="mt-7 grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                      <div className="flex items-center gap-2 text-white">
                        <FileSearch className="h-5 w-5 text-archive-amber" />

                        <h3 className="font-semibold">
                          {pick(
                            "Public description",
                            "প্রকাশ্য বিবরণ",
                          )}
                        </h3>
                      </div>

                      <p className="mt-3 text-sm leading-7 text-[#C6C2BC]">
                        {publicDescription}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                      <div className="flex items-center gap-2 text-white">
                        <Shirt className="h-5 w-5 text-archive-teal" />

                        <h3 className="font-semibold">
                          {pick(
                            "Clothing description",
                            "পোশাকের বিবরণ",
                          )}
                        </h3>
                      </div>

                      <p className="mt-3 text-sm leading-7 text-[#C6C2BC]">
                        {clothingDescription}
                      </p>
                    </div>
                  </section>

                  <section className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-archive-muted">
                      {pick(
                        "Identifying marks",
                        "শনাক্তকারী চিহ্ন",
                      )}
                    </p>

                    <p className="mt-2 text-sm leading-7 text-[#C6C2BC]">
                      {identifyingMarks}
                    </p>
                  </section>

                  {sightings.length > 0 && (
                    <section className="mt-7">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="eyebrow">
                            {pick(
                              "Private evidence",
                              "ব্যক্তিগত প্রমাণ",
                            )}
                          </p>

                          <h3 className="mt-1 font-display text-xl font-semibold text-white">
                            {pick(
                              "Submitted sightings",
                              "জমা দেওয়া দেখা-সংক্রান্ত তথ্য",
                            )}
                          </h3>
                        </div>

                        <span className="rounded-full border border-archive-rose/20 bg-archive-rose/[0.07] px-3 py-1 text-xs font-semibold text-archive-rose">
                          {sightings.length}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {sightings.map(
                          (sighting, index) => (
                            <div
                              key={sighting._id || index}
                              className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-white">
                                    {valueOrFallback(
                                      sighting.locationDescription ||
                                        sighting.locationId
                                          ?.name,
                                      pick(
                                        "Location not provided",
                                        "স্থান দেওয়া হয়নি",
                                      ),
                                    )}
                                  </p>

                                  <p className="mt-1 text-xs text-archive-muted">
                                    {formatDate(
                                      sighting.sightingDateTime,
                                    )}
                                  </p>
                                </div>

                                <StatusBadge
                                  status={sighting.status}
                                />
                              </div>

                              <p className="mt-3 text-sm leading-6 text-[#C6C2BC]">
                                {valueOrFallback(
                                  sighting.description,
                                  pick(
                                    "No sighting description was provided.",
                                    "দেখা-সংক্রান্ত কোনো বিবরণ দেওয়া হয়নি।",
                                  ),
                                )}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </section>
                  )}

                  <section className="mt-7 rounded-2xl border border-archive-amber/15 bg-archive-amber/[0.035] p-5">
                    <label className="block">
                      <span className="field-label">
                        {pick(
                          "Verification note",
                          "যাচাই নোট",
                        )}
                      </span>

                      <textarea
                        value={note}
                        onChange={(event) =>
                          setNote(
                            event.target.value.slice(0, 500),
                          )
                        }
                        rows={5}
                        className="field-control mt-2 resize-none"
                        placeholder={pick(
                          "Record relationship checks, consent, image review and any additional information required…",
                          "সম্পর্ক যাচাই, সম্মতি, ছবি পর্যালোচনা এবং প্রয়োজনীয় অতিরিক্ত তথ্য লিখুন…",
                        )}
                      />
                    </label>

                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-archive-muted">
                      <span>
                        {pick(
                          "A note is required when requesting information or rejecting.",
                          "তথ্য চাইলে বা প্রত্যাখ্যান করলে নোট দেওয়া আবশ্যক।",
                        )}
                      </span>

                      <span>{note.trim().length}/500</span>
                    </div>
                  </section>
                </main>
              </div>
            </div>

            {/* Modal actions */}
            <footer className="shrink-0 border-t border-white/[0.08] bg-[#10141C]/95 px-5 py-4 backdrop-blur sm:px-7">
              <div className="flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeReport}
                  className="focus-ring inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-archive-muted transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pick(
                    "Close review",
                    "রিভিউ বন্ধ করুন",
                  )}
                </button>

                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      review("request_information")
                    }
                    className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-archive-teal/25 bg-archive-teal/10 px-4 py-3 text-sm font-semibold text-archive-teal transition hover:bg-archive-teal/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserRoundCheck className="h-4 w-4" />
                    )}

                    {pick(
                      "Request information",
                      "তথ্য চাইুন",
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => review("reject")}
                    className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-archive-rose/25 bg-archive-rose/10 px-4 py-3 text-sm font-semibold text-archive-rose transition hover:bg-archive-rose/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}

                    {pick("Reject", "প্রত্যাখ্যান")}
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => review("approve")}
                    className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-4 py-3 text-sm font-semibold text-ink-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}

                    {pick(
                      "Approve public listing",
                      "প্রকাশ্য তালিকা অনুমোদন",
                    )}
                  </button>
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
}) {
  return (
    <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-white/[0.14] hover:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-archive-muted">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-archive-muted">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function InformationTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/10 p-3">
      <div className="flex items-center gap-2 text-archive-muted">
        <Icon className="h-4 w-4 text-archive-rose" />

        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>

      <p className="mt-2 truncate text-sm font-medium text-white">
        {value}
      </p>
    </div>
  );
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-archive-amber" />

        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-archive-muted">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-medium text-white">
        {valueOrFallback(value)}
      </p>
    </div>
  );
}

function DetailRow({ label, value, icon: Icon }) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-archive-muted">
        {Icon && <Icon className="h-3.5 w-3.5" />}

        {label}
      </dt>

      <dd className="mt-1 break-words text-sm font-medium text-white">
        {valueOrFallback(value)}
      </dd>
    </div>
  );
}