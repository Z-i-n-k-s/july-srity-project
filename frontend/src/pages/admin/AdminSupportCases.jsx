import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  FileText,
  Image as ImageIcon,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  Paperclip,
  PauseCircle,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi, unwrap } from "../../lib/api";
import StatusBadge from "../../components/ui/StatusBadge";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import useFilePreview from "../../hooks/useFilePreview";
import {
  applySupportRoomOverride,
  applySupportRoomOverrides,
  getSupportRoomId,
  hideSupportRoomForAdmin,
  isSupportRoomStopped,
  saveSupportRoomOverride,
} from "../../lib/supportRoomState";

const LIST_REFRESH_INTERVAL = 10000;
const MESSAGE_REFRESH_INTERVAL = 3000;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const BANGLADESH_TIME_ZONE = "Asia/Dhaka";
const EARLIEST_VALID_MESSAGE_TIME = Date.UTC(2024, 6, 1);
const MAX_FUTURE_DRIFT = 10 * 60 * 1000;

const extractCases = (payload) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.supportCases)) return data.supportCases;
  if (Array.isArray(data?.cases)) return data.cases;
  if (Array.isArray(data?.rooms)) return data.rooms;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const extractCase = (payload) => {
  const data = unwrap(payload);
  if (!data || typeof data !== "object") return null;
  return data.supportCase || data.caseData || data.case || data.room || data;
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const getMessages = (room) =>
  ensureArray(
    room?.messages ||
      room?.chatMessages ||
      room?.conversation ||
      room?.supportMessages,
  );

const messageText = (message) =>
  message?.text ||
  message?.content ||
  message?.body ||
  (typeof message?.message === "string" ? message.message : "");

const isAdminMessage = (message) =>
  String(
    message?.sender?.role ||
      message?.senderRole ||
      message?.role ||
      message?.sender ||
      "",
  )
    .toLowerCase()
    .includes("admin");

const messageName = (message) =>
  message?.sender?.name ||
  message?.senderName ||
  message?.name ||
  (isAdminMessage(message) ? "Support Admin" : "Requester");

const MONTH_INDEX = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const getObjectIdDate = (message) => {
  const id = String(message?.id || message?._id || "").trim();

  if (!/^[a-f\d]{24}$/i.test(id)) {
    return null;
  }

  const seconds = Number.parseInt(id.slice(0, 8), 16);
  const date = new Date(seconds * 1000);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getDhakaYear = (date = new Date()) => {
  const year = new Intl.DateTimeFormat("en", {
    timeZone: BANGLADESH_TIME_ZONE,
    year: "numeric",
  }).format(date);

  return Number(year);
};

const parseBackendDisplayTime = (rawValue, fallbackDate = null) => {
  if (typeof rawValue !== "string") {
    return null;
  }

  const value = rawValue.trim();
  const match = value.match(
    /^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i,
  );

  if (!match) {
    return null;
  }

  const month = MONTH_INDEX[match[1].slice(0, 3).toLowerCase()];
  const day = Number(match[2]);
  let hour = Number(match[3]);
  const minute = Number(match[4]);
  const second = Number(match[5] || 0);
  const meridiem = match[6].toUpperCase();

  if (
    !month ||
    day < 1 ||
    day > 31 ||
    hour < 1 ||
    hour > 12 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  if (hour === 12) hour = 0;
  if (meridiem === "PM") hour += 12;

  const year = getDhakaYear(fallbackDate || new Date());
  const monthText = String(month).padStart(2, "0");
  const dayText = String(day).padStart(2, "0");
  const hourText = String(hour).padStart(2, "0");
  const minuteText = String(minute).padStart(2, "0");
  const secondText = String(second).padStart(2, "0");

  // The backend's display string is already Bangladesh local time.
  const date = new Date(
    `${year}-${monthText}-${dayText}T${hourText}:${minuteText}:${secondText}+06:00`,
  );

  return Number.isNaN(date.getTime()) ? null : date;
};

const parseMessageDate = (rawValue, fallbackDate = null) => {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }

  const displayTime = parseBackendDisplayTime(rawValue, fallbackDate);
  if (displayTime) {
    return displayTime;
  }

  let date;

  if (rawValue instanceof Date) {
    date = new Date(rawValue.getTime());
  } else if (
    typeof rawValue === "number" ||
    /^\d{9,16}$/.test(String(rawValue).trim())
  ) {
    let numericValue = Number(rawValue);

    if (!Number.isFinite(numericValue)) return null;

    if (numericValue < 100000000000) numericValue *= 1000;
    if (numericValue > 100000000000000) numericValue /= 1000;

    date = new Date(numericValue);
  } else {
    const value = String(rawValue).trim();
    const normalisedValue = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(
      value,
    )
      ? `${value}Z`
      : value;

    date = new Date(normalisedValue);
  }

  if (Number.isNaN(date.getTime())) return null;

  const timestamp = date.getTime();
  const latestAllowed = Date.now() + MAX_FUTURE_DRIFT;

  if (timestamp < EARLIEST_VALID_MESSAGE_TIME || timestamp > latestAllowed) {
    return null;
  }

  return date;
};

const getMessageDate = (message) => {
  const objectIdDate = getObjectIdDate(message);
  const candidates = [
    message?.sentAt,
    message?.createdAt,
    message?.timestamp,
    message?.updatedAt,
  ];

  for (const candidate of candidates) {
    const parsed = parseMessageDate(candidate, objectIdDate);
    if (parsed) return parsed;
  }

  const backendDisplayTime = parseMessageDate(message?.time, objectIdDate);
  if (backendDisplayTime) return backendDisplayTime;

  // MongoDB ObjectIds contain their creation time in the first 8 hex digits.
  return objectIdDate;
};

const messageTime = (message) => {
  const date = getMessageDate(message);
  if (!date) return "Time unavailable";

  return new Intl.DateTimeFormat("en-BD", {
    timeZone: BANGLADESH_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const normaliseAttachment = (rawAttachment) => {
  if (!rawAttachment) return null;

  if (typeof rawAttachment === "string") {
    return {
      name: rawAttachment.split("/").pop() || "Attachment",
      type: "",
      size: 0,
      url: rawAttachment,
    };
  }

  if (typeof rawAttachment !== "object") return null;

  return {
    ...rawAttachment,
    name:
      rawAttachment.name ||
      rawAttachment.originalName ||
      rawAttachment.originalname ||
      rawAttachment.fileName ||
      rawAttachment.filename ||
      "Attachment",
    type:
      rawAttachment.type ||
      rawAttachment.mimeType ||
      rawAttachment.mimetype ||
      "",
    size: rawAttachment.size || rawAttachment.fileSize || 0,
    url:
      rawAttachment.url ||
      rawAttachment.secureUrl ||
      rawAttachment.secure_url ||
      rawAttachment.fileUrl ||
      rawAttachment.path ||
      "",
  };
};

const getAttachments = (message) => {
  if (!message) return [];

  const possibleArrays = [
    message.attachments,
    message.files,
    message.uploads,
    message.documents,
    message.message?.attachments,
  ];

  const arraySource = possibleArrays.find(Array.isArray) || [];
  const singularSources = [
    message.attachment,
    message.file,
    message.upload,
    message.document,
    message.attachmentName
      ? {
          name: message.attachmentName,
          type: message.attachmentType,
          size: message.attachmentSize,
          url: message.attachmentUrl || message.fileUrl,
        }
      : null,
  ];

  const seen = new Set();

  return [...arraySource, ...singularSources]
    .map(normaliseAttachment)
    .filter(Boolean)
    .filter((file) => {
      const signature = `${file.url || ""}|${file.name || ""}|${file.size || 0}`;
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
};

const isImageAttachment = (file) => {
  if (!file) return false;
  if (file.type?.startsWith("image/")) return true;
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif)$/i.test(
    file.name || file.url || "",
  );
};

const formatFileSize = (size = 0) => {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

function MessageAttachments({ message, pick }) {
  const attachments = getAttachments(message);

  if (!attachments.length) return null;

  return (
    <div className="mt-3 grid gap-2">
      {attachments.map((file, index) => {
        const image = isImageAttachment(file);
        const key = `${file.url || file.name}-${index}`;

        if (image && file.url) {
          return (
            <a
              key={key}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="focus-ring block overflow-hidden rounded-xl border border-white/10 bg-black/20"
            >
              <img
                src={file.url}
                alt={`${pick("Support attachment", "সহায়তা সংযুক্তি")}: ${file.name}`}
                className="max-h-72 w-full object-contain"
              />
              <span className="flex items-center justify-between gap-3 border-t border-white/10 px-3 py-2 text-xs text-archive-muted">
                <span className="truncate">{file.name}</span>
                {file.size > 0 && (
                  <span className="shrink-0">{formatFileSize(file.size)}</span>
                )}
              </span>
            </a>
          );
        }

        const content = (
          <>
            {image ? (
              <ImageIcon className="h-4 w-4 shrink-0 text-archive-amber" />
            ) : (
              <FileText className="h-4 w-4 shrink-0 text-archive-amber" />
            )}
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            {file.size > 0 && (
              <span className="shrink-0 text-[10px]">
                {formatFileSize(file.size)}
              </span>
            )}
          </>
        );

        return file.url ? (
          <a
            key={key}
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="focus-ring flex items-center gap-2 rounded-lg border border-white/10 bg-black/10 p-3 text-xs text-archive-muted transition hover:bg-white/[0.04]"
          >
            {content}
          </a>
        ) : (
          <div
            key={key}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/10 p-3 text-xs text-archive-muted"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminSupportCases() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [stopReason, setStopReason] = useState("");
  const [savingAction, setSavingAction] = useState(false);

  const messageListRef = useRef(null);
  const requestRef = useRef(false);
  const itemsRef = useRef([]);
  const fileInputRef = useRef(null);
  const createdObjectUrls = useRef([]);

  const { pick } = useLanguage();
  const toast = useToast();
  const attachmentPreview = useFilePreview(attachment);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      createdObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      createdObjectUrls.current = [];
    };
  }, []);

  const loadCases = async ({ silent = false } = {}) => {
    if (requestRef.current) return;
    requestRef.current = true;

    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const payload = await adminApi.supportCases();
      const next = applySupportRoomOverrides(extractCases(payload)).filter(
        (room) => !room.hiddenFromAdmin,
      );

      setItems(next);
      setSelectedId((current) => {
        const stillExists = next.some(
          (room) => String(getSupportRoomId(room)) === String(current),
        );
        return stillExists ? current : getSupportRoomId(next[0]) || "";
      });
    } catch (error) {
      console.error("Unable to load support rooms:", error);
      if (!silent) {
        toast.error(
          error?.message ||
            pick("Unable to load support rooms.", "সহায়তা কক্ষ লোড করা যায়নি।"),
        );
      }
    } finally {
      requestRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    void loadCases();

    const intervalId = window.setInterval(() => {
      if (active && document.visibilityState === "visible") {
        void loadCases({ silent: true });
      }
    }, LIST_REFRESH_INTERVAL);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedCase(null);
      return undefined;
    }

    let active = true;
    let working = false;

    const loadSelected = async ({ initial = false } = {}) => {
      if (working) return;
      working = true;
      if (initial) setLoadingChat(true);

      try {
        const payload = await adminApi.supportCase(selectedId);
        if (!active) return;

        const remote = extractCase(payload);
        if (remote) {
          setSelectedCase((current) =>
            applySupportRoomOverride({
              ...(current || {}),
              ...remote,
              id: remote.id || remote._id || selectedId,
            }),
          );
        }
      } catch (error) {
        console.error("Unable to refresh support conversation:", error);

        if (initial) {
          const listCase = itemsRef.current.find(
            (item) => String(getSupportRoomId(item)) === String(selectedId),
          );

          setSelectedCase(
            applySupportRoomOverride(
              listCase || { id: selectedId, title: "Support room" },
            ),
          );
        }
      } finally {
        working = false;
        if (active) setLoadingChat(false);
      }
    };

    void loadSelected({ initial: true });

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadSelected();
    }, MESSAGE_REFRESH_INTERVAL);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [selectedId]);

  const messages = getMessages(selectedCase);
  const roomStopped = isSupportRoomStopped(selectedCase);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;

    const frameId = window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [messages.length, selectedId]);

  const filtered = useMemo(() => {
    const searchValue = query.trim().toLowerCase();

    return items.filter((item) =>
      `${getSupportRoomId(item)} ${item.title || ""} ${item.requester || ""} ${item.category || ""} ${item.status || ""}`
        .toLowerCase()
        .includes(searchValue),
    );
  }, [items, query]);

  const mergeSelected = (values) => {
    setSelectedCase((current) =>
      applySupportRoomOverride({ ...(current || {}), ...values }),
    );

    setItems((current) =>
      current.map((item) =>
        String(getSupportRoomId(item)) === String(selectedId)
          ? applySupportRoomOverride({ ...item, ...values })
          : item,
      ),
    );
  };

  const changeFrontendStatus = (status) => {
    if (!selectedId) return;

    if (String(status).toLowerCase() === "stopped") {
      setStopReason("");
      setDialog({ type: "stop", room: selectedCase });
      return;
    }

    const values = {
      status,
      updatedAt: new Date().toISOString(),
    };

    saveSupportRoomOverride(selectedId, values);
    mergeSelected(values);

    toast.success(
      pick(
        `Room status changed to ${status}.`,
        `কক্ষের অবস্থা ${status} করা হয়েছে।`,
      ),
    );
  };

  const confirmStop = () => {
    if (stopReason.trim().length < 5) {
      toast.warning(
        pick(
          "Write a short closing reason for the user.",
          "ব্যবহারকারীর জন্য বন্ধ করার সংক্ষিপ্ত কারণ লিখুন।",
        ),
      );
      return;
    }

    setSavingAction(true);

    const now = new Date().toISOString();
    const values = {
      status: "Stopped",
      stoppedReason: stopReason.trim(),
      stoppedAt: now,
      updatedAt: now,
    };

    saveSupportRoomOverride(selectedId, values);
    mergeSelected(values);
    setSavingAction(false);
    setDialog(null);
    setStopReason("");

    toast.success(
      pick(
        "The room is now read-only for the user and admin in this frontend.",
        "এই ফ্রন্টএন্ডে কক্ষটি এখন ব্যবহারকারী ও অ্যাডমিন—উভয়ের জন্য শুধু পড়ার উপযোগী।",
      ),
    );
  };

  const confirmHide = () => {
    const id = getSupportRoomId(dialog?.room);
    if (!id) return;

    hideSupportRoomForAdmin(id);

    const remaining = items.filter(
      (item) => String(getSupportRoomId(item)) !== String(id),
    );

    setItems(remaining);

    if (String(selectedId) === String(id)) {
      setSelectedId(getSupportRoomId(remaining[0]) || "");
      setSelectedCase(null);
    }

    setDialog(null);

    toast.success(
      pick(
        "The room was removed from this admin view. The frontend action does not delete backend data.",
        "কক্ষটি এই অ্যাডমিন ভিউ থেকে সরানো হয়েছে। এই ফ্রন্টএন্ড কাজ ব্যাকএন্ড ডেটা মুছে দেয় না।",
      ),
    );
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectAttachment = (file) => {
    if (!file) {
      clearAttachment();
      return;
    }

    const allowed =
      file.type.startsWith("image/") || file.type === "application/pdf";

    if (!allowed) {
      toast.error(
        pick(
          "Choose an image or PDF file.",
          "ছবি বা PDF ফাইল নির্বাচন করুন।",
        ),
      );
      clearAttachment();
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error(
        pick(
          "The file must be 10 MB or smaller.",
          "ফাইলটি ১০ এমবি বা ছোট হতে হবে।",
        ),
      );
      clearAttachment();
      return;
    }

    setAttachment(file);
  };

  const sendReply = async (event) => {
    event.preventDefault();

    const text = message.trim();
    if ((!text && !attachment) || sending || roomStopped || !selectedId) return;

    setSending(true);

    try {
      const formData = new FormData();
      formData.append("message", text);
      if (attachment) formData.append("file", attachment);

      const response = await adminApi.sendSupportMessage(selectedId, formData);
      const data = unwrap(response);

      const remoteMessage =
        data?.supportMessage ||
        data?.newMessage ||
        data?.messageData ||
        (typeof data?.message === "object" ? data.message : null);

      const remoteAttachment = normaliseAttachment(
        remoteMessage?.attachment ||
          remoteMessage?.file ||
          data?.attachment ||
          response?.attachment ||
          response?.file ||
          (data?.fileUrl ? { url: data.fileUrl } : null),
      );

      let localUrl = "";
      if (attachment && !remoteAttachment?.url) {
        localUrl = URL.createObjectURL(attachment);
        createdObjectUrls.current.push(localUrl);
      }

      const finalAttachment = attachment
        ? {
            name: remoteAttachment?.name || attachment.name,
            type: remoteAttachment?.type || attachment.type,
            size: remoteAttachment?.size || attachment.size,
            url: remoteAttachment?.url || localUrl,
          }
        : remoteAttachment;

      const now = new Date().toISOString();
      const nextMessage = {
        ...(remoteMessage || {}),
        id: remoteMessage?.id || remoteMessage?._id || `admin-${Date.now()}`,
        sender: remoteMessage?.sender || remoteMessage?.senderRole || "admin",
        senderName:
          remoteMessage?.senderName || remoteMessage?.name || "Support Admin",
        text: messageText(remoteMessage) || text,
        createdAt: remoteMessage?.createdAt || remoteMessage?.sentAt || now,
        attachment:
          remoteMessage?.attachment || remoteMessage?.file || finalAttachment,
      };

      setSelectedCase((current) => ({
        ...(current || {}),
        messages: [...getMessages(current), nextMessage],
        updatedAt: now,
      }));

      setItems((current) =>
        current.map((item) =>
          String(getSupportRoomId(item)) === String(selectedId)
            ? { ...item, updatedAt: now, messages: [...getMessages(item), nextMessage] }
            : item,
        ),
      );

      setMessage("");
      clearAttachment();
    } catch (error) {
      toast.error(
        error?.message ||
          pick("The reply could not be sent.", "উত্তর পাঠানো যায়নি।"),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="admin-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">
              {pick("Private support administration", "ব্যক্তিগত সহায়তা প্রশাসন")}
            </p>
            <h2 className="mt-2 font-display text-4xl font-semibold">
              {pick(
                "Messenger-style support workspace",
                "মেসেঞ্জারধর্মী সহায়তা কর্মক্ষেত্র",
              )}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-archive-muted">
              {pick(
                "Rooms stay in the left sidebar, the selected conversation stays open, and the message composer remains attached to the bottom.",
                "কক্ষগুলো বাম পাশের তালিকায় থাকে, নির্বাচিত কথোপকথন খোলা থাকে এবং বার্তা লেখার অংশ নিচে স্থির থাকে।",
              )}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-archive-teal/20 bg-archive-teal/[0.07] p-4 text-xs text-[#B9CFCB]">
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-archive-teal" />
            )}
            {pick("Live polling active", "লাইভ পোলিং সক্রিয়")}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D111A] shadow-2xl">
        <div className="grid h-[calc(100dvh-8rem)] min-h-[620px] max-h-[920px] grid-rows-[210px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)] lg:grid-rows-1">
          <aside className="flex min-h-0 flex-col border-b border-white/[0.08] lg:border-b-0 lg:border-r">
            <div className="shrink-0 border-b border-white/[0.08] p-4">
              <label className="relative block">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-archive-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="field-control pl-11"
                  placeholder={pick("Search rooms or people", "কক্ষ বা ব্যক্তি খুঁজুন")}
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              {loading ? (
                <div className="grid min-h-32 place-items-center">
                  <Loader2 className="h-7 w-7 animate-spin text-archive-teal" />
                </div>
              ) : filtered.length ? (
                filtered.map((room) => {
                  const id = getSupportRoomId(room);
                  const active = String(id) === String(selectedId);
                  const lastMessage = getMessages(room).at(-1);

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedId(id)}
                      className={`focus-ring mb-1 flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
                        active
                          ? "border border-archive-teal/25 bg-archive-teal/[0.09]"
                          : "border border-transparent hover:bg-white/[0.04]"
                      }`}
                    >
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                          active
                            ? "bg-archive-teal text-ink-950"
                            : "bg-white/[0.06] text-archive-teal"
                        }`}
                      >
                        <UserRound className="h-5 w-5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="truncate font-semibold text-white">
                            {room.title || pick("Support room", "সহায়তা কক্ষ")}
                          </span>
                          <span className="shrink-0 text-[10px] text-archive-muted">
                            {lastMessage ? messageTime(lastMessage) : ""}
                          </span>
                        </span>

                        <span className="mt-1 block truncate text-xs text-archive-muted">
                          {room.requester || id}
                        </span>

                        <span className="mt-2 flex items-center justify-between gap-2">
                          <StatusBadge status={room.status || "Under review"} />
                          <span className="min-w-0 flex-1 truncate text-right text-[10px] text-archive-muted">
                            {messageText(lastMessage) ||
                              (getAttachments(lastMessage).length
                                ? pick("Attachment", "সংযুক্তি")
                                : room.category || "")}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="p-8 text-center text-sm text-archive-muted">
                  {pick("No support rooms found.", "কোনো সহায়তা কক্ষ পাওয়া যায়নি।")}
                </p>
              )}
            </div>
          </aside>

          <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            {!selectedId ? (
              <div className="grid min-h-0 flex-1 place-items-center p-8 text-center">
                <div>
                  <MessageSquareText className="mx-auto h-12 w-12 text-archive-teal" />
                  <h3 className="mt-4 font-display text-3xl font-semibold">
                    {pick("Select a support room", "একটি সহায়তা কক্ষ নির্বাচন করুন")}
                  </h3>
                </div>
              </div>
            ) : loadingChat && !selectedCase ? (
              <div className="grid min-h-0 flex-1 place-items-center">
                <Loader2 className="h-8 w-8 animate-spin text-archive-teal" />
              </div>
            ) : (
              <>
                <header className="shrink-0 border-b border-white/[0.08] p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-archive-teal/10 text-archive-teal">
                        <UserRound className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-xl font-semibold text-white sm:text-2xl">
                          {selectedCase?.title || pick("Support room", "সহায়তা কক্ষ")}
                        </h3>
                        <p className="truncate text-xs text-archive-muted">
                          {selectedCase?.requester || selectedId} •{" "}
                          {selectedCase?.assignedAdmin || pick("Unassigned", "দায়িত্বহীন")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedCase?.status || "Under review"}
                        onChange={(event) => changeFrontendStatus(event.target.value)}
                        className="field-control h-10 min-w-40 flex-1 py-1 text-xs sm:flex-none"
                      >
                        <option>Under review</option>
                        <option>In progress</option>
                        <option>Information required</option>
                        <option>Completed</option>
                        <option>Stopped</option>
                      </select>

                      <Link
                        to={`/admin-panel/support-cases/${selectedId}`}
                        className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-semibold text-[#C6C2BC]"
                      >
                        {pick("Full case", "সম্পূর্ণ কেস")}
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDialog({ type: "hide", room: selectedCase })}
                        className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-archive-rose/20 bg-archive-rose/[0.07] text-archive-rose"
                        aria-label={pick(
                          "Remove from admin view",
                          "অ্যাডমিন ভিউ থেকে সরান",
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </header>

                {roomStopped && (
                  <div className="shrink-0 border-b border-archive-rose/20 bg-archive-rose/[0.06] px-5 py-3 text-sm text-[#DAB8BE]">
                    <PauseCircle className="mr-2 inline h-4 w-4 text-archive-rose" />
                    {selectedCase?.stoppedReason ||
                      pick(
                        "This conversation is stopped and remains visible as read-only.",
                        "এই কথোপকথন বন্ধ এবং শুধু পড়ার জন্য দৃশ্যমান থাকবে।",
                      )}
                  </div>
                )}

                <div
                  ref={messageListRef}
                  className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_top,rgba(75,155,141,.06),transparent_35%)] p-4 sm:p-6"
                >
                  {messages.length ? (
                    messages.map((item, index) => {
                      const adminMessage = isAdminMessage(item);

                      return (
                        <div
                          key={item.id || item._id || `${index}-${messageTime(item)}`}
                          className={`flex ${
                            adminMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[92%] rounded-2xl border p-3 sm:max-w-[86%] sm:p-4 ${
                              adminMessage
                                ? "rounded-br-sm border-archive-amber/20 bg-archive-amber/[0.09]"
                                : "rounded-bl-sm border-white/10 bg-white/[0.045]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-5">
                              <p
                                className={`text-xs font-semibold ${
                                  adminMessage
                                    ? "text-archive-amber"
                                    : "text-archive-teal"
                                }`}
                              >
                                {messageName(item)}
                              </p>
                              <span className="text-[10px] text-archive-muted">
                                {messageTime(item)}
                              </span>
                            </div>

                            {messageText(item) && (
                              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#E0DBD3]">
                                {messageText(item)}
                              </p>
                            )}

                            <MessageAttachments message={item} pick={pick} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid min-h-full place-items-center text-center text-sm text-archive-muted">
                      {pick("No messages yet.", "এখনও কোনো বার্তা নেই।")}
                    </div>
                  )}
                </div>

                <form
                  onSubmit={sendReply}
                  className="sticky bottom-0 z-20 shrink-0 border-t border-white/[0.08] bg-[#0D111A]/98 p-3 shadow-[0_-18px_35px_rgba(0,0,0,.28)] backdrop-blur-xl sm:p-4"
                >
                  {roomStopped ? (
                    <div className="rounded-xl border border-archive-rose/20 bg-archive-rose/[0.06] p-4 text-center text-sm text-[#DAB8BE]">
                      <LockKeyhole className="mr-2 inline h-4 w-4" />
                      {pick(
                        "Messaging is disabled because the room was stopped.",
                        "কক্ষটি বন্ধ হওয়ায় বার্তা পাঠানো নিষ্ক্রিয়।",
                      )}
                    </div>
                  ) : (
                    <>
                      {attachment && (
                        <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                          {attachmentPreview ? (
                            <div className="relative p-2">
                              <img
                                src={attachmentPreview}
                                alt={attachment.name}
                                className="mx-auto max-h-40 w-full rounded-lg object-contain"
                              />
                              <button
                                type="button"
                                onClick={clearAttachment}
                                className="focus-ring absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/75 text-white"
                                aria-label={pick(
                                  "Remove attachment",
                                  "সংযুক্তি সরান",
                                )}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-3">
                              <FileText className="h-5 w-5 shrink-0 text-archive-amber" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-white">
                                  {attachment.name}
                                </p>
                                <p className="mt-1 text-[10px] text-archive-muted">
                                  {formatFileSize(attachment.size)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={clearAttachment}
                                className="focus-ring p-2 text-archive-rose"
                                aria-label={pick(
                                  "Remove attachment",
                                  "সংযুক্তি সরান",
                                )}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-end gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="focus-ring grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-[#C6C2BC] transition hover:border-archive-amber/30 hover:text-white"
                          aria-label={pick("Attach file", "ফাইল সংযুক্ত করুন")}
                        >
                          <Paperclip className="h-5 w-5" />
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(event) => {
                            selectAttachment(event.target.files?.[0] || null);
                          }}
                        />

                        <textarea
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" &&
                              !event.shiftKey &&
                              !event.nativeEvent.isComposing
                            ) {
                              event.preventDefault();
                              event.currentTarget.form?.requestSubmit();
                            }
                          }}
                          rows={2}
                          className="field-control max-h-32 min-h-12 flex-1 resize-none"
                          placeholder={pick("Write a message…", "বার্তা লিখুন…")}
                        />

                        <button
                          type="submit"
                          disabled={sending || (!message.trim() && !attachment)}
                          className="focus-ring inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-4 text-sm font-semibold text-ink-950 disabled:opacity-40 sm:px-5"
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">
                            {pick("Send", "পাঠান")}
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </>
            )}
          </main>
        </div>
      </section>

      {dialog && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !savingAction && setDialog(null)}
            aria-label="Close"
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-ink-800 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 p-5">
              <div>
                <p className="eyebrow">
                  {dialog.type === "stop"
                    ? pick("Close conversation", "কথোপকথন বন্ধ")
                    : pick("Frontend removal", "ফ্রন্টএন্ড থেকে সরানো")}
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold">
                  {dialog.type === "stop"
                    ? pick(
                        "Stop this support room?",
                        "এই সহায়তা কক্ষ বন্ধ করবেন?",
                      )
                    : pick(
                        "Remove this room from admin view?",
                        "অ্যাডমিন ভিউ থেকে কক্ষটি সরাবেন?",
                      )}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setDialog(null)}
                className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {dialog.type === "stop" ? (
                <>
                  <p className="text-sm leading-7 text-archive-muted">
                    {pick(
                      "The user will see the updated Stopped status and the reason. Previous messages remain visible, but the composer is disabled.",
                      "ব্যবহারকারী হালনাগাদ ‘Stopped’ অবস্থা ও কারণ দেখবেন। আগের বার্তা দৃশ্যমান থাকবে, কিন্তু বার্তা লেখার অংশ নিষ্ক্রিয় হবে।",
                    )}
                  </p>

                  <label className="mt-5 block">
                    <span className="field-label">
                      {pick(
                        "Reason shown to the user",
                        "ব্যবহারকারীকে দেখানো কারণ",
                      )}
                    </span>
                    <textarea
                      value={stopReason}
                      onChange={(event) =>
                        setStopReason(event.target.value.slice(0, 500))
                      }
                      rows={4}
                      className="field-control resize-none"
                      placeholder={pick(
                        "The conversation has been completed…",
                        "কথোপকথনটি সম্পন্ন হয়েছে…",
                      )}
                    />
                    <p className="mt-2 text-right text-xs text-archive-muted">
                      {stopReason.length}/500
                    </p>
                  </label>
                </>
              ) : (
                <div className="flex gap-3 rounded-xl border border-archive-rose/20 bg-archive-rose/[0.06] p-4">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-archive-rose" />
                  <p className="text-sm leading-7 text-[#DAB8BE]">
                    {pick(
                      "This only hides the room in this browser's admin view. It does not delete backend data or the user's history.",
                      "এটি শুধু এই ব্রাউজারের অ্যাডমিন ভিউতে কক্ষটি লুকায়। ব্যাকএন্ড ডেটা বা ব্যবহারকারীর ইতিহাস মুছে দেয় না।",
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 p-5">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="focus-ring rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold"
              >
                {pick("Cancel", "বাতিল")}
              </button>

              <button
                type="button"
                onClick={dialog.type === "stop" ? confirmStop : confirmHide}
                disabled={
                  savingAction ||
                  (dialog.type === "stop" && stopReason.trim().length < 5)
                }
                className={`focus-ring inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40 ${
                  dialog.type === "stop"
                    ? "bg-archive-amber text-ink-950"
                    : "bg-archive-rose text-white"
                }`}
              >
                {savingAction ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : dialog.type === "stop" ? (
                  <PauseCircle className="h-4 w-4" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {dialog.type === "stop"
                  ? pick("Stop room", "কক্ষ বন্ধ করুন")
                  : pick("Remove from view", "ভিউ থেকে সরান")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}