import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  Paperclip,
  Plus,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import StatusBadge from "../../components/ui/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import useFilePreview from "../../hooks/useFilePreview";
import { userApi, unwrap } from "../../lib/api";
import {
  filterOwnedRecords,
  getRecordId,
  getRecordOwnerIdentitySet,
  isOwnedByUser,
  mergeUniqueRecords,
} from "../../lib/ownership";
import { STORAGE_KEYS, storage } from "../../lib/storage";
import {
  applySupportRoomOverride,
  applySupportRoomOverrides,
  isSupportRoomStopped,
  SUPPORT_ROOM_EVENT,
} from "../../lib/supportRoomState";
import { makeId } from "../../lib/utils";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const MESSAGE_REFRESH_INTERVAL = 3000;
const BANGLADESH_TIME_ZONE = "Asia/Dhaka";
const BANGLADESH_UTC_OFFSET = "+06:00";
const EARLIEST_VALID_SUPPORT_TIME = Date.UTC(2024, 6, 1);
const MAX_FUTURE_TIME_DRIFT = 10 * 60 * 1000;

const MONTH_INDEX = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const formatFileSize = (size = 0) => {
  if (!size) return "";

  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getBangladeshDateParts = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BANGLADESH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return parts.reduce((result, part) => {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }

    return result;
  }, {});
};

const isValidSupportDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return false;
  }

  const timestamp = date.getTime();

  return (
    timestamp >= EARLIEST_VALID_SUPPORT_TIME &&
    timestamp <= Date.now() + MAX_FUTURE_TIME_DRIFT
  );
};

const getObjectIdDate = (value) => {
  const id = String(value || "").trim();

  if (!/^[a-f\d]{24}$/i.test(id)) {
    return null;
  }

  const timestamp = Number.parseInt(id.slice(0, 8), 16) * 1000;
  const date = new Date(timestamp);

  return isValidSupportDate(date) ? date : null;
};

const getReferenceYear = (referenceId) => {
  const objectIdDate = getObjectIdDate(referenceId);
  const objectIdParts = getBangladeshDateParts(objectIdDate);

  if (objectIdParts?.year) {
    return Number(objectIdParts.year);
  }

  const value = String(referenceId || "");

  /*
   * Support-room IDs include a date block, for example:
   * JS-HELP-20260730-28043F56
   */
  const supportIdMatch = value.match(/((?:19|20)\d{2})\d{4}/);

  if (supportIdMatch) {
    return Number(supportIdMatch[1]);
  }

  const currentParts = getBangladeshDateParts(new Date());

  return Number(currentParts?.year) || new Date().getUTCFullYear();
};

