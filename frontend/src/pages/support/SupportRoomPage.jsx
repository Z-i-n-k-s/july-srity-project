import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  FileText,
  Image as ImageIcon,
  LockKeyhole,
  Paperclip,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import { demoRoomMessages, demoSupportRooms } from "../../data/demoData";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import useFilePreview from "../../hooks/useFilePreview";
import { userApi, unwrap } from "../../lib/api";
import { STORAGE_KEYS, storage } from "../../lib/storage";
import { makeId } from "../../lib/utils";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const formatFileSize = (size = 0) => {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const normaliseStoredMessages = (items = []) => items.map((item) => {
  if (item?.attachment?.url?.startsWith("blob:")) {
    return { ...item, attachment: { ...item.attachment, url: "" } };
  }
  return item;
});

const getAttachmentInfo = (attachment) => {
  if (!attachment) return null;
  if (typeof attachment === "string") {
    return { name: attachment, type: "", size: 0, url: "" };
  }
  return attachment;
};

export default function SupportRoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const createdObjectUrls = useRef([]);

  const savedRooms = storage.get(STORAGE_KEYS.supportRooms, []);
  const fallbackRoom = [...savedRooms, ...demoSupportRooms].find((item) => item.id === roomId) || {
    id: roomId,
    title: "Support request",
    status: "Under review",
    priority: "Normal",
    assignedAdmin: "Awaiting assignment",
    updatedAt: "Just now",
  };

  const savedMessages = storage.get(STORAGE_KEYS.roomMessages, {});
  const initialMessages = normaliseStoredMessages(savedMessages[roomId] || demoRoomMessages[roomId] || []);
  const [room, setRoom] = useState(fallbackRoom);
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const selectedPreviewUrl = useFilePreview(attachment);

  useEffect(() => () => {
    createdObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    let active = true;
    userApi.getSupportRoom(roomId, { room: fallbackRoom, messages: initialMessages }).then((payload) => {
      if (!active) return;
      const data = unwrap(payload);
      const remoteRoom = data?.room || (data?.id ? data : null);
      const remoteMessages = data?.messages || remoteRoom?.messages;
      if (remoteRoom) setRoom(remoteRoom);
      if (Array.isArray(remoteMessages)) setMessages(normaliseStoredMessages(remoteMessages));
    }).catch(() => {});
    return () => { active = false; };
  }, [roomId]);

  const persist = (next) => {
    setMessages(next);
    storage.set(STORAGE_KEYS.roomMessages, {
      ...storage.get(STORAGE_KEYS.roomMessages, {}),
      [roomId]: next,
    });
  };

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

    const allowed = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!allowed) {
      toast.error("Choose a JPG, PNG, WEBP or PDF file.");
      clearAttachment();
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error("The attachment must be 10 MB or smaller.");
      clearAttachment();
      return;
    }

    setAttachment(file);
  };

  const send = async (event) => {
    event.preventDefault();
    if (!message.trim() && !attachment) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("message", message.trim());
      if (attachment) formData.append("file", attachment);

      const response = await userApi.sendSupportMessage(roomId, formData);
      const uploadedAttachment = response?.data?.attachment || response?.attachment || response?.file;
      const serverUrl = uploadedAttachment?.url || uploadedAttachment?.secureUrl || response?.fileUrl || "";

      let localUrl = "";
      if (attachment?.type?.startsWith("image/") && !serverUrl) {
        localUrl = URL.createObjectURL(attachment);
        createdObjectUrls.current.push(localUrl);
      }

      const nextMessage = {
        id: makeId("MSG"),
        sender: "user",
        name: user?.name || "You",
        text: message.trim(),
        attachment: attachment ? {
          name: uploadedAttachment?.name || attachment.name,
          type: uploadedAttachment?.type || attachment.type,
          size: uploadedAttachment?.size || attachment.size,
          url: serverUrl || localUrl,
        } : null,
        time: "Just now",
      };

      persist([...messages, nextMessage]);
      setMessage("");
      clearAttachment();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const progress = useMemo(() => [
    { label: "Submitted", done: true },
    { label: "Admin review", done: true },
    {
      label: room.status === "Information required" ? "Information required" : "In progress",
      done: room.status !== "Under review",
    },
    { label: "Completed", done: room.status === "Completed" },
  ], [room.status]);

  const renderMessageAttachment = (rawAttachment) => {
    const file = getAttachmentInfo(rawAttachment);
    if (!file) return null;

    const isImage = file.type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(file.name || "");

    if (isImage && file.url) {
      return (
        <figure className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="focus-ring group block"
            aria-label={`Open image attachment ${file.name}`}
          >
            <img
              src={file.url}
              alt={`Support room attachment: ${file.name}`}
              className="max-h-[420px] w-full object-contain transition duration-300 group-hover:brightness-110"
            />
            <figcaption className="flex items-center justify-between gap-3 border-t border-white/10 px-3 py-2 text-xs text-archive-muted">
              <span className="min-w-0 truncate">{file.name}</span>
              <span className="flex shrink-0 items-center gap-1 text-archive-amber">
                <Eye className="h-3.5 w-3.5" /> Preview
              </span>
            </figcaption>
          </a>
        </figure>
      );
    }

    return (
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-black/10 p-3 text-xs">
        {isImage ? <ImageIcon className="h-4 w-4 shrink-0 text-archive-amber" /> : <FileText className="h-4 w-4 shrink-0 text-archive-amber" />}
        <div className="min-w-0">
          <p className="truncate text-[#DDD7CE]">{file.name}</p>
          {file.size > 0 && <p className="mt-0.5 text-[11px] text-archive-muted">{formatFileSize(file.size)}</p>}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Private Support Room</p>
          <h1 className="mt-3 font-display text-4xl font-semibold">{room.title}</h1>
          <p className="mt-2 text-sm text-archive-muted">{room.id} • Assigned: {room.assignedAdmin}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={room.status} />
          <StatusBadge status={room.priority} />
        </div>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_300px]">
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4 text-xs text-archive-muted">
            <LockKeyhole className="h-4 w-4 text-archive-teal" />
            Only you and authorised support administrators can view this room.
          </div>

          <div className="min-h-[430px] space-y-4 p-5 sm:p-6">
            {messages.length ? messages.map((item) => (
              <div
                key={item.id}
                className={`max-w-[92%] rounded-2xl p-4 sm:max-w-[88%] ${
                  item.sender === "user"
                    ? "ml-auto rounded-tr-sm border border-archive-amber/20 bg-archive-amber/10"
                    : "rounded-tl-sm border border-white/10 bg-white/[0.045]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-xs font-semibold ${item.sender === "user" ? "text-archive-amber" : "text-archive-teal"}`}>{item.name}</p>
                  <p className="text-[11px] text-archive-muted">{item.time}</p>
                </div>
                {item.text && <p className="mt-2 text-sm leading-6 text-[#D6D1C9]">{item.text}</p>}
                {renderMessageAttachment(item.attachment)}
              </div>
            )) : (
              <div className="grid min-h-[360px] place-items-center text-center text-sm text-archive-muted">
                No messages yet. An authorised administrator will reply here.
              </div>
            )}
          </div>

          <form onSubmit={send} className="border-t border-white/10 p-4">
            {attachment && (
              <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-black/15">
                {selectedPreviewUrl ? (
                  <div className="relative bg-black/25 p-2">
                    <img
                      src={selectedPreviewUrl}
                      alt={`Selected attachment preview: ${attachment.name}`}
                      className="mx-auto max-h-72 w-full rounded-lg object-contain"
                    />
                    <button
                      type="button"
                      onClick={clearAttachment}
                      className="focus-ring absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/70 text-white hover:bg-black"
                      aria-label="Remove selected attachment"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3">
                    <FileText className="h-5 w-5 shrink-0 text-archive-amber" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[#DDD7CE]">{attachment.name}</p>
                      <p className="mt-0.5 text-xs text-archive-muted">{formatFileSize(attachment.size)}</p>
                    </div>
                    <button type="button" className="focus-ring p-2 text-archive-rose" onClick={clearAttachment} aria-label="Remove selected attachment">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 text-archive-muted hover:border-archive-amber/30 hover:text-white"
                aria-label="Attach requested document or image"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={selectAttachment}
              />
              <textarea
                rows="2"
                className="field-control min-h-11 resize-none"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write a private message"
                aria-label="Message"
              />
              <Button type="submit" loading={sending} aria-label="Send message">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="surface-card rounded-2xl p-5">
            <h2 className="font-display text-2xl font-semibold">Case progress</h2>
            <div className="mt-5 space-y-0">
              {progress.map((item, index) => (
                <div key={item.label} className="relative flex gap-3 pb-5 last:pb-0">
                  <span className={`relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${item.done ? "border-archive-teal/30 bg-archive-teal/10 text-archive-teal" : "border-white/10 bg-ink-900 text-archive-muted"}`}>
                    {item.done ? <ShieldCheck className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  {index < progress.length - 1 && <span className="absolute left-[13px] top-7 h-full w-px bg-white/10" />}
                  <p className={`text-sm ${item.done ? "text-white" : "text-archive-muted"}`}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-archive-amber/20 bg-archive-amber/[0.06] p-5">
            <FileText className="h-5 w-5 text-archive-amber" />
            <h2 className="mt-3 font-semibold">Document safety</h2>
            <p className="mt-2 text-sm leading-6 text-archive-muted">Upload only a specifically requested document. Never send passwords, full national ID or unrelated records.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
