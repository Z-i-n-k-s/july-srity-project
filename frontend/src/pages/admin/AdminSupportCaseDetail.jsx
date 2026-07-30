import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  Image as ImageIcon,
  Loader2,
  LockKeyhole,
  Paperclip,
  Send,
  ShieldAlert,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  adminApi,
  unwrap,
} from "../../lib/api";

import { adminSupportFallback } from "../../data/adminData";

import AdminFilePreview from "../../components/admin/AdminFilePreview";
import StatusBadge from "../../components/ui/StatusBadge";

import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

import useFilePreview from "../../hooks/useFilePreview";

const MESSAGE_REFRESH_INTERVAL = 2500;

const getSupportCaseFromPayload = (payload) => {
  const data = unwrap(payload);

  if (!data || typeof data !== "object") {
    return null;
  }

  return (
    data.supportCase ||
    data.caseData ||
    data.case ||
    data.room ||
    data
  );
};

const ensureArray = (value) => {
  return Array.isArray(value) ? value : [];
};

const getAttachment = (message) => {
  if (!message) {
    return null;
  }

  const attachment =
    message.attachment ||
    message.file ||
    message.upload ||
    null;

  if (typeof attachment === "string") {
    return {
      name:
        attachment.split("/").pop() ||
        "Attachment",
      type: "",
      url: attachment,
    };
  }

  if (attachment) {
    return {
      ...attachment,

      name:
        attachment.name ||
        attachment.originalName ||
        attachment.originalname ||
        attachment.fileName ||
        attachment.filename ||
        "Attachment",

      type:
        attachment.type ||
        attachment.mimeType ||
        attachment.mimetype ||
        "",

      url:
        attachment.url ||
        attachment.secureUrl ||
        attachment.secure_url ||
        attachment.fileUrl ||
        attachment.path ||
        "",
    };
  }

  if (message.attachmentName) {
    return {
      name: message.attachmentName,
      type: message.attachmentType || "",
      size: message.attachmentSize || 0,
      url:
        message.attachmentUrl ||
        message.fileUrl ||
        "",
    };
  }

  return null;
};

const isImageAttachment = (file) => {
  if (!file) {
    return false;
  }

  if (file.type?.startsWith("image/")) {
    return true;
  }

  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
    file.name || file.url || ""
  );
};

const isAdminMessage = (message) => {
  const sender = String(
    message?.sender?.role ||
      message?.senderRole ||
      message?.role ||
      message?.sender ||
      ""
  ).toLowerCase();

  return (
    sender === "admin" ||
    sender === "administrator" ||
    sender === "support_admin" ||
    sender === "support-admin" ||
    sender.includes("admin")
  );
};

const getMessageText = (message) => {
  if (!message) {
    return "";
  }

  return (
    message.text ||
    message.content ||
    message.body ||
    (typeof message.message === "string"
      ? message.message
      : "")
  );
};

const getMessageName = (message) => {
  if (!message) {
    return "User";
  }

  return (
    message.sender?.name ||
    message.name ||
    message.senderName ||
    message.authorName ||
    (isAdminMessage(message)
      ? "Support Admin"
      : "Requester")
  );
};

