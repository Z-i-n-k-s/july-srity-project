import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Eye,
  Loader2,
  LockKeyhole,
  MapPin,
  Shirt,
  ShieldCheck,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import ImageWithFallback from "../../components/ui/ImageWithFallback";
import Modal from "../../components/ui/Modal";
import FormField from "../../components/ui/FormField";
import StatusBadge from "../../components/ui/StatusBadge";
import { missingPersons } from "../../data/landingData";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { publicApi, unwrap, userApi } from "../../lib/api";
import { STORAGE_KEYS, storage } from "../../lib/storage";
import { isFutureLocalDateTime, makeId, toLocalDateInputValue } from "../../lib/utils";

const initialSighting = {
  date: "",
  time: "",
  location: "",
  details: "",
  contact: "",
  consent: false,
};

function formatPublicDate(value) {
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

function normalizeMissingPerson(payload, fallback = null) {
  const unwrapped = unwrap(payload);

  const report =
    unwrapped?.report ||
    unwrapped?.missingPersonReport ||
    unwrapped?.item ||
    unwrapped ||
    {};

  const fallbackPerson = fallback || {};

  const nestedPerson = report?.person || {};

  const profileMedia =
    report?.profileMediaId ||
    report?.profileMedia ||
    {};

  const lastSeen = report?.lastSeen || {};

  const location =
    lastSeen?.locationId?.name ||
    lastSeen?.locationId?.nameBn ||
    lastSeen?.addressDescription ||
    report?.lastSeenLocation ||
    fallbackPerson?.lastSeenLocation ||
    "—";

  const lastSeenDate =
    lastSeen?.dateTime ||
    report?.lastSeenDate ||
    fallbackPerson?.lastSeenDate ||
    null;

  return {
    ...fallbackPerson,
    ...report,

    _id:
      report?._id ||
      fallbackPerson?._id ||
      null,

    id:
      report?.reportNumber ||
      report?.id ||
      fallbackPerson?.id ||
      report?._id ||
      null,

    reportNumber:
      report?.reportNumber ||
      fallbackPerson?.reportNumber ||
      fallbackPerson?.id ||
      "",

    name:
      nestedPerson?.fullName ||
      report?.name ||
      fallbackPerson?.name ||
      "",

    nickname:
      nestedPerson?.nickname ||
      report?.nickname ||
      fallbackPerson?.nickname ||
      null,

    age:
      nestedPerson?.age ??
      report?.age ??
      fallbackPerson?.age ??
      null,

    gender:
      nestedPerson?.gender ||
      report?.gender ||
      fallbackPerson?.gender ||
      null,

    image:
      profileMedia?.secureUrl ||
      profileMedia?.url ||
      report?.image ||
      report?.photo ||
      fallbackPerson?.image ||
      fallbackPerson?.photo ||
      "",

    photo:
      profileMedia?.secureUrl ||
      profileMedia?.url ||
      report?.photo ||
      report?.image ||
      fallbackPerson?.photo ||
      fallbackPerson?.image ||
      "",

    description:
      nestedPerson?.publicDescription ||
      report?.description ||
      fallbackPerson?.description ||
      "",

    clothing:
      nestedPerson?.clothingDescription ||
      report?.clothing ||
      fallbackPerson?.clothing ||
      "",

    identifyingMarks:
      nestedPerson?.identifyingMarks ||
      report?.identifyingMarks ||
      fallbackPerson?.identifyingMarks ||
      "",

    lastSeenLocation: location,

    lastSeenDate: formatPublicDate(lastSeenDate),

    lastSeenDateRaw: lastSeenDate,

    status:
      report?.status ||
      fallbackPerson?.status ||
      "VERIFIED_MISSING",

    publicContactAllowed:
      report?.publicContactAllowed ?? false,

    publicContactNumber:
      report?.publicContactNumber || null,

    verifiedAt:
      report?.verifiedAt || null,

    publishedAt:
      report?.publishedAt || null,
  };
}

export default function MissingPersonDetailsPage() {
  const { id } = useParams();

  const fallback = useMemo(
    () =>
      missingPersons.find(
        (item) =>
          String(item.id) === String(id) ||
          String(item._id) === String(id),
      ) || null,
    [id],
  );

  const [person, setPerson] = useState(() =>
    fallback
      ? normalizeMissingPerson(fallback, fallback)
      : null,
  );

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initialSighting);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const { pick } = useLanguage();
  const maxSightingDate = toLocalDateInputValue();
  const maxSightingTime = values.date === maxSightingDate ? new Date().toTimeString().slice(0, 5) : undefined;

  useEffect(() => {
    let active = true;

    const loadPerson = async () => {
      setPageLoading(true);
      setPageError("");

      try {
        const fallbackResponse = fallback
          ? {
              data: fallback,
            }
          : undefined;

        const payload = await publicApi.missingPerson(
          id,
          fallbackResponse,
        );

        if (!active) return;

        const normalizedPerson =
          normalizeMissingPerson(payload, fallback);

        if (
          normalizedPerson?._id ||
          normalizedPerson?.id ||
          normalizedPerson?.name
        ) {
          setPerson(normalizedPerson);
        } else {
          setPerson(null);
          setPageError(
            pick(
              "The missing-person profile could not be found.",
              "নিখোঁজ ব্যক্তির প্রোফাইল পাওয়া যায়নি।",
            ),
          );
        }
      } catch (error) {
        if (!active) return;

        if (fallback) {
          setPerson(
            normalizeMissingPerson(fallback, fallback),
          );
        } else {
          setPerson(null);
          setPageError(
            error.message ||
              pick(
                "Unable to load the missing-person profile.",
                "নিখোঁজ ব্যক্তির প্রোফাইল লোড করা যায়নি।",
              ),
          );
        }
      } finally {
        if (active) {
          setPageLoading(false);
        }
      }
    };

    loadPerson();

    return () => {
      active = false;
    };
  }, [id, fallback, pick]);

  const personDatabaseId =
    person?._id || person?.id || id;

  const closeSightingModal = () => {
    if (loading) return;

    setOpen(false);
    setErrors({});
  };

  const updateSightingValue = (field, value) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }
  };

  const validateSighting = () => {
    const nextErrors = {};

    if (!values.date) {
      nextErrors.date = pick(
        "Select the sighting date.",
        "দেখার তারিখ নির্বাচন করুন।",
      );
    } else if (isFutureLocalDateTime(values.date, values.time)) {
      nextErrors.date = pick(
        "The sighting date and time cannot be in the future.",
        "দেখার তারিখ ও সময় ভবিষ্যতের হতে পারবে না।",
      );
    }

    if (!values.location.trim()) {
      nextErrors.location = pick(
        "Enter an approximate sighting location.",
        "আনুমানিক স্থান লিখুন।",
      );
    }

    if (values.details.trim().length < 15) {
      nextErrors.details = pick(
        "Add at least 15 characters of useful detail.",
        "অন্তত ১৫ অক্ষরের প্রয়োজনীয় বিবরণ দিন।",
      );
    }

    if (!values.contact.trim()) {
      nextErrors.contact = pick(
        "Provide a safe contact method for verification.",
        "যাচাইয়ের জন্য নিরাপদ যোগাযোগ দিন।",
      );
    }

    if (!values.consent) {
      nextErrors.consent = pick(
        "Consent is required.",
        "সম্মতি প্রয়োজন।",
      );
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const submitSighting = async (event) => {
    event.preventDefault();

    if (!validateSighting()) return;

    if (!personDatabaseId) {
      toast.error(
        pick(
          "The missing-person report ID is unavailable.",
          "নিখোঁজ ব্যক্তির রিপোর্ট আইডি পাওয়া যায়নি।",
        ),
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * Keep these frontend field names unchanged.
       * The backend should accept:
       * date, time, location, details, contact and consent.
       */
      const sightingPayload = {
        date: values.date,
        time: values.time || "",
        location: values.location.trim(),
        details: values.details.trim(),
        contact: values.contact.trim(),
        consent: values.consent,
      };

      await userApi.reportSighting(
        personDatabaseId,
        sightingPayload,
      );

      const storedSightings = storage.get(
        STORAGE_KEYS.sightings,
        [],
      );

      storage.set(STORAGE_KEYS.sightings, [
        ...storedSightings,
        {
          id: makeId("SIGHT"),
          personId: personDatabaseId,
          ...sightingPayload,
          status: "Pending verification",
        },
      ]);

      toast.success(
        pick(
          "Possible sighting submitted privately for administrator review.",
          "সম্ভাব্য দেখার তথ্য ব্যক্তিগতভাবে অ্যাডমিন পর্যালোচনার জন্য জমা হয়েছে।",
        ),
      );

      setOpen(false);
      setValues(initialSighting);
      setErrors({});
    } catch (error) {
      toast.error(
        error.message ||
          pick(
            "Unable to submit the possible sighting.",
            "সম্ভাব্য দেখার তথ্য জমা দেওয়া যায়নি।",
          ),
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading && !person) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-archive-rose" />

          <p className="mt-4 text-sm text-archive-muted">
            {pick(
              "Loading verified profile…",
              "যাচাইকৃত প্রোফাইল লোড হচ্ছে…",
            )}
          </p>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="page-shell min-h-screen pb-20 pt-36">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-archive-rose" />

          <h1 className="mt-5 font-display text-4xl font-semibold sm:text-5xl">
            {pick(
              "Profile not found",
              "প্রোফাইল পাওয়া যায়নি",
            )}
          </h1>

          <p className="mt-4 text-sm leading-6 text-archive-muted">
            {pageError ||
              pick(
                "This missing-person profile may not be public or may no longer be available.",
                "এই নিখোঁজ ব্যক্তির প্রোফাইলটি প্রকাশ্য নয় অথবা আর পাওয়া যাচ্ছে না।",
              )}
          </p>

          <Button
            to="/missing-persons"
            className="mt-6"
          >
            {pick(
              "Back to list",
              "তালিকায় ফিরুন",
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <article className="page-shell pb-20 pt-32">
        <Link
          to="/missing-persons"
          className="text-sm font-semibold text-archive-amber transition hover:text-white"
        >
          ←{" "}
          {pick(
            "Back to missing persons",
            "নিখোঁজ তালিকায় ফিরুন",
          )}
        </Link>

        <div className="mt-7 grid gap-9 lg:grid-cols-[.82fr_1.18fr]">
          <div>
            <ImageWithFallback
              src={person.image || person.photo}
              alt={pick(
                `Verified public profile for ${
                  person.name || "missing person"
                }`,
                `${
                  person.name || "নিখোঁজ ব্যক্তি"
                }-এর যাচাইকৃত প্রকাশ্য প্রোফাইল`,
              )}
              className="aspect-[4/3] overflow-hidden rounded-2xl border border-archive-rose/20 lg:aspect-[4/5]"
              imageClassName="h-full w-full object-cover"
            />

            {person.reportNumber && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
                <p className="text-xs uppercase tracking-[.14em] text-archive-muted">
                  {pick(
                    "Report number",
                    "রিপোর্ট নম্বর",
                  )}
                </p>

                <p className="mt-1 font-mono text-sm font-semibold text-archive-rose">
                  {person.reportNumber}
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow !text-archive-rose">
                {pick(
                  "Verified missing-person information",
                  "যাচাইকৃত নিখোঁজ ব্যক্তির তথ্য",
                )}
              </p>

              <StatusBadge
                status={
                  person.status || "VERIFIED_MISSING"
                }
              />
            </div>

            <h1 className="mt-4 font-display text-5xl font-semibold md:text-6xl">
              {person.name ||
                pick(
                  "Unknown person",
                  "অজ্ঞাত ব্যক্তি",
                )}
            </h1>

            {person.nickname && (
              <p className="mt-2 text-base text-archive-muted">
                {pick("Also known as", "অন্য নামে পরিচিত")}{" "}
                <span className="font-semibold text-white">
                  {person.nickname}
                </span>
              </p>
            )}

            <p className="mt-3 text-lg text-archive-muted">
              {pick("Age", "বয়স")}{" "}
              <span className="font-semibold text-white">
                {person.age ?? "—"}
              </span>
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="surface-card rounded-2xl p-5">
                <MapPin className="h-5 w-5 text-archive-rose" />

                <p className="mt-4 text-xs uppercase tracking-[.15em] text-archive-muted">
                  {pick(
                    "Last seen location",
                    "শেষ দেখা স্থান",
                  )}
                </p>

                <p className="mt-2 font-semibold">
                  {person.lastSeenLocation || "—"}
                </p>
              </div>

              <div className="surface-card rounded-2xl p-5">
                <CalendarDays className="h-5 w-5 text-archive-rose" />

                <p className="mt-4 text-xs uppercase tracking-[.15em] text-archive-muted">
                  {pick(
                    "Last seen date",
                    "শেষ দেখা তারিখ",
                  )}
                </p>

                <p className="mt-2 font-semibold">
                  {person.lastSeenDate || "—"}
                </p>
              </div>

              <div className="surface-card rounded-2xl p-5 sm:col-span-2">
                <Shirt className="h-5 w-5 text-archive-rose" />

                <p className="mt-4 text-xs uppercase tracking-[.15em] text-archive-muted">
                  {pick(
                    "Public identifying detail",
                    "প্রকাশ্য শনাক্তকারী বিবরণ",
                  )}
                </p>

                <p className="mt-2 font-semibold">
                  {person.clothing ||
                    person.identifyingMarks ||
                    "—"}
                </p>

                {person.clothing &&
                  person.identifyingMarks && (
                    <p className="mt-3 text-sm leading-6 text-archive-muted">
                      {person.identifyingMarks}
                    </p>
                  )}
              </div>
            </div>

            <p className="mt-7 leading-8 text-[#C6C2BC]">
              {person.description ||
                pick(
                  "No public description is available.",
                  "কোনো প্রকাশ্য বিবরণ পাওয়া যায়নি।",
                )}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="rose"
                size="lg"
                onClick={() => {
                  setErrors({});
                  setOpen(true);
                }}
              >
                <Eye className="h-4 w-4" />

                {pick(
                  "Report Possible Sighting",
                  "সম্ভাব্য দেখা রিপোর্ট করুন",
                )}
              </Button>

              <Button
                to="/missing-persons/report"
                variant="secondary"
                size="lg"
              >
                {pick(
                  "Report another missing person",
                  "অন্য নিখোঁজ ব্যক্তি রিপোর্ট করুন",
                )}
              </Button>
            </div>

            <div className="mt-6 flex gap-3 rounded-xl border border-archive-teal/20 bg-archive-teal/[0.06] p-4 text-sm leading-6 text-[#B9CFCB]">
              <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-archive-teal" />

              {pick(
                "Sighting reports, contact details and exact notes remain private until an authorised administrator reviews them.",
                "সম্ভাব্য দেখার রিপোর্ট, যোগাযোগ ও নির্দিষ্ট নোট অনুমোদিত অ্যাডমিন পর্যালোচনা না করা পর্যন্ত ব্যক্তিগত থাকে।",
              )}
            </div>
          </div>
        </div>
      </article>

      <Modal
        open={open}
        onClose={closeSightingModal}
        title={pick(
          "Report a possible sighting",
          "সম্ভাব্য দেখা রিপোর্ট করুন",
        )}
        description={pick(
          `Your report about ${
            person.name || "this person"
          } will remain private until reviewed.`,
          `${
            person.name || "এই ব্যক্তি"
          } সম্পর্কে আপনার রিপোর্ট পর্যালোচনা না হওয়া পর্যন্ত ব্যক্তিগত থাকবে।`,
        )}
      >
        {!isAuthenticated ? (
          <div className="text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-archive-teal" />

            <h3 className="mt-4 font-display text-3xl font-semibold">
              {pick(
                "Sign in to submit a protected report",
                "সুরক্ষিত রিপোর্ট জমা দিতে সাইন ইন করুন",
              )}
            </h3>

            <p className="mt-3 text-sm leading-6 text-archive-muted">
              {pick(
                "Authentication helps administrators follow up safely while keeping your contact details private.",
                "সাইন ইন নিরাপদ ফলোআপে সাহায্য করে এবং আপনার যোগাযোগ ব্যক্তিগত রাখে।",
              )}
            </p>

            <Button
              to="/login"
              className="mt-6"
              onClick={closeSightingModal}
            >
              {pick("Sign In", "সাইন ইন")}
            </Button>
          </div>
        ) : (
          <form
            onSubmit={submitSighting}
            className="space-y-5"
            noValidate
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label={pick(
                  "Date seen",
                  "দেখার তারিখ",
                )}
                id="sighting-date"
                error={errors.date}
                required
              >
                <input
                  id="sighting-date"
                  type="date"
                  className="field-control"
                  value={values.date}
                  max={maxSightingDate}
                  onChange={(event) =>
                    updateSightingValue(
                      "date",
                      event.target.value,
                    )
                  }
                />
              </FormField>

              <FormField
                label={pick(
                  "Approximate time",
                  "আনুমানিক সময়",
                )}
                id="sighting-time"
              >
                <input
                  id="sighting-time"
                  type="time"
                  className="field-control"
                  value={values.time}
                  max={maxSightingTime}
                  onChange={(event) =>
                    updateSightingValue(
                      "time",
                      event.target.value,
                    )
                  }
                />
              </FormField>
            </div>

            <FormField
              label={pick(
                "Approximate location",
                "আনুমানিক স্থান",
              )}
              id="sighting-location"
              error={errors.location}
              required
            >
              <input
                id="sighting-location"
                className="field-control"
                value={values.location}
                placeholder={pick(
                  "Area, landmark or nearby road",
                  "এলাকা, পরিচিত স্থান বা কাছের রাস্তা",
                )}
                onChange={(event) =>
                  updateSightingValue(
                    "location",
                    event.target.value,
                  )
                }
              />
            </FormField>

            <FormField
              label={pick(
                "What did you observe?",
                "আপনি কী দেখেছেন?",
              )}
              id="sighting-details"
              error={errors.details}
              required
            >
              <textarea
                id="sighting-details"
                rows="5"
                className="field-control resize-none"
                value={values.details}
                maxLength={1000}
                placeholder={pick(
                  "Describe appearance, direction of travel and any useful context.",
                  "চেহারা, চলার দিক এবং প্রয়োজনীয় অন্যান্য তথ্য লিখুন।",
                )}
                onChange={(event) =>
                  updateSightingValue(
                    "details",
                    event.target.value,
                  )
                }
              />

              <p className="mt-2 text-right text-xs text-archive-muted">
                {values.details.length}/1000
              </p>
            </FormField>

            <FormField
              label={pick(
                "Safe contact method",
                "নিরাপদ যোগাযোগ",
              )}
              id="sighting-contact"
              error={errors.contact}
              required
            >
              <input
                id="sighting-contact"
                className="field-control"
                value={values.contact}
                placeholder={pick(
                  "Phone number, email or another safe method",
                  "ফোন নম্বর, ইমেইল বা অন্য নিরাপদ মাধ্যম",
                )}
                onChange={(event) =>
                  updateSightingValue(
                    "contact",
                    event.target.value,
                  )
                }
              />
            </FormField>

            <div>
              <label className="flex items-start gap-3 text-sm leading-6 text-[#C6C2BC]">
                <input
                  type="checkbox"
                  checked={values.consent}
                  onChange={(event) =>
                    updateSightingValue(
                      "consent",
                      event.target.checked,
                    )
                  }
                  className="mt-1 h-4 w-4 accent-[#D79A54]"
                />

                <span>
                  {pick(
                    "I confirm this report is made in good faith and may be reviewed privately by authorised administrators.",
                    "আমি নিশ্চিত করছি রিপোর্টটি সৎ উদ্দেশ্যে করা এবং অনুমোদিত অ্যাডমিন ব্যক্তিগতভাবে পর্যালোচনা করতে পারেন।",
                  )}
                </span>
              </label>

              {errors.consent && (
                <p className="mt-2 text-sm text-red-300">
                  {errors.consent}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
              >
                {pick(
                  "Submit Private Sighting",
                  "ব্যক্তিগত দেখা-তথ্য জমা দিন",
                )}
              </Button>

              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={closeSightingModal}
              >
                {pick("Cancel", "বাতিল")}
              </Button>
            </div>

            <div className="flex gap-3 rounded-xl border border-archive-rose/20 bg-archive-rose/[0.06] p-4 text-sm text-[#CDB8BC]">
              <AlertTriangle className="h-5 w-5 shrink-0 text-archive-rose" />

              {pick(
                "Do not publish this information on social media before verification.",
                "যাচাইয়ের আগে এই তথ্য সামাজিক মাধ্যমে প্রকাশ করবেন না।",
              )}
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}