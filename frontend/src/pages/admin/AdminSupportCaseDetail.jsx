import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  Loader2,
  LockKeyhole,
  Paperclip,
  PauseCircle,
  Send,
  ShieldAlert,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { adminApi, unwrap } from "../../lib/api";
import AdminFilePreview from "../../components/admin/AdminFilePreview";
import StatusBadge from "../../components/ui/StatusBadge";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import useFilePreview from "../../hooks/useFilePreview";
import {
  applySupportRoomOverride,
  isSupportRoomStopped,
  saveSupportRoomOverride,
  SUPPORT_ROOM_EVENT,
} from "../../lib/supportRoomState";

const MESSAGE_REFRESH_INTERVAL = 2500;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const BANGLADESH_TIME_ZONE = "Asia/Dhaka";
const EARLIEST_VALID_MESSAGE_TIME = Date.UTC(2024, 6, 1);
const MAX_FUTURE_DRIFT = 10 * 60 * 1000;

const getSupportCaseFromPayload = (payload) => {
  const data = unwrap(payload);

  if (!data || typeof data !== "object") {
    return null;
  }

  return data.supportCase || data.caseData || data.case || data.room || data;
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const getMessages = (supportCase) =>
  ensureArray(
    supportCase?.messages ||
      supportCase?.chatMessages ||
      supportCase?.conversation ||
      supportCase?.supportMessages,
  );

const getMessageText = (message) =>
  message?.text ||
  message?.content ||
  message?.body ||
  (typeof message?.message === "string" ? message.message : "");

const isAdminMessage = (message) => {
  const sender = String(
    message?.sender?.role ||
      message?.senderRole ||
      message?.role ||
      message?.sender ||
      "",
  ).toLowerCase();

  return (
    sender === "admin" ||
    sender === "administrator" ||
    sender === "support_admin" ||
    sender === "support-admin" ||
    sender.includes("admin")
  );
};

const getMessageName = (message) =>
  message?.sender?.name ||
  message?.name ||
  message?.senderName ||
  message?.authorName ||
  (isAdminMessage(message) ? "Support Admin" : "Requester");

const parseMessageDate = (rawValue) => {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
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
    const normalisedValue =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value)
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
  const candidates = [
    message?.sentAt,
    message?.createdAt,
    message?.timestamp,
    message?.updatedAt,
    message?.time,
  ];

  for (const candidate of candidates) {
    const parsed = parseMessageDate(candidate);
    if (parsed) return parsed;
  }

  return null;
};