const getMessageTime = (message) => {
  const value =
    message?.time ||
    message?.createdAt ||
    message?.updatedAt ||
    "";

  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const mergeSupportCase = (
  currentCase,
  incomingCase
) => {
  if (
    !incomingCase ||
    typeof incomingCase !== "object"
  ) {
    return currentCase;
  }

  const incomingMessages =
    incomingCase.messages ||
    incomingCase.chatMessages ||
    incomingCase.conversation;

  const incomingDocuments =
    incomingCase.documents ||
    incomingCase.medicalDocuments;

  const incomingProgress =
    incomingCase.progress ||
    incomingCase.progressSteps ||
    incomingCase.timeline;

  return {
    ...currentCase,
    ...incomingCase,

    id:
      incomingCase.id ||
      incomingCase._id ||
      currentCase.id,

    messages: Array.isArray(incomingMessages)
      ? incomingMessages
      : ensureArray(currentCase.messages),

    documents: Array.isArray(incomingDocuments)
      ? incomingDocuments
      : ensureArray(currentCase.documents),

    progress: Array.isArray(incomingProgress)
      ? incomingProgress
      : ensureArray(currentCase.progress),
  };
};

export default function AdminSupportCaseDetail() {
  const { caseId } = useParams();

  const fallback = useMemo(() => {
    return (
      adminSupportFallback.find(
        (item) =>
          String(item.id || item._id) ===
          String(caseId)
      ) ||
      adminSupportFallback[0] || {
        id: caseId,
        title: "Support case",
        summary: "",
        status: "Pending",
        priority: "Normal",
        category: "General support",
        requester: "Unknown requester",
        assignedAdmin: "Not assigned",
        location: "Not provided",
        hospital: "Not provided",
        messages: [],
        documents: [],
        progress: [],
      }
    );
  }, [caseId]);

  const [caseData, setCaseData] =
    useState(fallback);

  const [message, setMessage] =
    useState("");

  const [attachment, setAttachment] =
    useState(null);

  const [sending, setSending] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const endRef = useRef(null);
  const replyFormRef = useRef(null);

  const createdObjectUrls = useRef([]);

  const toast = useToast();
  const { pick } = useLanguage();

  const attachmentPreview =
    useFilePreview(attachment);

  /*
   * Load initially and then poll the backend every 2.5 seconds.
   */
  useEffect(() => {
    let active = true;
    let requestInProgress = false;

    const loadSupportCase = async ({
      initial = false,
      showError = false,
    } = {}) => {
      if (
        requestInProgress ||
        !caseId
      ) {
        return;
      }

      requestInProgress = true;

      if (!initial && active) {
        setRefreshing(true);
      }

      try {
        const payload =
          await adminApi.supportCase(
            caseId,
            initial ? fallback : undefined
          );

        if (!active) {
          return;
        }

        const incomingCase =
          getSupportCaseFromPayload(payload);

        if (!incomingCase) {
          return;
        }

        setCaseData((current) =>
          mergeSupportCase(
            current,
            incomingCase
          )
        );
      } catch (error) {
        if (!active) {
          return;
        }

        console.error(
          "Unable to refresh support case:",
          error
        );

        if (showError) {
          toast.error(
            error?.message ||
              pick(
                "Unable to load the support room.",
                "সহায়তা কক্ষ লোড করা যায়নি।"
              )
          );
        }
      } finally {
        requestInProgress = false;

        if (active) {
          setRefreshing(false);
        }
      }
    };

    void loadSupportCase({
      initial: true,
      showError: true,
    });

    const intervalId = window.setInterval(
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadSupportCase();
        }
      },
      MESSAGE_REFRESH_INTERVAL
    );

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void loadSupportCase();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      active = false;

      window.clearInterval(intervalId);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };

    // toast and pick are intentionally omitted because
    // some context providers recreate them on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, fallback]);

  /*
   * Scroll to the latest message safely.
   */
  useEffect(() => {
    const target = endRef.current;

    if (!target) {
      return undefined;
    }

    const frameId =
      window.requestAnimationFrame(() => {
        target.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [caseData.messages?.length]);

  /*
   * Remove locally-created attachment URLs.
   */
  useEffect(() => {
    return () => {
      createdObjectUrls.current.forEach(
        (url) => {
          URL.revokeObjectURL(url);
        }
      );

      createdObjectUrls.current = [];
    };
  }, []);

  const verifyDocument = async (
    document,
    status
  ) => {
    try {
      const documentId =
        document.id || document._id;

      if (!documentId) {
        throw new Error(
          pick(
            "The document identifier is missing.",
            "নথির শনাক্তকারী পাওয়া যায়নি।"
          )
        );
      }

      await adminApi.verifyMedicalDocument(
        caseData.id,
        documentId,
        {
          status,

          note:
            status === "Verified"
              ? "Document reviewed by authorised admin."
              : "Document is unclear or not relevant to the request.",
        }
      );

      setCaseData((current) => ({
        ...current,

        documents: ensureArray(
          current.documents
        ).map((item) => {
          const itemId =
            item.id || item._id;

          return String(itemId) ===
            String(documentId)
            ? {
                ...item,
                status,
              }
            : item;
        }),
      }));

      toast.success(
        status === "Verified"
          ? pick(
              "Document verified.",
              "নথিটি যাচাই করা হয়েছে।"
            )
          : pick(
              "Document rejected.",
              "নথিটি প্রত্যাখ্যান করা হয়েছে।"
            )
      );
    } catch (error) {
      toast.error(
        error?.message ||
          pick(
            "The document status could not be updated.",
            "নথির অবস্থা পরিবর্তন করা যায়নি।"
          )
      );
    }
  };

  const selectAttachment = (file) => {
    if (!file) {
      setAttachment(null);
      return;
    }

    const allowed =
      file.type.startsWith("image/") ||
      file.type === "application/pdf";

    if (!allowed) {
      toast.error(
        pick(
          "Choose an image or PDF file.",
          "ছবি বা PDF ফাইল নির্বাচন করুন।"
        )
      );

      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(
        pick(
          "The file must be 10 MB or smaller.",
          "ফাইলটি ১০ এমবি বা ছোট হতে হবে।"
        )
      );

      return;
    }

    setAttachment(file);
  };

  const sendReply = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (
      !trimmedMessage &&
      !attachment
    ) {
      return;
    }

    if (sending) {
      return;
    }

    setSending(true);

    try {
      const formData = new FormData();

      formData.append(
        "message",
        trimmedMessage
      );

      if (attachment) {
        formData.append(
          "file",
          attachment
        );
      }

      const response =
        await adminApi.sendSupportMessage(
          caseData.id,
          formData
        );

      const responseData = unwrap(response);

      const remoteMessage =
        responseData?.supportMessage ||
        responseData?.newMessage ||
        responseData?.messageData ||
        (typeof responseData?.message ===
        "object"
          ? responseData.message
          : null);

      const remoteAttachment =
        remoteMessage?.attachment ||
        responseData?.attachment ||
        response?.data?.attachment ||
        response?.attachment ||
        response?.file ||
        null;

      const remoteUrl =
        remoteAttachment?.url ||
        remoteAttachment?.secureUrl ||
        remoteAttachment?.secure_url ||
        responseData?.fileUrl ||
        response?.fileUrl ||
        "";

      const localUrl =
        attachment &&
        !remoteUrl
          ? URL.createObjectURL(attachment)
          : "";

      if (localUrl) {
        createdObjectUrls.current.push(
          localUrl
        );
      }

      const nextMessage = remoteMessage
        ? {
            ...remoteMessage,

            id:
              remoteMessage.id ||
              remoteMessage._id ||
              `admin-${Date.now()}`,

            sender:
              remoteMessage.sender ||
              remoteMessage.senderRole ||
              "admin",

            name:
              remoteMessage.name ||
              remoteMessage.senderName ||
              "Support Admin",

            text:
              getMessageText(
                remoteMessage
              ) || trimmedMessage,

            time:
              remoteMessage.time ||
              remoteMessage.createdAt ||
              new Date().toISOString(),

            attachment:
              remoteMessage.attachment ||
              (attachment
                ? {
                    name:
                      remoteAttachment?.name ||
                      attachment.name,

                    type:
                      remoteAttachment?.type ||
                      remoteAttachment?.mimetype ||
                      attachment.type,

                    size:
                      remoteAttachment?.size ||
                      attachment.size,

                    url:
                      remoteUrl ||
                      localUrl,
                  }
                : null),
          }
        : {
            id: `admin-${Date.now()}`,
            sender: "admin",
            name: "Support Admin",
            text: trimmedMessage,
            time: new Date().toISOString(),

            attachment: attachment
              ? {
                  name:
                    remoteAttachment?.name ||
                    attachment.name,

                  type:
                    remoteAttachment?.type ||
                    attachment.type,

                  size:
                    remoteAttachment?.size ||
                    attachment.size,

                  url:
                    remoteUrl ||
                    localUrl,
                }
              : null,
          };

      setCaseData((current) => ({
        ...current,

        messages: [
          ...ensureArray(
            current.messages
          ),
          nextMessage,
        ],
      }));

      setMessage("");
      setAttachment(null);
    } catch (error) {
      console.error(
        "Unable to send support reply:",
        error
      );

      toast.error(
        error?.message ||
          pick(
            "The reply could not be sent.",
            "উত্তর পাঠানো যায়নি।"
          )
      );
    } finally {
      setSending(false);
    }
  };

  /*
   * Enter sends.
   * Shift + Enter creates a new line.
   * isComposing protects Bangla/IME typing.
   */
  const handleMessageKeyDown = (
    event
  ) => {
    const composing =
      event.nativeEvent?.isComposing ||
      event.isComposing;

    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      composing
    ) {
      return;
    }

    event.preventDefault();

    if (
      sending ||
      (!message.trim() &&
        !attachment)
    ) {
      return;
    }

    replyFormRef.current?.requestSubmit();
  };

  const documents = ensureArray(
    caseData.documents
  );

  const progressSteps = ensureArray(
    caseData.progress
  );

  const messages = ensureArray(
    caseData.messages
  );

  return (
    <div className="space-y-6">
      <Link
        to="/admin-panel/support-cases"
        className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-archive-amber"
      >
        <ArrowLeft className="h-4 w-4" />

        {pick(
          "Back to support cases",
          "সহায়তা কেসে ফিরুন"
        )}
      </Link>

      <section className="admin-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="eyebrow">
              {caseData.id}
            </p>

            <h2 className="mt-2 font-display text-4xl font-semibold">
              {caseData.title}
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-archive-muted">
              {caseData.summary}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge
                status={caseData.status}
              />

              <span
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  caseData.priority ===
                  "Urgent"
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
                  ? pick(
                      "Checking messages",
                      "বার্তা দেখা হচ্ছে"
                    )
                  : pick(
                      "Live updates on",
                      "স্বয়ংক্রিয় হালনাগাদ চালু"
                    )}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-archive-teal/20 bg-archive-teal/[0.07] p-4 text-xs leading-5 text-[#B9CFCB]">
            <LockKeyhole className="mr-2 inline h-4 w-4" />

            {pick(
              "Private room: requester and authorised admins only",
              "ব্যক্তিগত কক্ষ: কেবল অনুরোধকারী ও অনুমোদিত অ্যাডমিন"
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-6">
          <section className="admin-card">
            <h3 className="font-display text-3xl font-semibold">
              {pick(
                "Case information",
                "কেসের তথ্য"
              )}
            </h3>

            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[.12em] text-archive-muted">
                  {pick(
                    "Requester",
                    "অনুরোধকারী"
                  )}
                </dt>

                <dd className="mt-1 text-white">
                  {caseData.requester}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-[.12em] text-archive-muted">
                  {pick(
                    "Assigned admin",
                    "দায়িত্বপ্রাপ্ত অ্যাডমিন"
                  )}
                </dt>

                <dd className="mt-1 text-white">
                  {caseData.assignedAdmin}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-[.12em] text-archive-muted">
                  {pick(
                    "Approximate location",
                    "আনুমানিক স্থান"
                  )}
                </dt>

                <dd className="mt-1 text-white">
                  {caseData.location}
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-[.12em] text-archive-muted">
                  {pick(
                    "Hospital",
                    "হাসপাতাল"
                  )}
                </dt>

                <dd className="mt-1 text-white">
                  {caseData.hospital}
                </dd>
              </div>
            </dl>
          </section>

          <section className="admin-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">
                  {pick(
                    "Sensitive documents",
                    "সংবেদনশীল নথি"
                  )}
                </p>

                <h3 className="mt-2 font-display text-3xl font-semibold">
                  {pick(
                    "Medical-document verification",
                    "চিকিৎসা নথি যাচাই"
                  )}
                </h3>
              </div>

              <FileCheck2 className="h-6 w-6 text-archive-teal" />
            </div>

            <p className="mt-3 text-sm leading-6 text-archive-muted">
              {pick(
                "Verify only relevance and readability for this support request. Do not diagnose, alter or publish medical information.",
                "এই সহায়তা অনুরোধের জন্য কেবল প্রাসঙ্গিকতা ও পাঠযোগ্যতা যাচাই করুন। চিকিৎসা তথ্য বিশ্লেষণ, পরিবর্তন বা প্রকাশ করবেন না।"
              )}
            </p>

            <div className="mt-5 space-y-4">
              {documents.map(
                (document, index) => {
                  const documentId =
                    document.id ||
                    document._id ||
                    `document-${index}`;

                  return (
                    <div
                      key={documentId}
                      className="rounded-2xl border border-white/[0.08] p-4"
                    >
                      <AdminFilePreview
                        file={document}
                        compact
                      />

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <StatusBadge
                          status={
                            document.status ||
                            "Pending"
                          }
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              verifyDocument(
                                document,
                                "Verified"
                              )
                            }
                            className="focus-ring inline-flex items-center gap-2 rounded-lg border border-archive-teal/25 bg-archive-teal/10 px-3 py-2 text-xs font-semibold text-archive-teal"
                          >
                            <CheckCircle2 className="h-4 w-4" />

                            {pick(
                              "Verify",
                              "যাচাই"
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              verifyDocument(
                                document,
                                "Rejected"
                              )
                            }
                            className="focus-ring inline-flex items-center gap-2 rounded-lg border border-archive-rose/25 bg-archive-rose/10 px-3 py-2 text-xs font-semibold text-archive-rose"
                          >
                            <XCircle className="h-4 w-4" />

                            {pick(
                              "Reject",
                              "প্রত্যাখ্যান"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}

              {!documents.length && (
                <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-archive-muted">
                  {pick(
                    "No documents have been uploaded.",
                    "কোনো নথি আপলোড করা হয়নি।"
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="admin-card">
            <p className="eyebrow">
              {pick(
                "Case progress",
                "কেসের অগ্রগতি"
              )}
            </p>

            <div className="mt-5 space-y-4">
              {progressSteps.map(
                (step, index) => (
                  <div
                    key={`${String(step)}-${index}`}
                    className="flex gap-3"
                  >
                    <span
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                        index ===
                        progressSteps.length -
                          1
                          ? "bg-archive-amber text-ink-950"
                          : "bg-archive-teal/15 text-archive-teal"
                      }`}
                    >
                      {index + 1}
                    </span>

                    <p className="text-sm text-[#D8D3CA]">
                      {typeof step ===
                      "string"
                        ? step
                        : step.title ||
                          step.label ||
                          step.status ||
                          ""}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        </div>

        <section className="admin-card flex min-h-[680px] flex-col overflow-hidden p-0 2xl:sticky 2xl:top-28 2xl:h-[calc(100vh-150px)]">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-archive-teal/10 text-archive-teal">
                <UserRound className="h-5 w-5" />
              </span>

              <div>
                <h3 className="font-semibold text-white">
                  {pick(
                    "Private support conversation",
                    "ব্যক্তিগত সহায়তা কথোপকথন"
                  )}
                </h3>

                <p className="mt-1 text-xs text-archive-muted">
                  {caseData.requester} •{" "}
                  {caseData.assignedAdmin}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map(
              (item, index) => {
                const adminMessage =
                  isAdminMessage(item);

                const file =
                  getAttachment(item);

                const image =
                  isImageAttachment(file);

                return (
                  <div
                    key={
                      item.id ||
                      item._id ||
                      `${item.sender}-${item.createdAt}-${index}`
                    }
                    className={`flex ${
                      adminMessage
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[86%] rounded-2xl border p-4 ${
                        adminMessage
                          ? "border-archive-amber/20 bg-archive-amber/[0.08]"
                          : "border-white/10 bg-white/[0.035]"
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
                          {getMessageName(
                            item
                          )}
                        </p>

                        <span className="text-[11px] text-archive-muted">
                          {getMessageTime(
                            item
                          )}
                        </span>
                      </div>

                      {getMessageText(item) && (
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#E0DBD3]">
                          {getMessageText(
                            item
                          )}
                        </p>
                      )}

                      {file &&
                        image &&
                        file.url && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="focus-ring mt-3 block overflow-hidden rounded-xl border border-white/10 bg-black/20"
                          >
                            <img
                              src={file.url}
                              alt={`Support attachment ${file.name}`}
                              className="max-h-72 w-full object-contain"
                            />

                            <span className="block truncate border-t border-white/10 px-3 py-2 text-xs text-archive-muted">
                              {file.name}
                            </span>
                          </a>
                        )}

                      {file &&
                        (!image ||
                          !file.url) && (
                          <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 p-3 text-xs text-archive-muted">
                            {image ? (
                              <ImageIcon className="h-4 w-4 shrink-0 text-archive-amber" />
                            ) : (
                              <FileCheck2 className="h-4 w-4 shrink-0 text-archive-amber" />
                            )}

                            <span className="truncate">
                              {file.name}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                );
              }
            )}

            <div ref={endRef} />
          </div>

          <form
            ref={replyFormRef}
            onSubmit={sendReply}
            className="border-t border-white/10 p-4"
          >
            {attachment && (
              <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                {attachmentPreview ? (
                  <div className="relative p-2">
                    <img
                      src={attachmentPreview}
                      alt={`Selected attachment ${attachment.name}`}
                      className="mx-auto max-h-64 w-full rounded-lg object-contain"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setAttachment(null)
                      }
                      className="focus-ring absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/75 text-white"
                      aria-label={pick(
                        "Remove attachment",
                        "সংযুক্তি সরান"
                      )}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3">
                    <FileCheck2 className="h-5 w-5 shrink-0 text-archive-amber" />

                    <span className="min-w-0 flex-1 truncate text-xs text-[#D8D3CA]">
                      {attachment.name}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setAttachment(null)
                      }
                      className="focus-ring p-2 text-archive-rose"
                      aria-label={pick(
                        "Remove attachment",
                        "সংযুক্তি সরান"
                      )}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              onKeyDown={
                handleMessageKeyDown
              }
              rows={3}
              className="field-control resize-none"
              placeholder={pick(
                "Reply with the next clear step. Press Enter to send or Shift + Enter for a new line.",
                "পরবর্তী পরিষ্কার পদক্ষেপ লিখুন। পাঠাতে Enter চাপুন অথবা নতুন লাইনের জন্য Shift + Enter চাপুন।"
              )}
            />

            <p className="mt-2 text-[10px] text-archive-muted">
              {pick(
                "Enter to send • Shift + Enter for a new line",
                "পাঠাতে Enter • নতুন লাইনের জন্য Shift + Enter"
              )}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="focus-ring inline-flex max-w-full cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-[#C6C2BC] hover:bg-white/5">
                <Paperclip className="h-4 w-4 shrink-0" />

                <span className="truncate">
                  {attachment
                    ? attachment.name
                    : pick(
                        "Attach requested file",
                        "প্রয়োজনীয় ফাইল সংযুক্ত করুন"
                      )}
                </span>

                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    selectAttachment(
                      event.target
                        .files?.[0] ||
                        null
                    );

                    event.target.value =
                      "";
                  }}
                />
              </label>

              <button
                type="submit"
                disabled={
                  sending ||
                  (!message.trim() &&
                    !attachment)
                }
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-4 py-2.5 text-sm font-semibold text-ink-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}

                {sending
                  ? pick(
                      "Sending…",
                      "পাঠানো হচ্ছে…"
                    )
                  : pick(
                      "Send reply",
                      "উত্তর পাঠান"
                    )}
              </button>
            </div>

            <div className="mt-3 rounded-lg border border-archive-rose/15 bg-archive-rose/[0.05] p-3 text-[11px] leading-5 text-[#DAB8BE]">
              <ShieldAlert className="mr-2 inline h-4 w-4" />

              {pick(
                "Messages and files stay inside the authorised support room.",
                "বার্তা ও ফাইল অনুমোদিত সহায়তা কক্ষের ভেতরেই থাকবে।"
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}