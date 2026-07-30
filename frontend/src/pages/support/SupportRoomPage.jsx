import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  LockKeyhole,
  Paperclip,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

import useFilePreview from "../../hooks/useFilePreview";

import {
  userApi,
  unwrap,
} from "../../lib/api";

import {
  STORAGE_KEYS,
  storage,
} from "../../lib/storage";

import { makeId } from "../../lib/utils";
import { filterOwnedRecords, getRecordId, isOwnedByUser } from "../../lib/ownership";
import { applySupportRoomOverride, isSupportRoomStopped, SUPPORT_ROOM_EVENT } from "../../lib/supportRoomState";

const MAX_ATTACHMENT_SIZE =
  10 * 1024 * 1024;

const MESSAGE_REFRESH_INTERVAL = 2500;

const formatFileSize = (size = 0) => {
  if (!size) {
    return "";
  }

  if (size < 1024 * 1024) {
    return `${Math.ceil(
      size / 1024
    )} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
};

const formatMessageTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
};

const normaliseAttachment = (
  attachment
) => {
  if (!attachment) {
    return null;
  }

  if (typeof attachment === "string") {
    return {
      name:
        attachment.split("/").pop() ||
        "Attachment",
      type: "",
      size: 0,
      url: attachment,
    };
  }

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

    size:
      attachment.size ||
      attachment.fileSize ||
      0,

    url:
      attachment.url ||
      attachment.secureUrl ||
      attachment.secure_url ||
      attachment.fileUrl ||
      attachment.path ||
      "",
  };
};

const normaliseMessage = (
  item,
  index = 0
) => {
  const source =
    item &&
    typeof item === "object"
      ? item
      : {};

  const senderObject =
    source.sender &&
    typeof source.sender === "object"
      ? source.sender
      : null;

  const sender =
    senderObject?.role ||
    source.senderRole ||
    source.senderType ||
    source.role ||
    source.sender ||
    "admin";

  const attachment =
    normaliseAttachment(
      source.attachment ||
        source.file ||
        source.upload ||
        (source.attachmentName
          ? {
              name:
                source.attachmentName,
              type:
                source.attachmentType,
              size:
                source.attachmentSize,
              url:
                source.attachmentUrl ||
                source.fileUrl,
            }
          : null)
    );

  return {
    ...source,

    id:
      source.id ||
      source._id ||
      `message-${index}`,

    sender:
      typeof sender === "string"
        ? sender
        : "admin",

    senderId:
      senderObject?._id ||
      senderObject?.id ||
      source.senderId ||
      source.userId ||
      "",

    name:
      senderObject?.name ||
      source.name ||
      source.senderName ||
      source.authorName ||
      (String(sender)
        .toLowerCase()
        .includes("admin")
        ? "Support Admin"
        : "Requester"),

    text:
      source.text ||
      source.content ||
      source.body ||
      (typeof source.message ===
      "string"
        ? source.message
        : ""),

    time:
      source.time ||
      source.createdAt ||
      source.updatedAt ||
      "",

    attachment,
  };
};

const normaliseStoredMessages = (
  items = []
) => {
  return (
    Array.isArray(items) ? items : []
  ).map((item, index) => {
    const message =
      normaliseMessage(item, index);

    if (
      message.attachment?.url?.startsWith(
        "blob:"
      )
    ) {
      return {
        ...message,

        attachment: {
          ...message.attachment,
          url: "",
        },
      };
    }

    return message;
  });
};

const getMessageSignature = (
  message
) => {
  const attachment =
    normaliseAttachment(
      message?.attachment
    );

  return [
    String(
      message?.sender || ""
    ).toLowerCase(),
    String(
      message?.text || ""
    ).trim(),
    attachment?.name || "",
  ].join("|");
};

const mergeRemoteMessages = (
  currentMessages,
  remoteMessages
) => {
  const normalisedRemote =
    normaliseStoredMessages(
      remoteMessages
    );

  const remoteSignatures = new Set(
    normalisedRemote.map(
      getMessageSignature
    )
  );

  const pendingLocalMessages =
    normaliseStoredMessages(
      currentMessages
    ).filter(
      (message) =>
        message.optimistic &&
        !remoteSignatures.has(
          getMessageSignature(message)
        )
    );

  return [
    ...normalisedRemote,
    ...pendingLocalMessages,
  ];
};

const extractRoomPayload = (
  payload
) => {
  const data = unwrap(payload);

  if (
    !data ||
    typeof data !== "object"
  ) {
    return {
      room: null,
      messages: null,
    };
  }

  const room =
    data.room ||
    data.supportRoom ||
    data.case ||
    (data.id || data._id
      ? data
      : null);

  const messages =
    data.messages ||
    data.supportMessages ||
    data.chatMessages ||
    room?.messages ||
    room?.supportMessages ||
    null;

  return {
    room,
    messages:
      Array.isArray(messages)
        ? messages
        : null,
  };
};

const isUserMessage = (
  message,
  user
) => {
  const role = String(
    message?.sender || ""
  ).toLowerCase();

  if (
    role === "user" ||
    role === "requester" ||
    role === "member"
  ) {
    return true;
  }

  const currentUserId =
    user?._id || user?.id;

  return Boolean(
    currentUserId &&
      message?.senderId &&
      String(currentUserId) ===
        String(message.senderId)
  );
};

const isImageFile = (file) => {
  if (!file) {
    return false;
  }

  if (
    file.type?.startsWith("image/")
  ) {
    return true;
  }

  return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(
    file.name || file.url || ""
  );
};

export default function SupportRoomPage() {
  const { roomId } = useParams();

  const { user } = useAuth();
  const toast = useToast();
  const { pick } = useLanguage();

  const fileRef = useRef(null);
  const formRef = useRef(null);
  const endRef = useRef(null);

  const refreshRoomRef =
    useRef(null);

  const createdObjectUrls =
    useRef([]);

  const ownedSavedRooms = useMemo(() => {
    const savedRooms = storage.get(STORAGE_KEYS.supportRooms, []);
    return filterOwnedRecords(savedRooms, user);
  }, [user]);

  const ownedRoomIds = useMemo(
    () => ownedSavedRooms.map(getRecordId).filter(Boolean),
    [ownedSavedRooms],
  );

  const fallbackRoom = useMemo(() => {
    const saved = ownedSavedRooms.find((item) => String(getRecordId(item)) === String(roomId));
    return applySupportRoomOverride(saved || {
      id: roomId,
      title: pick("Loading private support room…", "ব্যক্তিগত সহায়তা কক্ষ লোড হচ্ছে…"),
      status: "Under review",
      priority: "Normal",
      assignedAdmin: pick("Awaiting assignment", "দায়িত্ব দেওয়ার অপেক্ষায়"),
      updatedAt: "",
    });
  }, [ownedSavedRooms, pick, roomId]);

  const initialMessages = useMemo(() => {
    if (!ownedRoomIds.includes(String(roomId))) return [];
    const savedMessages = storage.get(STORAGE_KEYS.roomMessages, {});
    return normaliseStoredMessages(savedMessages[roomId] || []);
  }, [ownedRoomIds, roomId]);

  const [room, setRoom] =
    useState(fallbackRoom);

  const [messages, setMessages] =
    useState(initialMessages);

  const [message, setMessage] =
    useState("");

  const [attachment, setAttachment] =
    useState(null);

  const [sending, setSending] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [accessDenied, setAccessDenied] =
    useState(false);

  const selectedPreviewUrl =
    useFilePreview(attachment);

  const updateMessages = (updater) => {
    setMessages((current) => {
      const next =
        typeof updater === "function"
          ? updater(current)
          : updater;

      const storedMessages =
        storage.get(
          STORAGE_KEYS.roomMessages,
          {}
        );

      storage.set(
        STORAGE_KEYS.roomMessages,
        {
          ...storedMessages,

          [roomId]:
            normaliseStoredMessages(
              next
            ),
        }
      );

      return next;
    });
  };

  useEffect(() => {
    let active = true;
    let requestInProgress = false;

    const loadRoom = async ({
      showLoader = false,
      showError = false,
    } = {}) => {
      if (
        requestInProgress ||
        !roomId
      ) {
        return;
      }

      requestInProgress = true;

      if (showLoader && active) {
        setRefreshing(true);
      }

      try {
        const payload =
          await userApi.getSupportRoom(
            roomId
          );

        if (!active) {
          return;
        }

        const {
          room: remoteRoom,
          messages: remoteMessages,
        } = extractRoomPayload(payload);

        if (remoteRoom && !isOwnedByUser(remoteRoom, user, ownedRoomIds)) {
          setAccessDenied(true);
          setMessages([]);
          return;
        }

        setAccessDenied(false);

        if (remoteRoom) {
          setRoom((current) => applySupportRoomOverride({
            ...current,
            ...remoteRoom,
            id: remoteRoom.id || remoteRoom._id || current.id,
          }));
        }

        if (
          Array.isArray(
            remoteMessages
          )
        ) {
          updateMessages(
            (current) =>
              mergeRemoteMessages(
                current,
                remoteMessages
              )
          );
        }
      } catch (error) {
        if (!active) {
          return;
        }

        console.error(
          "Unable to refresh support room:",
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

    refreshRoomRef.current =
      loadRoom;

    void loadRoom({
      showLoader: true,
      showError: true,
    });

    const intervalId =
      window.setInterval(() => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadRoom();
        }
      }, MESSAGE_REFRESH_INTERVAL);

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void loadRoom();
      }
    };

    const handleOnline = () => {
      void loadRoom({
        showLoader: true,
      });
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "online",
      handleOnline
    );

    return () => {
      active = false;

      refreshRoomRef.current = null;

      window.clearInterval(intervalId);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "online",
        handleOnline
      );
    };

    // pick and toast are intentionally omitted
    // because some context providers recreate
    // their functions on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownedRoomIds, roomId, user]);

  useEffect(() => {
    const applyOverride = () => setRoom((current) => applySupportRoomOverride(current));
    window.addEventListener(SUPPORT_ROOM_EVENT, applyOverride);
    window.addEventListener("storage", applyOverride);
    return () => {
      window.removeEventListener(SUPPORT_ROOM_EVENT, applyOverride);
      window.removeEventListener("storage", applyOverride);
    };
  }, []);

  useEffect(() => {
    const target = endRef.current;

    if (!target) {
      return undefined;
    }

    const frameId =
      window.requestAnimationFrame(
        () => {
          target.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        }
      );

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [messages.length]);

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

  const clearAttachment = () => {
    setAttachment(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const selectAttachment = (event) => {
    const file =
      event.target.files?.[0] ||
      null;

    if (!file) {
      clearAttachment();
      return;
    }

    const allowed =
      file.type.startsWith(
        "image/"
      ) ||
      file.type ===
        "application/pdf";

    if (!allowed) {
      toast.error(
        pick(
          "Choose a JPG, PNG, WEBP or PDF file.",
          "JPG, PNG, WEBP অথবা PDF ফাইল নির্বাচন করুন।"
        )
      );

      clearAttachment();
      return;
    }

    if (
      file.size >
      MAX_ATTACHMENT_SIZE
    ) {
      toast.error(
        pick(
          "The attachment must be 10 MB or smaller.",
          "সংযুক্তি ১০ এমবি বা ছোট হতে হবে।"
        )
      );

      clearAttachment();
      return;
    }

    setAttachment(file);
  };

  const send = async (event) => {
    event.preventDefault();

    if (isSupportRoomStopped(room)) {
      toast.warning(pick("This room was stopped by an administrator.", "একজন অ্যাডমিন এই কক্ষটি বন্ধ করেছেন।"));
      return;
    }

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
      const formData =
        new FormData();

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
        await userApi.sendSupportMessage(
          roomId,
          formData
        );

      const responseData =
        unwrap(response);

      const serverMessage =
        responseData?.supportMessage ||
        responseData?.newMessage ||
        responseData?.messageData ||
        (responseData?.message &&
        typeof responseData.message ===
          "object"
          ? responseData.message
          : null) ||
        (responseData &&
        typeof responseData ===
          "object" &&
        (
          responseData.id ||
          responseData._id ||
          responseData.text ||
          responseData.content
        )
          ? responseData
          : null);

      const uploadedAttachment =
        normaliseAttachment(
          serverMessage?.attachment ||
            serverMessage?.file ||
            responseData?.attachment ||
            response?.data?.attachment ||
            response?.attachment ||
            response?.file ||
            (responseData?.fileUrl
              ? {
                  url:
                    responseData.fileUrl,
                }
              : null)
        );

      let localUrl = "";

      if (
        attachment &&
        !uploadedAttachment?.url
      ) {
        localUrl =
          URL.createObjectURL(
            attachment
          );

        createdObjectUrls.current.push(
          localUrl
        );
      }

      const finalAttachment =
        attachment
          ? {
              name:
                uploadedAttachment?.name ||
                attachment.name,

              type:
                uploadedAttachment?.type ||
                attachment.type,

              size:
                uploadedAttachment?.size ||
                attachment.size,

              url:
                uploadedAttachment?.url ||
                localUrl,
            }
          : uploadedAttachment;

      const nextMessage =
        normaliseMessage({
          ...(serverMessage || {}),

          id:
            serverMessage?.id ||
            serverMessage?._id ||
            makeId("MSG"),

          sender:
            serverMessage?.sender ||
            serverMessage?.senderRole ||
            "user",

          senderId:
            serverMessage?.senderId ||
            user?._id ||
            user?.id,

          name:
            serverMessage?.name ||
            serverMessage?.senderName ||
            user?.name ||
            "You",

          text:
            serverMessage?.text ||
            serverMessage?.content ||
            (typeof serverMessage?.message ===
            "string"
              ? serverMessage.message
              : trimmedMessage),

          attachment:
            serverMessage?.attachment ||
            serverMessage?.file ||
            finalAttachment,

          time:
            serverMessage?.time ||
            serverMessage?.createdAt ||
            new Date().toISOString(),

          optimistic:
            !serverMessage,
        });

      updateMessages(
        (current) => [
          ...current,
          nextMessage,
        ]
      );

      setMessage("");
      clearAttachment();

      window.setTimeout(() => {
        void refreshRoomRef.current?.();
      }, 300);
    } catch (error) {
      console.error(
        "Unable to send support message:",
        error
      );

      toast.error(
        error?.message ||
          pick(
            "The message could not be sent.",
            "বার্তা পাঠানো যায়নি।"
          )
      );
    } finally {
      setSending(false);
    }
  };

  const handleMessageKeyDown = (
    event
  ) => {
    const isComposing =
      event.nativeEvent
        ?.isComposing ||
      event.isComposing;

    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      isComposing ||
      event.repeat
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

    formRef.current?.requestSubmit();
  };

  const progress = useMemo(
    () => [
      {
        label: pick(
          "Submitted",
          "জমা দেওয়া হয়েছে"
        ),
        done: true,
      },
      {
        label: pick(
          "Admin review",
          "অ্যাডমিন পর্যালোচনা"
        ),
        done: true,
      },
      {
        label:
          room.status ===
          "Information required"
            ? pick(
                "Information required",
                "তথ্য প্রয়োজন"
              )
            : pick(
                "In progress",
                "চলমান"
              ),

        done:
          room.status !==
          "Under review",
      },
      {
        label: pick(
          "Completed",
          "সম্পন্ন"
        ),

        done:
          room.status ===
          "Completed",
      },
    ],
    [pick, room.status]
  );

  const renderMessageAttachment = (
    rawAttachment
  ) => {
    const file =
      normaliseAttachment(
        rawAttachment
      );

    if (!file) {
      return null;
    }

    const image =
      isImageFile(file);

    if (
      image &&
      file.url
    ) {
      return (
        <figure className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="focus-ring group block"
            aria-label={`${pick(
              "Open image attachment",
              "ছবি সংযুক্তি খুলুন"
            )} ${file.name}`}
          >
            <img
              src={file.url}
              alt={`${pick(
                "Support room attachment",
                "সহায়তা কক্ষের সংযুক্তি"
              )}: ${file.name}`}
              className="max-h-[420px] w-full object-contain transition duration-300 group-hover:brightness-110"
            />

            <figcaption className="flex items-center justify-between gap-3 border-t border-white/10 px-3 py-2 text-xs text-archive-muted">
              <span className="min-w-0 truncate">
                {file.name}
              </span>

              <span className="flex shrink-0 items-center gap-1 text-archive-amber">
                <Eye className="h-3.5 w-3.5" />

                {pick(
                  "Preview",
                  "প্রিভিউ"
                )}
              </span>
            </figcaption>
          </a>
        </figure>
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
          <p className="truncate text-[#DDD7CE]">
            {file.name}
          </p>

          {file.size > 0 && (
            <p className="mt-0.5 text-[11px] text-archive-muted">
              {formatFileSize(
                file.size
              )}
            </p>
          )}
        </div>

        {file.url && (
          <Eye className="h-4 w-4 shrink-0 text-archive-amber" />
        )}
      </>
    );

    return file.url ? (
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        className="focus-ring mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-black/10 p-3 text-xs transition hover:bg-white/[0.04]"
      >
        {content}
      </a>
    ) : (
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-black/10 p-3 text-xs">
        {content}
      </div>
    );
  };

  if (accessDenied) {
    return (
      <div className="rounded-3xl border border-archive-rose/25 bg-archive-rose/[0.07] p-8 text-center">
        <LockKeyhole className="mx-auto h-10 w-10 text-archive-rose" />
        <h1 className="mt-4 font-display text-4xl font-semibold">{pick("Private room access denied", "ব্যক্তিগত কক্ষে প্রবেশ নিষিদ্ধ")}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#DAB8BE]">{pick("This support room does not belong to the signed-in account. Only the requester and authorised administrators may view its messages.", "এই সহায়তা কক্ষটি সাইন-ইন করা অ্যাকাউন্টের নয়। শুধু অনুরোধকারী ও অনুমোদিত অ্যাডমিন এর বার্তা দেখতে পারবেন।")}</p>
        <Link to="/account/support-rooms" className="focus-ring mt-6 inline-flex rounded-xl bg-archive-rose px-4 py-3 text-sm font-semibold text-white">{pick("Return to my rooms", "আমার কক্ষে ফিরুন")}</Link>
      </div>
    );
  }

  const roomStopped = isSupportRoomStopped(room);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link
          to="/account/support-rooms"
          className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-archive-amber"
        >
          <ArrowLeft className="h-4 w-4" />
          {pick("Back to support rooms", "সহায়তা কক্ষে ফিরুন")}
        </Link>
        <Link
          to="/account/support-rooms"
          className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-archive-muted hover:border-archive-amber/30 hover:text-white"
          aria-label={pick("Close support room", "সহায়তা কক্ষ বন্ধ করুন")}
        >
          <X className="h-5 w-5" />
        </Link>
      </div>
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow">
              {pick(
                "Private Support Room",
                "ব্যক্তিগত সহায়তা কক্ষ"
              )}
            </p>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-archive-teal/15 bg-archive-teal/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-archive-teal">
              {refreshing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-archive-teal" />
              )}

              {refreshing
                ? pick(
                    "Checking messages",
                    "বার্তা দেখা হচ্ছে"
                  )
                : pick(
                    "Live updates",
                    "স্বয়ংক্রিয় হালনাগাদ"
                  )}
            </span>
          </div>

          <h1 className="mt-3 font-display text-4xl font-semibold">
            {room.title}
          </h1>

          <p className="mt-2 text-sm text-archive-muted">
            {room.id || room._id} •{" "}
            {pick(
              "Assigned",
              "দায়িত্বপ্রাপ্ত"
            )}
            :{" "}
            {room.assignedAdmin ||
              pick(
                "Awaiting assignment",
                "দায়িত্ব দেওয়ার অপেক্ষায়"
              )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge
            status={room.status}
          />

          <StatusBadge
            status={room.priority}
          />
        </div>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_300px]">
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4 text-xs text-archive-muted">
            <LockKeyhole className="h-4 w-4 text-archive-teal" />

            {pick(
              "Only you and authorised support administrators can view this room.",
              "শুধু আপনি এবং অনুমোদিত সহায়তা অ্যাডমিনরা এই কক্ষ দেখতে পারবেন।"
            )}
          </div>

          <div className="max-h-[620px] min-h-[430px] space-y-4 overflow-y-auto p-5 sm:p-6">
            {messages.length ? (
              messages.map(
                (item, index) => {
                  const ownMessage =
                    isUserMessage(
                      item,
                      user
                    );

                  return (
                    <div
                      key={
                        item.id ||
                        item._id ||
                        `${item.sender}-${item.time}-${index}`
                      }
                      className={`max-w-[92%] rounded-2xl p-4 sm:max-w-[88%] ${
                        ownMessage
                          ? "ml-auto rounded-tr-sm border border-archive-amber/20 bg-archive-amber/10"
                          : "rounded-tl-sm border border-white/10 bg-white/[0.045]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p
                          className={`text-xs font-semibold ${
                            ownMessage
                              ? "text-archive-amber"
                              : "text-archive-teal"
                          }`}
                        >
                          {item.name ||
                            (ownMessage
                              ? pick(
                                  "You",
                                  "আপনি"
                                )
                              : pick(
                                  "Support Admin",
                                  "সহায়তা অ্যাডমিন"
                                ))}
                        </p>

                        <p className="text-[11px] text-archive-muted">
                          {formatMessageTime(
                            item.time
                          )}
                        </p>
                      </div>

                      {item.text && (
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#D6D1C9]">
                          {item.text}
                        </p>
                      )}

                      {renderMessageAttachment(
                        item.attachment
                      )}
                    </div>
                  );
                }
              )
            ) : (
              <div className="grid min-h-[360px] place-items-center text-center text-sm text-archive-muted">
                {pick(
                  "No messages yet. An authorised administrator will reply here.",
                  "এখনও কোনো বার্তা নেই। একজন অনুমোদিত অ্যাডমিন এখানে উত্তর দেবেন।"
                )}
              </div>
            )}

            <div ref={endRef} />
          </div>

          {roomStopped ? (
            <div className="border-t border-white/10 p-5">
              <div className="rounded-2xl border border-archive-rose/25 bg-archive-rose/[0.07] p-5 text-center">
                <LockKeyhole className="mx-auto h-7 w-7 text-archive-rose" />
                <h3 className="mt-3 font-display text-2xl font-semibold">{pick("This support room was stopped by an administrator", "একজন অ্যাডমিন এই সহায়তা কক্ষটি বন্ধ করেছেন")}</h3>
                <p className="mt-3 text-sm leading-7 text-[#DAB8BE]">{room.stoppedReason || room.stopReason || pick("You can read the previous conversation, but new messages cannot be sent.", "আপনি আগের কথোপকথন দেখতে পারবেন, তবে নতুন বার্তা পাঠাতে পারবেন না।")}</p>
              </div>
            </div>
          ) : (
          <form
            ref={formRef}
            onSubmit={send}
            className="sticky bottom-0 border-t border-white/10 bg-ink-900/95 p-4 backdrop-blur"
          >
            {attachment && (
              <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-black/15">
                {selectedPreviewUrl ? (
                  <div className="relative bg-black/25 p-2">
                    <img
                      src={
                        selectedPreviewUrl
                      }
                      alt={`${pick(
                        "Selected attachment preview",
                        "নির্বাচিত সংযুক্তির প্রিভিউ"
                      )}: ${
                        attachment.name
                      }`}
                      className="mx-auto max-h-72 w-full rounded-lg object-contain"
                    />

                    <button
                      type="button"
                      onClick={
                        clearAttachment
                      }
                      className="focus-ring absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/70 text-white hover:bg-black"
                      aria-label={pick(
                        "Remove selected attachment",
                        "নির্বাচিত সংযুক্তি সরান"
                      )}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3">
                    <FileText className="h-5 w-5 shrink-0 text-archive-amber" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[#DDD7CE]">
                        {attachment.name}
                      </p>

                      <p className="mt-0.5 text-xs text-archive-muted">
                        {formatFileSize(
                          attachment.size
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="focus-ring p-2 text-archive-rose"
                      onClick={
                        clearAttachment
                      }
                      aria-label={pick(
                        "Remove selected attachment",
                        "নির্বাচিত সংযুক্তি সরান"
                      )}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() =>
                  fileRef.current?.click()
                }
                className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 text-archive-muted hover:border-archive-amber/30 hover:text-white"
                aria-label={pick(
                  "Attach requested document or image",
                  "চাওয়া নথি বা ছবি সংযুক্ত করুন"
                )}
              >
                <Paperclip className="h-5 w-5" />
              </button>

              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={
                  selectAttachment
                }
              />

              <textarea
                rows={2}
                className="field-control min-h-11 resize-none"
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleMessageKeyDown
                }
                placeholder={pick(
                  "Write a private message",
                  "ব্যক্তিগত বার্তা লিখুন"
                )}
                aria-label={pick(
                  "Message",
                  "বার্তা"
                )}
              />

              <Button
                type="submit"
                loading={sending}
                disabled={
                  sending ||
                  (!message.trim() &&
                    !attachment)
                }
                aria-label={pick(
                  "Send message",
                  "বার্তা পাঠান"
                )}
              >
                <Send className="h-4 w-4" />

                <span className="hidden sm:inline">
                  {pick(
                    "Send",
                    "পাঠান"
                  )}
                </span>
              </Button>
            </div>

            <p className="mt-2 pl-[52px] text-[10px] text-archive-muted">
              {pick(
                "Enter to send • Shift + Enter for a new line",
                "পাঠাতে Enter • নতুন লাইনের জন্য Shift + Enter"
              )}
            </p>
          </form>
          )}
        </section>

        <aside className="space-y-5">
          <div className="surface-card rounded-2xl p-5">
            <h2 className="font-display text-2xl font-semibold">
              {pick(
                "Case progress",
                "কেসের অগ্রগতি"
              )}
            </h2>

            <div className="mt-5 space-y-0">
              {progress.map(
                (item, index) => (
                  <div
                    key={item.label}
                    className="relative flex gap-3 pb-5 last:pb-0"
                  >
                    <span
                      className={`relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                        item.done
                          ? "border-archive-teal/30 bg-archive-teal/10 text-archive-teal"
                          : "border-white/10 bg-ink-900 text-archive-muted"
                      }`}
                    >
                      {item.done ? (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      ) : (
                        index + 1
                      )}
                    </span>

                    {index <
                      progress.length -
                        1 && (
                      <span className="absolute left-[13px] top-7 h-full w-px bg-white/10" />
                    )}

                    <p
                      className={`text-sm ${
                        item.done
                          ? "text-white"
                          : "text-archive-muted"
                      }`}
                    >
                      {item.label}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-archive-amber/20 bg-archive-amber/[0.06] p-5">
            <FileText className="h-5 w-5 text-archive-amber" />

            <h2 className="mt-3 font-semibold">
              {pick(
                "Document safety",
                "নথির নিরাপত্তা"
              )}
            </h2>

            <p className="mt-2 text-sm leading-6 text-archive-muted">
              {pick(
                "Upload only a specifically requested document. Never send passwords, full national ID or unrelated records.",
                "শুধু নির্দিষ্টভাবে চাওয়া নথি আপলোড করুন। পাসওয়ার্ড, সম্পূর্ণ জাতীয় পরিচয়পত্র বা অপ্রাসঙ্গিক নথি পাঠাবেন না।"
              )}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}