const parseBackendDisplayTime = (value, referenceId) => {
  const match = String(value || "")
    .trim()
    .match(
      /^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
    );

  if (!match) {
    return null;
  }

  const monthIndex = MONTH_INDEX[match[1].toLowerCase()];
  const day = Number(match[2]);
  let hour = Number(match[3]);
  const minute = Number(match[4]);
  const period = match[5].toUpperCase();

  if (
    monthIndex === undefined ||
    day < 1 ||
    day > 31 ||
    hour < 1 ||
    hour > 12 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  if (hour === 12) {
    hour = 0;
  }

  if (period === "PM") {
    hour += 12;
  }

  let year = getReferenceYear(referenceId);

  const createDate = (selectedYear) =>
    new Date(
      `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}` +
        `-${String(day).padStart(2, "0")}` +
        `T${String(hour).padStart(2, "0")}` +
        `:${String(minute).padStart(2, "0")}:00${BANGLADESH_UTC_OFFSET}`,
    );

  let date = createDate(year);

  /*
   * When no usable reference ID exists near New Year, avoid assigning
   * a future December date to a message received in early January.
   */
  if (
    !getObjectIdDate(referenceId) &&
    date.getTime() > Date.now() + 45 * 24 * 60 * 60 * 1000
  ) {
    year -= 1;
    date = createDate(year);
  }

  return isValidSupportDate(date) ? date : null;
};

const parseSupportDate = (rawValue, referenceId) => {
  if (
    rawValue === null ||
    rawValue === undefined ||
    rawValue === ""
  ) {
    return null;
  }

  if (rawValue instanceof Date) {
    const copiedDate = new Date(rawValue.getTime());
    return isValidSupportDate(copiedDate) ? copiedDate : null;
  }

  const displayDate = parseBackendDisplayTime(rawValue, referenceId);

  if (displayDate) {
    return displayDate;
  }

  if (
    typeof rawValue === "number" ||
    /^\d{9,16}$/.test(String(rawValue).trim())
  ) {
    let numericValue = Number(rawValue);

    if (!Number.isFinite(numericValue)) {
      return null;
    }

    if (numericValue < 100000000000) {
      numericValue *= 1000;
    }

    if (numericValue > 100000000000000) {
      numericValue /= 1000;
    }

    const numericDate = new Date(numericValue);

    return isValidSupportDate(numericDate) ? numericDate : null;
  }

  const value = String(rawValue).trim();

  /*
   * Treat timezone-less ISO strings as UTC. Fully qualified ISO strings,
   * including values with Z or an offset, are parsed normally.
   */
  const normalisedValue =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(
      value,
    )
      ? `${value}Z`
      : value;

  const date = new Date(normalisedValue);

  return isValidSupportDate(date) ? date : null;
};

const getMessageDate = (message) => {
  if (!message || typeof message !== "object") {
    return null;
  }

  const referenceId = message.id || message._id;
  const candidates = [
    message.sentAt,
    message.createdAt,
    message.timestamp,
    message.updatedAt,
    message.time,
  ];

  for (const candidate of candidates) {
    const parsed = parseSupportDate(candidate, referenceId);

    if (parsed) {
      return parsed;
    }
  }

  return getObjectIdDate(referenceId);
};

const getRoomDate = (room) => {
  if (!room || typeof room !== "object") {
    return null;
  }

  const referenceId = room._id || room.id;
  const candidates = [
    room.updatedAt,
    room.lastMessageAt,
    room.createdAt,
  ];

  for (const candidate of candidates) {
    const parsed = parseSupportDate(candidate, referenceId || room.id);

    if (parsed) {
      return parsed;
    }
  }

  return getObjectIdDate(room._id);
};

const formatMessageTime = (message) => {
  const date = getMessageDate(message);

  if (!date) {
    return "";
  }

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

const formatSidebarTime = (room) => {
  const date = getRoomDate(room);

  if (!date) {
    return "";
  }

  const dateParts = getBangladeshDateParts(date);
  const todayParts = getBangladeshDateParts(new Date());

  const sameDay =
    dateParts?.year === todayParts?.year &&
    dateParts?.month === todayParts?.month &&
    dateParts?.day === todayParts?.day;

  return new Intl.DateTimeFormat("en-BD", {
    timeZone: BANGLADESH_TIME_ZONE,
    ...(sameDay
      ? {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      : {
          day: "2-digit",
          month: "short",
        }),
  }).format(date);
};

const normaliseAttachment = (attachment) => {
  if (!attachment) return null;

  if (typeof attachment === "string") {
    return {
      name: attachment.split("/").pop() || "Attachment",
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
    size: attachment.size || attachment.fileSize || 0,
    url:
      attachment.url ||
      attachment.secureUrl ||
      attachment.secure_url ||
      attachment.fileUrl ||
      attachment.path ||
      "",
  };
};

const normaliseMessage = (item, index = 0) => {
  const source = item && typeof item === "object" ? item : {};
  const senderObject =
    source.sender && typeof source.sender === "object" ? source.sender : null;

  const sender =
    senderObject?.role ||
    source.senderRole ||
    source.senderType ||
    source.role ||
    source.sender ||
    "admin";

  const attachment = normaliseAttachment(
    source.attachment ||
      source.file ||
      source.upload ||
      (source.attachmentName
        ? {
            name: source.attachmentName,
            type: source.attachmentType,
            size: source.attachmentSize,
            url: source.attachmentUrl || source.fileUrl,
          }
        : null),
  );

  return {
    ...source,
    id: source.id || source._id || `message-${index}`,
    sender: typeof sender === "string" ? sender : "admin",
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
      (String(sender).toLowerCase().includes("admin")
        ? "Support Admin"
        : "Requester"),
    text:
      source.text ||
      source.content ||
      source.body ||
      (typeof source.message === "string" ? source.message : ""),
    time: source.time || source.createdAt || source.updatedAt || "",
    attachment,
  };
};

const normaliseStoredMessages = (items = []) =>
  ensureArray(items).map((item, index) => {
    const message = normaliseMessage(item, index);

    if (message.attachment?.url?.startsWith("blob:")) {
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

const getMessageSignature = (message) => {
  const attachment = normaliseAttachment(message?.attachment);

  return [
    String(message?.sender || "").toLowerCase(),
    String(message?.text || "").trim(),
    attachment?.name || "",
    String(message?.time || ""),
  ].join("|");
};

const mergeMessages = (currentMessages, remoteMessages) => {
  const map = new Map();

  normaliseStoredMessages(currentMessages).forEach((message) => {
    map.set(message.id || getMessageSignature(message), message);
  });

  normaliseStoredMessages(remoteMessages).forEach((message) => {
    const key = message.id || getMessageSignature(message);
    const existing = map.get(key) || {};
    map.set(key, { ...existing, ...message, optimistic: false });
  });

  return Array.from(map.values()).sort((left, right) => {
    const leftTime = getMessageDate(left)?.getTime() || 0;
    const rightTime = getMessageDate(right)?.getTime() || 0;

    return leftTime - rightTime;
  });
};

const extractRooms = (payload) => {
  const data = unwrap(payload);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rooms)) return data.rooms;
  if (Array.isArray(data?.supportRooms)) return data.supportRooms;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const extractRoomPayload = (payload) => {
  const data = unwrap(payload);

  if (!data || typeof data !== "object") {
    return { room: null, messages: null };
  }

  const room =
    data.room ||
    data.supportRoom ||
    data.case ||
    data.supportCase ||
    (data.id || data._id ? data : null);

  const messages =
    data.messages ||
    data.supportMessages ||
    data.chatMessages ||
    room?.messages ||
    room?.supportMessages ||
    null;

  return {
    room,
    messages: Array.isArray(messages) ? messages : null,
  };
};

const getRoomTimestamp = (room) => getRoomDate(room)?.getTime() || 0;

const sortRooms = (rooms) =>
  [...rooms].sort((left, right) => getRoomTimestamp(right) - getRoomTimestamp(left));

const requesterNameMatches = (room, user) => {
  const userName = String(user?.name || "").trim().toLowerCase();

  if (!userName) return false;

  const candidate =
    typeof room?.requester === "string"
      ? room.requester
      : room?.requesterName || room?.ownerName || "";

  return String(candidate).trim().toLowerCase() === userName;
};

const roomBelongsToUser = (room, user, locallyOwnedIds = [], trustedRoomIds = []) => {
  if (!room) return false;
  if (isOwnedByUser(room, user, locallyOwnedIds)) return true;
  if (requesterNameMatches(room, user)) return true;

  const roomId = getRecordId(room);
  return Boolean(roomId && trustedRoomIds.map(String).includes(String(roomId)));
};

const filterRoomsFromMyEndpoint = (records, user, locallyOwnedIds) =>
  ensureArray(records).filter((room) => {
    if (roomBelongsToUser(room, user, locallyOwnedIds)) return true;

    const owners = getRecordOwnerIdentitySet(room);
    return owners.size === 0;
  });

const isUserMessage = (message, user) => {
  const role = String(message?.sender || "").toLowerCase();

  if (["user", "requester", "member"].includes(role)) {
    return true;
  }

  const currentUserId = user?._id || user?.id;

  return Boolean(
    currentUserId &&
      message?.senderId &&
      String(currentUserId) === String(message.senderId),
  );
};

const isImageFile = (file) => {
  if (!file) return false;
  if (file.type?.startsWith("image/")) return true;
  return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(file.name || file.url || "");
};

export default function SupportRoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { pick } = useLanguage();

  const fileRef = useRef(null);
  const formRef = useRef(null);
  const textareaRef = useRef(null);
  const messageListRef = useRef(null);
  const refreshRoomRef = useRef(null);
  const createdObjectUrls = useRef([]);

  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accessState, setAccessState] = useState("checking");
  const [loadError, setLoadError] = useState("");

  const selectedPreviewUrl = useFilePreview(attachment);

  const readLocalRooms = useCallback(() => {
    const stored = storage.get(STORAGE_KEYS.supportRooms, []);
    return filterOwnedRecords(stored, user);
  }, [user]);

  const readStoredMessages = useCallback(
    (id) => {
      const stored = storage.get(STORAGE_KEYS.roomMessages, {});
      return normaliseStoredMessages(stored[id] || []);
    },
    [],
  );

  const updateMessages = useCallback(
    (updater) => {
      setMessages((current) => {
        const next =
          typeof updater === "function" ? updater(current) : updater;

        const normalised = normaliseStoredMessages(next);
        const storedMessages = storage.get(STORAGE_KEYS.roomMessages, {});

        storage.set(STORAGE_KEYS.roomMessages, {
          ...storedMessages,
          [roomId]: normalised,
        });

        return normalised;
      });
    },
    [roomId],
  );

  const updateLocalRoom = useCallback(
    (values) => {
      const storedRooms = storage.get(STORAGE_KEYS.supportRooms, []);
      let changed = false;

      const nextStoredRooms = storedRooms.map((item) => {
        if (String(getRecordId(item)) !== String(roomId)) {
          return item;
        }

        changed = true;
        return { ...item, ...values };
      });

      if (changed) {
        storage.set(STORAGE_KEYS.supportRooms, nextStoredRooms);
      }

      setRoom((current) => (current ? { ...current, ...values } : current));
      setRooms((current) =>
        sortRooms(
          current.map((item) =>
            String(getRecordId(item)) === String(roomId)
              ? { ...item, ...values }
              : item,
          ),
        ),
      );
    },
    [roomId],
  );

  useEffect(() => {
    const localRooms = applySupportRoomOverrides(readLocalRooms());
    const localRoom = localRooms.find(
      (item) => String(getRecordId(item)) === String(roomId),
    );

    setRooms(sortRooms(localRooms));
    setRoom(localRoom ? applySupportRoomOverride(localRoom) : null);
    setMessages(localRoom ? readStoredMessages(roomId) : []);
    setAccessState(localRoom ? "allowed" : "checking");
    setLoadError("");
    setLoading(true);
    setMessage("");
    setAttachment(null);

    if (fileRef.current) fileRef.current.value = "";
    if (textareaRef.current) textareaRef.current.style.height = "44px";
  }, [readLocalRooms, readStoredMessages, roomId]);

  useEffect(() => {
    let active = true;
    let requestInProgress = false;

    const loadWorkspace = async ({ initial = false, showLoader = false } = {}) => {
      if (requestInProgress || !roomId) return;

      requestInProgress = true;

      if (showLoader && active) {
        setRefreshing(true);
      }

      const localRooms = readLocalRooms();
      const localIds = localRooms.map(getRecordId).filter(Boolean);

      try {
        const [roomsResult, roomResult] = await Promise.allSettled([
          userApi.getSupportRooms(),
          userApi.getSupportRoom(roomId),
        ]);

        if (!active) return;

        const remoteRooms =
          roomsResult.status === "fulfilled"
            ? extractRooms(roomsResult.value)
            : [];

        const ownedRemoteRooms = filterRoomsFromMyEndpoint(
          remoteRooms,
          user,
          localIds,
        );

        const nextRooms = sortRooms(
          applySupportRoomOverrides(
            mergeUniqueRecords(localRooms, ownedRemoteRooms),
          ).filter((item) => !item.hiddenFromUser),
        );

        setRooms(nextRooms);

        const trustedRoomIds = nextRooms.map(getRecordId).filter(Boolean);
        const roomFromList = nextRooms.find(
          (item) => String(getRecordId(item)) === String(roomId),
        );

        const detail =
          roomResult.status === "fulfilled"
            ? extractRoomPayload(roomResult.value)
            : { room: null, messages: null };

        const detailAllowed =
          detail.room &&
          roomBelongsToUser(
            detail.room,
            user,
            localIds,
            trustedRoomIds,
          );

        if (detail.room && !detailAllowed) {
          setRoom(null);
          setMessages([]);
          setAccessState("denied");
          setLoadError(
            pick(
              "This support room does not belong to your account.",
              "এই সহায়তা কক্ষটি আপনার অ্যাকাউন্টের নয়।",
            ),
          );
          return;
        }

        const nextRoom = detailAllowed
          ? applySupportRoomOverride({ ...roomFromList, ...detail.room })
          : roomFromList
            ? applySupportRoomOverride(roomFromList)
            : null;

        if (!nextRoom) {
          setRoom(null);
          setMessages([]);
          setAccessState("not-found");
          setLoadError(
            roomResult.status === "rejected"
              ? roomResult.reason?.message ||
                  pick(
                    "The support room could not be loaded.",
                    "সহায়তা কক্ষটি লোড করা যায়নি।",
                  )
              : pick(
                  "The support room could not be found.",
                  "সহায়তা কক্ষটি পাওয়া যায়নি।",
                ),
          );
          return;
        }

        setRoom(nextRoom);
        setAccessState("allowed");
        setLoadError("");

        if (Array.isArray(detail.messages)) {
          updateMessages((current) => mergeMessages(current, detail.messages));
        }

        if (
          roomsResult.status === "rejected" &&
          roomResult.status === "rejected" &&
          !initial
        ) {
          setLoadError(
            pick(
              "Live updates are temporarily unavailable. You can still view saved messages.",
              "লাইভ হালনাগাদ সাময়িকভাবে পাওয়া যাচ্ছে না। সংরক্ষিত বার্তা এখনো দেখতে পারবেন।",
            ),
          );
        }
      } catch (error) {
        if (!active) return;

        console.error("Unable to refresh support room:", error);

        const localRoom = localRooms.find(
          (item) => String(getRecordId(item)) === String(roomId),
        );

        if (localRoom) {
          setRoom(applySupportRoomOverride(localRoom));
          setAccessState("allowed");
          setLoadError(
            pick(
              "Live updates are unavailable. Showing the room saved on this device.",
              "লাইভ হালনাগাদ পাওয়া যাচ্ছে না। এই ডিভাইসে সংরক্ষিত কক্ষ দেখানো হচ্ছে।",
            ),
          );
        } else {
          setRoom(null);
          setAccessState("not-found");
          setLoadError(
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
          setLoading(false);
        }
      }
    };

    refreshRoomRef.current = loadWorkspace;
    void loadWorkspace({ initial: true, showLoader: true });

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadWorkspace();
      }
    }, MESSAGE_REFRESH_INTERVAL);

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void loadWorkspace({ showLoader: true });
      }
    };

    const refreshOverrides = () => {
      if (!active) return;

      setRoom((current) => (current ? applySupportRoomOverride(current) : current));
      setRooms((current) => sortRooms(applySupportRoomOverrides(current)));
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("online", refreshWhenVisible);
    window.addEventListener(SUPPORT_ROOM_EVENT, refreshOverrides);
    window.addEventListener("storage", refreshOverrides);

    return () => {
      active = false;
      refreshRoomRef.current = null;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("online", refreshWhenVisible);
      window.removeEventListener(SUPPORT_ROOM_EVENT, refreshOverrides);
      window.removeEventListener("storage", refreshOverrides);
    };

    // Context helpers may be recreated by providers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readLocalRooms, roomId, updateMessages, user]);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;

    const frameId = window.requestAnimationFrame(() => {
      list.scrollTo({
        top: list.scrollHeight,
        behavior: messages.length > 1 ? "smooth" : "auto",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [messages.length, roomId]);

  useEffect(() => {
    return () => {
      createdObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      createdObjectUrls.current = [];
    };
  }, []);

  const clearAttachment = () => {
    setAttachment(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const selectAttachment = (event) => {
    const file = event.target.files?.[0] || null;

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
          "একটি ছবি অথবা PDF ফাইল নির্বাচন করুন।",
        ),
      );
      clearAttachment();
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error(
        pick(
          "The attachment must be 10 MB or smaller.",
          "সংযুক্তি ১০ এমবি বা ছোট হতে হবে।",
        ),
      );
      clearAttachment();
      return;
    }

    setAttachment(file);
  };

  const handleMessageChange = (event) => {
    setMessage(event.target.value);

    const target = event.target;
    target.style.height = "44px";
    target.style.height = `${Math.min(target.scrollHeight, 124)}px`;
  };

  const send = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    const stopped = isSupportRoomStopped(room);

    if (stopped) {
      toast.warning(
        pick(
          "This support room has been stopped by an administrator.",
          "একজন অ্যাডমিন এই সহায়তা কক্ষটি বন্ধ করেছেন।",
        ),
      );
      return;
    }

    if ((!trimmedMessage && !attachment) || sending || accessState !== "allowed") {
      return;
    }

    setSending(true);

    try {
      const formData = new FormData();
      formData.append("message", trimmedMessage);

      if (attachment) {
        formData.append("file", attachment);
      }

      const response = await userApi.sendSupportMessage(roomId, formData);
      const responseData = unwrap(response);

      const serverMessage =
        responseData?.supportMessage ||
        responseData?.newMessage ||
        responseData?.messageData ||
        (responseData?.message && typeof responseData.message === "object"
          ? responseData.message
          : null) ||
        (responseData &&
        typeof responseData === "object" &&
        (responseData.id ||
          responseData._id ||
          responseData.text ||
          responseData.content)
          ? responseData
          : null);

      const uploadedAttachment = normaliseAttachment(
        serverMessage?.attachment ||
          serverMessage?.file ||
          responseData?.attachment ||
          response?.data?.attachment ||
          response?.attachment ||
          response?.file ||
          (responseData?.fileUrl ? { url: responseData.fileUrl } : null),
      );

      let localUrl = "";

      if (attachment && !uploadedAttachment?.url) {
        localUrl = URL.createObjectURL(attachment);
        createdObjectUrls.current.push(localUrl);
      }

      const finalAttachment = attachment
        ? {
            name: uploadedAttachment?.name || attachment.name,
            type: uploadedAttachment?.type || attachment.type,
            size: uploadedAttachment?.size || attachment.size,
            url: uploadedAttachment?.url || localUrl,
          }
        : uploadedAttachment;

      const nextMessage = normaliseMessage({
        ...(serverMessage || {}),
        id: serverMessage?.id || serverMessage?._id || makeId("MSG"),
        sender:
          serverMessage?.sender || serverMessage?.senderRole || "user",
        senderId:
          serverMessage?.senderId || user?._id || user?.id || "",
        name:
          serverMessage?.name ||
          serverMessage?.senderName ||
          user?.name ||
          "You",
        text:
          serverMessage?.text ||
          serverMessage?.content ||
          (typeof serverMessage?.message === "string"
            ? serverMessage.message
            : trimmedMessage),
        attachment:
          serverMessage?.attachment || serverMessage?.file || finalAttachment,
        time:
          serverMessage?.time ||
          serverMessage?.createdAt ||
          new Date().toISOString(),
        optimistic: !serverMessage,
      });

      updateMessages((current) => [...current, nextMessage]);

      const updatedAt = nextMessage.time || new Date().toISOString();
      updateLocalRoom({
        updatedAt,
        lastMessageAt: updatedAt,
        lastMessage: trimmedMessage || attachment?.name || "Attachment",
        unread: 0,
      });

      setMessage("");
      clearAttachment();

      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
      }

      window.setTimeout(() => {
        void refreshRoomRef.current?.();
      }, 350);
    } catch (error) {
      console.error("Unable to send support message:", error);

      toast.error(
        error?.message ||
          pick(
            "The message could not be sent.",
            "বার্তা পাঠানো যায়নি।",
          ),
      );
    } finally {
      setSending(false);
    }
  };

  const handleMessageKeyDown = (event) => {
    const isComposing =
      event.nativeEvent?.isComposing || event.isComposing;

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
      (!message.trim() && !attachment) ||
      isSupportRoomStopped(room)
    ) {
      return;
    }

    formRef.current?.requestSubmit();
  };

  const filteredRooms = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) return rooms;

    return rooms.filter((item) =>
      [
        getRecordId(item),
        item.title,
        item.status,
        item.assignedAdmin,
        item.lastMessage,
        item.summary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, rooms]);

  const renderAttachment = (rawAttachment) => {
    const file = normaliseAttachment(rawAttachment);
    if (!file) return null;

    const image = isImageFile(file);

    if (image && file.url) {
      return (
        <figure className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <img
            src={file.url}
            alt={`${pick("Support attachment", "সহায়তা সংযুক্তি")}: ${file.name}`}
            className="max-h-72 w-full object-contain"
          />

          <figcaption className="flex items-center justify-between gap-3 border-t border-white/10 px-3 py-2 text-[11px] text-archive-muted">
            <span className="min-w-0 truncate">{file.name}</span>
            {file.size > 0 && <span className="shrink-0">{formatFileSize(file.size)}</span>}
          </figcaption>
        </figure>
      );
    }

    return (
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 p-3 text-xs">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-archive-amber/10 text-archive-amber">
          {image ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[#DDD7CE]">{file.name}</p>
          <p className="mt-1 text-[11px] text-archive-muted">
            {file.size > 0
              ? formatFileSize(file.size)
              : pick("Protected attachment", "সুরক্ষিত সংযুক্তি")}
          </p>
        </div>

        {file.url && (
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="focus-ring shrink-0 rounded-lg border border-white/10 px-3 py-2 font-semibold text-archive-amber transition hover:bg-white/5"
          >
            {pick("Open", "খুলুন")}
          </a>
        )}
      </div>
    );
  };

  const stopped = isSupportRoomStopped(room);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0B0E16] shadow-2xl">
      <div className="grid h-[calc(100dvh-14rem)] min-h-[540px] lg:h-[calc(100dvh-9rem)] lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 flex-col border-r border-white/[0.08] bg-[#0E111A] lg:flex">
          <div className="shrink-0 border-b border-white/[0.08] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">{pick("Private messages", "ব্যক্তিগত বার্তা")}</p>
                <h1 className="mt-1 font-display text-2xl font-semibold">
                  {pick("Support Rooms", "সহায়তা কক্ষ")}
                </h1>
              </div>

              <Link
                to="/support/new"
                className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-archive-amber to-archive-copper text-ink-950 transition hover:scale-105"
                aria-label={pick("New support request", "নতুন সহায়তা অনুরোধ")}
              >
                <Plus className="h-4 w-4" />
              </Link>
            </div>

            <label className="relative mt-4 block">
              <span className="sr-only">{pick("Search rooms", "কক্ষ খুঁজুন")}</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-archive-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="field-control h-11 pl-10"
                placeholder={pick("Search conversations", "কথোপকথন খুঁজুন")}
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
            {filteredRooms.length ? (
              <div className="space-y-1.5">
                {filteredRooms.map((item) => {
                  const id = getRecordId(item);
                  const active = String(id) === String(roomId);

                  return (
                    <Link
                      key={id}
                      to={`/account/support-rooms/${encodeURIComponent(id)}`}
                      className={`focus-ring block rounded-2xl border p-3 transition-all duration-200 ${
                        active
                          ? "border-archive-teal/25 bg-archive-teal/[0.09] shadow-lg"
                          : "border-transparent hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full border ${
                          active
                            ? "border-archive-teal/30 bg-archive-teal/15 text-archive-teal"
                            : "border-white/10 bg-white/[0.04] text-archive-muted"
                        }`}>
                          <MessageSquareText className="h-5 w-5" />
                          {Number(item.unread) > 0 && (
                            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-archive-rose px-1 text-[10px] font-bold text-white">
                              {item.unread}
                            </span>
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-white">
                              {item.title || pick("Support request", "সহায়তা অনুরোধ")}
                            </p>
                            <span className="shrink-0 text-[10px] text-archive-muted">
                              {formatSidebarTime(item)}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-archive-muted">
                            {item.lastMessage || item.summary || pick("Open conversation", "কথোপকথন খুলুন")}
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="truncate text-[10px] text-archive-muted">
                              {item.assignedAdmin || pick("Awaiting admin", "অ্যাডমিনের অপেক্ষায়")}
                            </span>
                            <StatusBadge status={item.status || "Under review"} className="shrink-0" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="grid h-full place-items-center px-5 text-center text-sm text-archive-muted">
                {pick("No rooms match your search.", "আপনার খোঁজের সঙ্গে কোনো কক্ষ মেলেনি।")}
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-[#0B0E16]">
          <header className="shrink-0 border-b border-white/[0.08] bg-[#0D1018]/95 px-4 py-3 backdrop-blur-xl sm:px-5">
            <div className="flex items-center gap-3">
              <Link
                to="/account/support-rooms"
                className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 text-archive-muted transition hover:bg-white/5 hover:text-white lg:hidden"
                aria-label={pick("Back to rooms", "কক্ষে ফিরুন")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>

              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-archive-teal/20 bg-archive-teal/10 text-archive-teal">
                <UserRound className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-semibold text-white">
                    {room?.title || pick("Private support room", "ব্যক্তিগত সহায়তা কক্ষ")}
                  </h2>

                  {refreshing && <Loader2 className="h-3.5 w-3.5 animate-spin text-archive-teal" />}
                </div>

                <p className="mt-1 truncate text-xs text-archive-muted">
                  {room
                    ? `${getRecordId(room)} • ${room.assignedAdmin || pick("Awaiting admin assignment", "অ্যাডমিন দায়িত্বের অপেক্ষায়")}`
                    : pick("Loading private conversation", "ব্যক্তিগত কথোপকথন লোড হচ্ছে")}
                </p>
              </div>

              {room && (
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  <StatusBadge status={room.status || "Under review"} />
                  {room.priority && <StatusBadge status={room.priority} />}
                </div>
              )}
            </div>
          </header>

          {loadError && accessState === "allowed" && (
            <div className="shrink-0 border-b border-archive-amber/15 bg-archive-amber/[0.05] px-4 py-2.5 text-xs text-[#E6C79F] sm:px-5">
              <AlertTriangle className="mr-2 inline h-4 w-4" />
              {loadError}
            </div>
          )}

          {accessState === "allowed" && (
            <div className="shrink-0 border-b border-white/[0.06] bg-archive-teal/[0.035] px-4 py-2 text-[11px] text-[#AFCBC6] sm:px-5">
              <LockKeyhole className="mr-2 inline h-3.5 w-3.5 text-archive-teal" />
              {pick(
                "Only you and authorised support administrators can view this conversation.",
                "শুধু আপনি এবং অনুমোদিত সহায়তা অ্যাডমিনরা এই কথোপকথন দেখতে পারবেন।",
              )}
            </div>
          )}

          <div
            ref={messageListRef}
            className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(75,155,141,.055),transparent_32%)] px-3 py-5 sm:px-5"
          >
            {loading || accessState === "checking" ? (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-archive-teal" />
                  <p className="mt-3 text-sm text-archive-muted">
                    {pick("Loading conversation…", "কথোপকথন লোড হচ্ছে…")}
                  </p>
                </div>
              </div>
            ) : accessState === "denied" ? (
              <div className="grid h-full place-items-center p-6 text-center">
                <div className="max-w-md rounded-3xl border border-archive-rose/25 bg-archive-rose/[0.07] p-7">
                  <ShieldCheck className="mx-auto h-10 w-10 text-archive-rose" />
                  <h3 className="mt-4 font-display text-3xl font-semibold">
                    {pick("Private room protected", "ব্যক্তিগত কক্ষ সুরক্ষিত")}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#DAB8BE]">
                    {loadError ||
                      pick(
                        "You cannot view a support room belonging to another account.",
                        "অন্য অ্যাকাউন্টের সহায়তা কক্ষ আপনি দেখতে পারবেন না।",
                      )}
                  </p>
                  <Link
                    to="/account/support-rooms"
                    className="focus-ring mt-5 inline-flex rounded-xl bg-archive-rose px-4 py-3 text-sm font-semibold text-white"
                  >
                    {pick("Return to my rooms", "আমার কক্ষে ফিরুন")}
                  </Link>
                </div>
              </div>
            ) : accessState === "not-found" ? (
              <div className="grid h-full place-items-center p-6 text-center">
                <div className="max-w-md">
                  <MessageSquareText className="mx-auto h-10 w-10 text-archive-muted" />
                  <h3 className="mt-4 font-display text-3xl font-semibold">
                    {pick("Support room unavailable", "সহায়তা কক্ষ পাওয়া যাচ্ছে না")}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-archive-muted">{loadError}</p>
                  <Link
                    to="/account/support-rooms"
                    className="focus-ring mt-5 inline-flex rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-4 py-3 text-sm font-semibold text-ink-950"
                  >
                    {pick("Return to my rooms", "আমার কক্ষে ফিরুন")}
                  </Link>
                </div>
              </div>
            ) : messages.length ? (
              <div className="mx-auto flex max-w-4xl flex-col gap-3">
                {messages.map((item, index) => {
                  const ownMessage = isUserMessage(item, user);

                  return (
                    <div
                      key={item.id || item._id || `${item.sender}-${item.time}-${index}`}
                      className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}
                    >
                      <article
                        className={`max-w-[88%] rounded-3xl border px-4 py-3 shadow-sm sm:max-w-[74%] ${
                          ownMessage
                            ? "rounded-br-md border-archive-amber/20 bg-gradient-to-br from-archive-amber/[0.15] to-archive-copper/[0.08]"
                            : "rounded-bl-md border-white/10 bg-[#151922]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-5">
                          <p className={`text-[11px] font-semibold ${
                            ownMessage ? "text-archive-amber" : "text-archive-teal"
                          }`}>
                            {item.name ||
                              (ownMessage
                                ? pick("You", "আপনি")
                                : pick("Support Admin", "সহায়তা অ্যাডমিন"))}
                          </p>

                          <time className="shrink-0 text-[10px] text-archive-muted">
                            {formatMessageTime(item)}
                          </time>
                        </div>

                        {item.text && (
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#E2DDD5]">
                            {item.text}
                          </p>
                        )}

                        {renderAttachment(item.attachment)}

                        {item.optimistic && (
                          <p className="mt-2 text-right text-[10px] text-archive-muted">
                            {pick("Sending…", "পাঠানো হচ্ছে…")}
                          </p>
                        )}
                      </article>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid h-full place-items-center p-6 text-center">
                <div className="max-w-sm">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-archive-teal/20 bg-archive-teal/10 text-archive-teal">
                    <MessageSquareText className="h-7 w-7" />
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-semibold">
                    {pick("Your private room is ready", "আপনার ব্যক্তিগত কক্ষ প্রস্তুত")}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-archive-muted">
                    {pick(
                      "Write a message or attach an image or PDF below. An authorised administrator will reply here.",
                      "নিচে বার্তা লিখুন অথবা ছবি বা PDF সংযুক্ত করুন। একজন অনুমোদিত অ্যাডমিন এখানে উত্তর দেবেন।",
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {accessState === "allowed" && room && (
            stopped ? (
              <div className="shrink-0 border-t border-archive-rose/20 bg-[#111018] p-4">
                <div className="rounded-2xl border border-archive-rose/25 bg-archive-rose/[0.07] p-4 text-center">
                  <AlertTriangle className="mx-auto h-6 w-6 text-archive-rose" />
                  <p className="mt-2 font-semibold text-white">
                    {pick(
                      "This support room was stopped by an administrator.",
                      "একজন অ্যাডমিন এই সহায়তা কক্ষটি বন্ধ করেছেন।",
                    )}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#DAB8BE]">
                    {room.stoppedReason ||
                      room.stopReason ||
                      pick(
                        "Previous messages remain visible, but new messages and attachments cannot be sent.",
                        "আগের বার্তা দেখা যাবে, তবে নতুন বার্তা বা সংযুক্তি পাঠানো যাবে না।",
                      )}
                  </p>
                </div>
              </div>
            ) : (
              <form
                ref={formRef}
                onSubmit={send}
                className="shrink-0 border-t border-white/[0.08] bg-[#0D1018]/95 p-3 backdrop-blur-xl sm:p-4"
              >
                {attachment && (
                  <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-2.5">
                    {selectedPreviewUrl ? (
                      <img
                        src={selectedPreviewUrl}
                        alt={`${pick("Selected attachment", "নির্বাচিত সংযুক্তি")}: ${attachment.name}`}
                        className="h-20 w-24 shrink-0 rounded-xl bg-black/30 object-contain"
                      />
                    ) : (
                      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-archive-amber/10 text-archive-amber">
                        <FileText className="h-6 w-6" />
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{attachment.name}</p>
                      <p className="mt-1 text-xs text-archive-muted">
                        {formatFileSize(attachment.size)} • {pick("Ready to send", "পাঠানোর জন্য প্রস্তুত")}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={clearAttachment}
                      className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-archive-muted transition hover:bg-white/5 hover:text-white"
                      aria-label={pick("Remove attachment", "সংযুক্তি সরান")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2 transition focus-within:border-archive-teal/30 focus-within:bg-white/[0.05]">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-xl text-archive-muted transition hover:bg-white/[0.07] hover:text-archive-amber"
                    aria-label={pick("Attach image or PDF", "ছবি বা PDF সংযুক্ত করুন")}
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={selectAttachment}
                  />

                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={message}
                    onChange={handleMessageChange}
                    onKeyDown={handleMessageKeyDown}
                    className="min-h-11 max-h-[124px] flex-1 resize-none overflow-y-auto bg-transparent px-2 py-2.5 text-sm leading-6 text-white outline-none placeholder:text-archive-muted"
                    placeholder={pick(
                      "Write a private message…",
                      "ব্যক্তিগত বার্তা লিখুন…",
                    )}
                    aria-label={pick("Message", "বার্তা")}
                  />

                  <button
                    type="submit"
                    disabled={sending || (!message.trim() && !attachment)}
                    className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-archive-amber to-archive-copper text-ink-950 shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={pick("Send message", "বার্তা পাঠান")}
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[10px] text-archive-muted">
                  <span>
                    {pick(
                      "Enter to send • Shift + Enter for a new line",
                      "পাঠাতে Enter • নতুন লাইনের জন্য Shift + Enter",
                    )}
                  </span>

                  <span className="hidden items-center gap-1 sm:inline-flex">
                    <ShieldCheck className="h-3.5 w-3.5 text-archive-teal" />
                    {pick("Private room", "ব্যক্তিগত কক্ষ")}
                  </span>
                </div>
              </form>
            )
          )}
        </section>
      </div>
    </div>
  );
}