const getMessageTime = (message) => {
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

const mergeSupportCase = (currentCase, incomingCase) => {
  currentCase = currentCase || {};

  if (!incomingCase || typeof incomingCase !== "object") {
    return currentCase;
  }

  const incomingMessages =
    incomingCase.messages ||
    incomingCase.chatMessages ||
    incomingCase.conversation ||
    incomingCase.supportMessages;

  const incomingDocuments =
    incomingCase.documents || incomingCase.medicalDocuments;

  const incomingProgress =
    incomingCase.progress ||
    incomingCase.progressSteps ||
    incomingCase.timeline;

  return {
    ...currentCase,
    ...incomingCase,
    id: incomingCase.id || incomingCase._id || currentCase.id,
    messages: Array.isArray(incomingMessages)
      ? incomingMessages
      : getMessages(currentCase),
    documents: Array.isArray(incomingDocuments)
      ? incomingDocuments
      : ensureArray(currentCase.documents),
    progress: Array.isArray(incomingProgress)
      ? incomingProgress
      : ensureArray(currentCase.progress),
  };
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
                className="max-h-80 w-full object-contain"
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
            <div className="min-w-0 flex-1">
              <p className="truncate text-[#DDD7CE]">{file.name}</p>
              {file.size > 0 && (
                <p className="mt-0.5 text-[10px] text-archive-muted">
                  {formatFileSize(file.size)}
                </p>
              )}
            </div>
          </>
        );

        return file.url ? (
          <a
            key={key}
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="focus-ring flex items-center gap-3 rounded-lg border border-white/10 bg-black/10 p-3 text-xs transition hover:bg-white/[0.04]"
          >
            {content}
          </a>
        ) : (
          <div
            key={key}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/10 p-3 text-xs"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminSupportCaseDetail() {
  const { caseId } = useParams();

  const [caseData, setCaseData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [stopReason, setStopReason] = useState("");
  const [savingAction, setSavingAction] = useState(false);

  const messageListRef = useRef(null);
  const replyFormRef = useRef(null);
  const fileInputRef = useRef(null);
  const createdObjectUrls = useRef([]);

  const toast = useToast();
  const { pick } = useLanguage();
  const attachmentPreview = useFilePreview(attachment);

  const documents = ensureArray(caseData?.documents);
  const progressSteps = ensureArray(caseData?.progress);
  const messages = getMessages(caseData);
  const roomStopped = isSupportRoomStopped(caseData);

  useEffect(() => {
    let active = true;
    let requestInProgress = false;

    const loadSupportCase = async ({
      initial = false,
      showError = false,
    } = {}) => {
      if (requestInProgress || !caseId) return;

      requestInProgress = true;
      if (!initial && active) setRefreshing(true);

      try {
        const payload = await adminApi.supportCase(caseId);
        if (!active) return;

        const incomingCase = getSupportCaseFromPayload(payload);

        if (!incomingCase) {
          if (initial) {
            setLoadError(
              pick(
                "The support case could not be found.",
                "সহায়তা কেসটি পাওয়া যায়নি।",
              ),
            );
          }
          return;
        }

        if (initial) setLoadError("");

        setCaseData((current) =>
          applySupportRoomOverride(mergeSupportCase(current, incomingCase)),
        );
      } catch (error) {
        if (!active) return;

        console.error("Unable to refresh support case:", error);

        if (initial) {
          setLoadError(
            error?.message ||
              pick(
                "Unable to load the support room.",
                "সহায়তা কক্ষ লোড করা যায়নি।",
              ),
          );
        }

        if (showError) {
          toast.error(
            error?.message ||
              pick(
                "Unable to load the support room.",
                "সহায়তা কক্ষ লোড করা যায়নি।",
              ),
          );
        }
      } finally {
        requestInProgress = false;

        if (active) {
          setRefreshing(false);
          if (initial) setInitialLoading(false);
        }
      }
    };

    void loadSupportCase({ initial: true, showError: true });

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadSupportCase();
    }, MESSAGE_REFRESH_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void loadSupportCase();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  useEffect(() => {
    const handleRoomOverride = () => {
      setCaseData((current) =>
        current ? applySupportRoomOverride(current) : current,
      );
    };

    window.addEventListener(SUPPORT_ROOM_EVENT, handleRoomOverride);
    return () =>
      window.removeEventListener(SUPPORT_ROOM_EVENT, handleRoomOverride);
  }, []);

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
  }, [messages.length]);

  useEffect(() => {
    return () => {
      createdObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      createdObjectUrls.current = [];
    };
  }, []);

  const updateFrontendStatus = (status) => {
    if (!caseData?.id && !caseId) return;

    if (String(status).toLowerCase() === "stopped") {
      setStopReason("");
      setStopDialogOpen(true);
      return;
    }

    const now = new Date().toISOString();
    const roomId = caseData?.id || caseId;
    const values = { status, updatedAt: now };

    saveSupportRoomOverride(roomId, values);
    setCaseData((current) =>
      applySupportRoomOverride({ ...(current || {}), ...values }),
    );

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
    const roomId = caseData?.id || caseId;
    const values = {
      status: "Stopped",
      stoppedReason: stopReason.trim(),
      stoppedAt: now,
      updatedAt: now,
    };

    saveSupportRoomOverride(roomId, values);
    setCaseData((current) =>
      applySupportRoomOverride({ ...(current || {}), ...values }),
    );

    setSavingAction(false);
    setStopDialogOpen(false);
    setStopReason("");

    toast.success(
      pick(
        "The room is now read-only for the user and admin in this frontend.",
        "এই ফ্রন্টএন্ডে কক্ষটি এখন ব্যবহারকারী ও অ্যাডমিন—উভয়ের জন্য শুধু পড়ার উপযোগী।",
      ),
    );
  };

  const verifyDocument = async (document, status) => {
    try {
      const documentId = document.id || document._id;

      if (!documentId) {
        throw new Error(
          pick(
            "The document identifier is missing.",
            "নথির শনাক্তকারী পাওয়া যায়নি।",
          ),
        );
      }

      await adminApi.verifyMedicalDocument(caseData.id || caseId, documentId, {
        status,
        note:
          status === "Verified"
            ? "Document reviewed by authorised admin."
            : "Document is unclear or not relevant to the request.",
      });

      setCaseData((current) => ({
        ...current,
        documents: ensureArray(current.documents).map((item) => {
          const itemId = item.id || item._id;
          return String(itemId) === String(documentId)
            ? { ...item, status }
            : item;
        }),
      }));

      toast.success(
        status === "Verified"
          ? pick("Document verified.", "নথিটি যাচাই করা হয়েছে।")
          : pick("Document rejected.", "নথিটি প্রত্যাখ্যান করা হয়েছে।"),
      );
    } catch (error) {
      toast.error(
        error?.message ||
          pick(
            "The document status could not be updated.",
            "নথির অবস্থা পরিবর্তন করা যায়নি।",
          ),
      );
    }
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
        pick("Choose an image or PDF file.", "ছবি বা PDF ফাইল নির্বাচন করুন।"),
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

    const trimmedMessage = message.trim();

    if (roomStopped) {
      toast.warning(
        pick(
          "This support room has been stopped.",
          "এই সহায়তা কক্ষটি বন্ধ করা হয়েছে।",
        ),
      );
      return;
    }

    if ((!trimmedMessage && !attachment) || sending) {
      return;
    }

    const sentLocallyAt = new Date().toISOString();
    setSending(true);

    try {
      const formData = new FormData();
      formData.append("message", trimmedMessage);

      if (attachment) {
        formData.append("file", attachment);
      }

      const response = await adminApi.sendSupportMessage(
        caseData.id || caseId,
        formData,
      );

      const responseData = unwrap(response);

      const remoteMessage =
        responseData?.supportMessage ||
        responseData?.newMessage ||
        responseData?.messageData ||
        (typeof responseData?.message === "object"
          ? responseData.message
          : null);

      const remoteAttachment = normaliseAttachment(
        remoteMessage?.attachment ||
          remoteMessage?.file ||
          responseData?.attachment ||
          response?.data?.attachment ||
          response?.attachment ||
          response?.file ||
          (responseData?.fileUrl ? { url: responseData.fileUrl } : null),
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

      const remoteRawTimestamp =
        remoteMessage?.sentAt ||
        remoteMessage?.createdAt ||
        remoteMessage?.timestamp ||
        remoteMessage?.updatedAt;

      const parsedRemoteTimestamp = parseMessageDate(remoteRawTimestamp);

      const validatedTimestamp = parsedRemoteTimestamp
        ? parsedRemoteTimestamp.toISOString()
        : sentLocallyAt;

      const nextMessage = {
        ...(remoteMessage || {}),
        id: remoteMessage?.id || remoteMessage?._id || `admin-${Date.now()}`,
        sender: remoteMessage?.sender || remoteMessage?.senderRole || "admin",
        name:
          remoteMessage?.name || remoteMessage?.senderName || "Support Admin",
        text: getMessageText(remoteMessage) || trimmedMessage,
        sentAt: validatedTimestamp,
        createdAt: validatedTimestamp,
        optimistic: true,
        attachment:
          remoteMessage?.attachment || remoteMessage?.file || finalAttachment,
      };

      setCaseData((current) => ({
        ...current,
        messages: [...getMessages(current), nextMessage],
        updatedAt: sentLocallyAt,
      }));

      setMessage("");
      clearAttachment();
    } catch (error) {
      console.error("Unable to send support reply:", error);

      toast.error(
        error?.message ||
          pick("The reply could not be sent.", "উত্তর পাঠানো যায়নি।"),
      );
    } finally {
      setSending(false);
    }
  };

  const handleMessageKeyDown = (event) => {
    const composing = event.nativeEvent?.isComposing || event.isComposing;

    if (event.key !== "Enter" || event.shiftKey || composing || event.repeat) {
      return;
    }

    event.preventDefault();

    if (sending || (!message.trim() && !attachment)) {
      return;
    }

    replyFormRef.current?.requestSubmit();
  };

  if (initialLoading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-archive-teal" />
          <p className="mt-4 text-sm text-archive-muted">
            {pick("Loading support case…", "সহায়তা কেস লোড হচ্ছে…")}
          </p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="space-y-6">
        <Link
          to="/admin-panel/support-cases"
          className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-archive-amber"
        >
          <ArrowLeft className="h-4 w-4" />
          {pick("Back to support cases", "সহায়তা কেসে ফিরুন")}
        </Link>

        <section className="admin-card text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-archive-rose" />
          <h2 className="mt-4 font-display text-3xl font-semibold">
            {pick("Support case unavailable", "সহায়তা কেস পাওয়া যাচ্ছে না")}
          </h2>
          <p className="mt-3 text-sm text-archive-muted">
            {loadError ||
              pick(
                "No case data was returned by the backend.",
                "ব্যাকএন্ড থেকে কোনো কেস তথ্য পাওয়া যায়নি।",
              )}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin-panel/support-cases"
        className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-archive-amber"
      >
        <ArrowLeft className="h-4 w-4" />
        {pick("Back to support cases", "সহায়তা কেসে ফিরুন")}
      </Link>

      <section className="admin-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="eyebrow">{caseData.id || caseId}</p>
            <h2 className="mt-2 font-display text-4xl font-semibold">
              {caseData.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-archive-muted">
              {caseData.summary}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={caseData.status} />

              <span
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  caseData.priority === "Urgent"
                    ? "border-archive-rose/25 bg-archive-rose/10 text-archive-rose"
                    : "border-white/10 text-archive-muted"
                }`}
              >
                {caseData.priority}
              </span>

              <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-archive-muted">
                {caseData.category}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-archive-teal/15 bg-archive-teal/[0.05] px-2.5 py-1 text-xs text-archive-teal">
                {refreshing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-archive-teal" />
                )}
                {refreshing
                  ? pick("Checking messages", "বার্তা দেখা হচ্ছে")
                  : pick("Live updates on", "স্বয়ংক্রিয় হালনাগাদ চালু")}
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
            <div className="rounded-xl border border-archive-teal/20 bg-archive-teal/[0.07] p-4 text-xs leading-5 text-[#B9CFCB]">
              <LockKeyhole className="mr-2 inline h-4 w-4" />
              {pick(
                "Private room: requester and authorised admins only",
                "ব্যক্তিগত কক্ষ: কেবল অনুরোধকারী ও অনুমোদিত অ্যাডমিন",
              )}
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
              <select
                value={caseData.status || "Under review"}
                onChange={(event) => updateFrontendStatus(event.target.value)}
                className="field-control h-10 min-w-44 flex-1 py-1 text-xs lg:flex-none"
              >
                <option>Under review</option>
                <option>In progress</option>
                <option>Information required</option>
                <option>Completed</option>
                <option>Stopped</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setStopReason("");
                  setStopDialogOpen(true);
                }}
                disabled={roomStopped}
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-archive-rose/25 bg-archive-rose/[0.08] px-4 text-xs font-semibold text-archive-rose disabled:cursor-not-allowed disabled:opacity-45"
              >
                <PauseCircle className="h-4 w-4" />
                {roomStopped
                  ? pick("Room stopped", "কক্ষ বন্ধ")
                  : pick("Stop room", "কক্ষ বন্ধ করুন")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-6">
          <section className="admin-card">
            <h3 className="font-display text-3xl font-semibold">
              {pick("Case information", "কেসের তথ্য")}
            </h3>

            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[.12em] text-archive-muted">
                  {pick("Requester", "অনুরোধকারী")}
                </dt>
                <dd className="mt-1 text-white">{caseData.requester}</dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-[.12em] text-archive-muted">
                  {pick("Assigned admin", "দায়িত্বপ্রাপ্ত অ্যাডমিন")}
                </dt>
                <dd className="mt-1 text-white">{caseData.assignedAdmin}</dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-[.12em] text-archive-muted">
                  {pick("Approximate location", "আনুমানিক স্থান")}
                </dt>
                <dd className="mt-1 text-white">{caseData.location}</dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-[.12em] text-archive-muted">
                  {pick("Hospital", "হাসপাতাল")}
                </dt>
                <dd className="mt-1 text-white">{caseData.hospital}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">
                  {pick("Sensitive documents", "সংবেদনশীল নথি")}
                </p>
                <h3 className="mt-2 font-display text-3xl font-semibold">
                  {pick("Medical-document verification", "চিকিৎসা নথি যাচাই")}
                </h3>
              </div>

              <FileCheck2 className="h-6 w-6 text-archive-teal" />
            </div>

            <p className="mt-3 text-sm leading-6 text-archive-muted">
              {pick(
                "Verify only relevance and readability for this support request. Do not diagnose, alter or publish medical information.",
                "এই সহায়তা অনুরোধের জন্য কেবল প্রাসঙ্গিকতা ও পাঠযোগ্যতা যাচাই করুন। চিকিৎসা তথ্য বিশ্লেষণ, পরিবর্তন বা প্রকাশ করবেন না।",
              )}
            </p>

            <div className="mt-5 space-y-4">
              {documents.map((document, index) => {
                const documentId =
                  document.id || document._id || `document-${index}`;

                return (
                  <div
                    key={documentId}
                    className="rounded-2xl border border-white/[0.08] p-4"
                  >
                    <AdminFilePreview file={document} compact />

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <StatusBadge status={document.status || "Pending"} />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => verifyDocument(document, "Verified")}
                          className="focus-ring inline-flex items-center gap-2 rounded-lg border border-archive-teal/25 bg-archive-teal/10 px-3 py-2 text-xs font-semibold text-archive-teal"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {pick("Verify", "যাচাই")}
                        </button>

                        <button
                          type="button"
                          onClick={() => verifyDocument(document, "Rejected")}
                          className="focus-ring inline-flex items-center gap-2 rounded-lg border border-archive-rose/25 bg-archive-rose/10 px-3 py-2 text-xs font-semibold text-archive-rose"
                        >
                          <XCircle className="h-4 w-4" />
                          {pick("Reject", "প্রত্যাখ্যান")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!documents.length && (
                <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-archive-muted">
                  {pick(
                    "No documents have been uploaded.",
                    "কোনো নথি আপলোড করা হয়নি।",
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="admin-card">
            <p className="eyebrow">{pick("Case progress", "কেসের অগ্রগতি")}</p>

            <div className="mt-5 space-y-4">
              {progressSteps.map((step, index) => (
                <div key={`${String(step)}-${index}`} className="flex gap-3">
                  <span
                    className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                      index === progressSteps.length - 1
                        ? "bg-archive-amber text-ink-950"
                        : "bg-archive-teal/15 text-archive-teal"
                    }`}
                  >
                    {index + 1}
                  </span>

                  <p className="text-sm text-[#D8D3CA]">
                    {typeof step === "string"
                      ? step
                      : step.title || step.label || step.status || ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="admin-card flex h-[calc(100dvh-8rem)] min-h-[620px] max-h-[900px] flex-col overflow-hidden p-0 2xl:sticky 2xl:top-28">
          <div className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-archive-teal/10 text-archive-teal">
                <UserRound className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <h3 className="truncate font-semibold text-white">
                  {pick(
                    "Private support conversation",
                    "ব্যক্তিগত সহায়তা কথোপকথন",
                  )}
                </h3>
                <p className="mt-1 truncate text-xs text-archive-muted">
                  {caseData.requester} • {caseData.assignedAdmin}
                </p>
              </div>
            </div>
          </div>

          {roomStopped && (
            <div className="shrink-0 border-b border-archive-rose/20 bg-archive-rose/[0.06] px-4 py-3 text-sm text-[#DAB8BE] sm:px-5">
              <PauseCircle className="mr-2 inline h-4 w-4 text-archive-rose" />
              {caseData.stoppedReason ||
                caseData.stopReason ||
                pick(
                  "This conversation is stopped and remains visible as read-only.",
                  "এই কথোপকথন বন্ধ এবং শুধু পড়ার জন্য দৃশ্যমান থাকবে।",
                )}
            </div>
          )}

          <div
            ref={messageListRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_top,rgba(75,155,141,.06),transparent_38%)] p-4 sm:p-5"
          >
            {messages.length ? (
              messages.map((item, index) => {
                const adminMessage = isAdminMessage(item);

                return (
                  <div
                    key={
                      item.id ||
                      item._id ||
                      `${item.sender}-${item.createdAt}-${index}`
                    }
                    className={`flex ${
                      adminMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[92%] rounded-2xl border p-3 sm:max-w-[86%] sm:p-4 ${
                        adminMessage
                          ? "rounded-br-sm border-archive-amber/20 bg-archive-amber/[0.08]"
                          : "rounded-bl-sm border-white/10 bg-white/[0.035]"
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
                          {getMessageName(item)}
                        </p>

                        <span className="text-[10px] text-archive-muted sm:text-[11px]">
                          {getMessageTime(item)}
                        </span>
                      </div>

                      {getMessageText(item) && (
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#E0DBD3]">
                          {getMessageText(item)}
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

          {roomStopped ? (
            <div className="sticky bottom-0 z-20 shrink-0 border-t border-white/10 bg-[#0D111A]/98 p-3 shadow-[0_-18px_35px_rgba(0,0,0,.28)] backdrop-blur-xl sm:p-4">
              <div className="rounded-xl border border-archive-rose/25 bg-archive-rose/[0.07] p-4 text-center">
                <PauseCircle className="mx-auto h-6 w-6 text-archive-rose" />
                <p className="mt-2 text-sm font-semibold text-white">
                  {pick(
                    "This support room has been stopped",
                    "এই সহায়তা কক্ষটি বন্ধ করা হয়েছে",
                  )}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#DAB8BE]">
                  {caseData.stoppedReason ||
                    caseData.stopReason ||
                    pick(
                      "Previous messages remain visible, but new messages cannot be sent.",
                      "আগের বার্তাগুলো দেখা যাবে, তবে নতুন বার্তা পাঠানো যাবে না।",
                    )}
                </p>
              </div>
            </div>
          ) : (
            <form
              ref={replyFormRef}
              onSubmit={sendReply}
              className="sticky bottom-0 z-20 shrink-0 border-t border-white/10 bg-[#0D111A]/98 p-3 shadow-[0_-18px_35px_rgba(0,0,0,.28)] backdrop-blur-xl sm:p-4"
            >
              {attachment && (
                <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                  {attachmentPreview ? (
                    <div className="relative p-2">
                      <img
                        src={attachmentPreview}
                        alt={`Selected attachment ${attachment.name}`}
                        className="mx-auto max-h-44 w-full rounded-lg object-contain"
                      />

                      <button
                        type="button"
                        onClick={clearAttachment}
                        className="focus-ring absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/75 text-white"
                        aria-label={pick("Remove attachment", "সংযুক্তি সরান")}
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
                        aria-label={pick("Remove attachment", "সংযুক্তি সরান")}
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
                  aria-label={pick(
                    "Attach requested file",
                    "প্রয়োজনীয় ফাইল সংযুক্ত করুন",
                  )}
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(event) =>
                    selectAttachment(event.target.files?.[0] || null)
                  }
                />

                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleMessageKeyDown}
                  rows={2}
                  className="field-control max-h-32 min-h-12 flex-1 resize-none"
                  placeholder={pick(
                    "Reply with the next clear step…",
                    "পরবর্তী পরিষ্কার পদক্ষেপ লিখুন…",
                  )}
                />

                <button
                  type="submit"
                  disabled={sending || (!message.trim() && !attachment)}
                  className="focus-ring inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-4 text-sm font-semibold text-ink-950 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {sending
                      ? pick("Sending…", "পাঠানো হচ্ছে…")
                      : pick("Send reply", "উত্তর পাঠান")}
                  </span>
                </button>
              </div>

              <p className="mt-2 text-[10px] text-archive-muted">
                {pick(
                  "Enter to send • Shift + Enter for a new line",
                  "পাঠাতে Enter • নতুন লাইনের জন্য Shift + Enter",
                )}
              </p>
            </form>
          )}
        </section>
      </div>

      {stopDialogOpen && (
        <div
          className="fixed inset-0 z-[170] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stop-support-room-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !savingAction && setStopDialogOpen(false)}
            aria-label={pick("Close dialog", "ডায়ালগ বন্ধ করুন")}
          />

          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <p className="eyebrow">
                  {pick("Close conversation", "কথোপকথন বন্ধ")}
                </p>
                <h2
                  id="stop-support-room-title"
                  className="mt-2 font-display text-3xl font-semibold"
                >
                  {pick(
                    "Stop this support room?",
                    "এই সহায়তা কক্ষ বন্ধ করবেন?",
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setStopDialogOpen(false)}
                disabled={savingAction}
                className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm leading-7 text-archive-muted">
                {pick(
                  "The updated status and closing reason will be shown to the user. Previous messages and attachments remain visible, but both composers become read-only.",
                  "হালনাগাদ অবস্থা ও বন্ধ করার কারণ ব্যবহারকারীকে দেখানো হবে। আগের বার্তা ও সংযুক্তি দৃশ্যমান থাকবে, তবে উভয় বার্তা লেখার অংশ বন্ধ হবে।",
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
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 p-5">
              <button
                type="button"
                onClick={() => setStopDialogOpen(false)}
                disabled={savingAction}
                className="focus-ring rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {pick("Cancel", "বাতিল")}
              </button>

              <button
                type="button"
                onClick={confirmStop}
                disabled={savingAction || stopReason.trim().length < 5}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-archive-amber px-4 py-2.5 text-sm font-semibold text-ink-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingAction ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PauseCircle className="h-4 w-4" />
                )}
                {pick("Stop room", "কক্ষ বন্ধ করুন")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
