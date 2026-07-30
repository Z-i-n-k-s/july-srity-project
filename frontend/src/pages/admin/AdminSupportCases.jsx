import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  PauseCircle,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi, unwrap } from "../../lib/api";
import StatusBadge from "../../components/ui/StatusBadge";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
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
const getMessages = (room) => ensureArray(room?.messages || room?.chatMessages || room?.conversation || room?.supportMessages);
const messageText = (message) => message?.text || message?.content || message?.body || (typeof message?.message === "string" ? message.message : "");
const isAdminMessage = (message) => String(message?.sender?.role || message?.senderRole || message?.role || message?.sender || "").toLowerCase().includes("admin");
const messageName = (message) => message?.sender?.name || message?.senderName || message?.name || (isAdminMessage(message) ? "Support Admin" : "Requester");
const messageTime = (message) => {
  const value = message?.time || message?.createdAt || message?.updatedAt;
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export default function AdminSupportCases() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [stopReason, setStopReason] = useState("");
  const [savingAction, setSavingAction] = useState(false);
  const endRef = useRef(null);
  const requestRef = useRef(false);
  const { pick } = useLanguage();
  const toast = useToast();

  const loadCases = async ({ silent = false } = {}) => {
    if (requestRef.current) return;
    requestRef.current = true;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const payload = await adminApi.supportCases();
      const next = applySupportRoomOverrides(extractCases(payload)).filter((room) => !room.hiddenFromAdmin);
      setItems(next);
      setSelectedId((current) => current || getSupportRoomId(next[0]) || "");
    } catch (error) {
      console.error("Unable to load support rooms:", error);
      if (!silent) toast.error(error?.message || pick("Unable to load support rooms.", "সহায়তা কক্ষ লোড করা যায়নি।"));
    } finally {
      requestRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    void loadCases();
    const intervalId = window.setInterval(() => active && document.visibilityState === "visible" && void loadCases({ silent: true }), LIST_REFRESH_INTERVAL);
    return () => { active = false; window.clearInterval(intervalId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) { setSelectedCase(null); return undefined; }
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
        if (remote) setSelectedCase((current) => applySupportRoomOverride({ ...(current || {}), ...remote, id: remote.id || remote._id || selectedId }));
      } catch (error) {
        console.error("Unable to refresh support conversation:", error);
        if (initial) {
          const listCase = items.find((item) => String(getSupportRoomId(item)) === String(selectedId));
          setSelectedCase(applySupportRoomOverride(listCase || { id: selectedId, title: "Support room" }));
        }
      } finally {
        working = false;
        if (active) setLoadingChat(false);
      }
    };
    void loadSelected({ initial: true });
    const intervalId = window.setInterval(() => document.visibilityState === "visible" && void loadSelected(), MESSAGE_REFRESH_INTERVAL);
    return () => { active = false; window.clearInterval(intervalId); };
  }, [items, selectedId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [selectedCase?.messages?.length, selectedCase?.chatMessages?.length]);

  const filtered = useMemo(() => items.filter((item) => `${getSupportRoomId(item)} ${item.title || ""} ${item.requester || ""} ${item.category || ""} ${item.status || ""}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);
  const messages = getMessages(selectedCase);
  const roomStopped = isSupportRoomStopped(selectedCase);

  const mergeSelected = (values) => {
    setSelectedCase((current) => applySupportRoomOverride({ ...(current || {}), ...values }));
    setItems((current) => current.map((item) => String(getSupportRoomId(item)) === String(selectedId) ? applySupportRoomOverride({ ...item, ...values }) : item));
  };

  const changeFrontendStatus = (status) => {
    if (!selectedId) return;
    if (String(status).toLowerCase() === "stopped") {
      setStopReason("");
      setDialog({ type: "stop", room: selectedCase });
      return;
    }
    const values = { status, updatedAt: new Date().toISOString() };
    saveSupportRoomOverride(selectedId, values);
    mergeSelected(values);
    toast.success(pick(`Room status changed to ${status}.`, `কক্ষের অবস্থা ${status} করা হয়েছে।`));
  };

  const confirmStop = () => {
    if (stopReason.trim().length < 5) {
      toast.warning(pick("Write a short closing reason for the user.", "ব্যবহারকারীর জন্য বন্ধ করার সংক্ষিপ্ত কারণ লিখুন।"));
      return;
    }
    setSavingAction(true);
    const values = { status: "Stopped", stoppedReason: stopReason.trim(), stoppedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    saveSupportRoomOverride(selectedId, values);
    mergeSelected(values);
    setSavingAction(false);
    setDialog(null);
    setStopReason("");
    toast.success(pick("The room is now read-only for the user and admin in this frontend.", "এই ফ্রন্টএন্ডে কক্ষটি এখন ব্যবহারকারী ও অ্যাডমিন—উভয়ের জন্য শুধু পড়ার উপযোগী।"));
  };

  const confirmHide = () => {
    const id = getSupportRoomId(dialog?.room);
    if (!id) return;
    hideSupportRoomForAdmin(id);
    setItems((current) => current.filter((item) => String(getSupportRoomId(item)) !== String(id)));
    if (String(selectedId) === String(id)) {
      const remaining = items.filter((item) => String(getSupportRoomId(item)) !== String(id));
      setSelectedId(getSupportRoomId(remaining[0]) || "");
      setSelectedCase(null);
    }
    setDialog(null);
    toast.success(pick("The room was removed from this admin view. The frontend action does not delete backend data.", "কক্ষটি এই অ্যাডমিন ভিউ থেকে সরানো হয়েছে। এই ফ্রন্টএন্ড কাজ ব্যাকএন্ড ডেটা মুছে দেয় না।"));
  };

  const sendReply = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || sending || roomStopped || !selectedId) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("message", text);
      const response = await adminApi.sendSupportMessage(selectedId, formData);
      const data = unwrap(response);
      const remoteMessage = data?.supportMessage || data?.newMessage || data?.messageData || (typeof data?.message === "object" ? data.message : null);
      const nextMessage = remoteMessage || { id: `admin-${Date.now()}`, sender: "admin", senderName: "Support Admin", text, createdAt: new Date().toISOString() };
      setSelectedCase((current) => ({ ...(current || {}), messages: [...getMessages(current), nextMessage], updatedAt: new Date().toISOString() }));
      setMessage("");
    } catch (error) {
      toast.error(error?.message || pick("The reply could not be sent.", "উত্তর পাঠানো যায়নি।"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="admin-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow">{pick("Private support administration", "ব্যক্তিগত সহায়তা প্রশাসন")}</p><h2 className="mt-2 font-display text-4xl font-semibold">{pick("Messenger-style support workspace", "মেসেঞ্জারধর্মী সহায়তা কর্মক্ষেত্র")}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-archive-muted">{pick("Rooms stay in the left sidebar, the selected conversation stays open, and the message composer remains attached to the bottom.", "কক্ষগুলো বাম পাশের তালিকায় থাকে, নির্বাচিত কথোপকথন খোলা থাকে এবং বার্তা লেখার অংশ নিচে স্থির থাকে।")}</p></div><div className="inline-flex items-center gap-2 rounded-xl border border-archive-teal/20 bg-archive-teal/[0.07] p-4 text-xs text-[#B9CFCB]">{refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-archive-teal" />}{pick("Live polling active", "লাইভ পোলিং সক্রিয়")}</div></div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D111A] shadow-2xl">
        <div className="grid min-h-[720px] lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="border-b border-white/[0.08] lg:border-b-0 lg:border-r">
            <div className="border-b border-white/[0.08] p-4"><label className="relative block"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-archive-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="field-control pl-11" placeholder={pick("Search rooms or people", "কক্ষ বা ব্যক্তি খুঁজুন")} /></label></div>
            <div className="max-h-[650px] overflow-y-auto p-2">
              {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-archive-teal" /></div> : filtered.length ? filtered.map((room) => {
                const id = getSupportRoomId(room);
                const active = String(id) === String(selectedId);
                return <button key={id} type="button" onClick={() => setSelectedId(id)} className={`focus-ring mb-1 flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${active ? "border border-archive-teal/25 bg-archive-teal/[0.09]" : "border border-transparent hover:bg-white/[0.04]"}`}><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${active ? "bg-archive-teal text-ink-950" : "bg-white/[0.06] text-archive-teal"}`}><UserRound className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="truncate font-semibold text-white">{room.title || pick("Support room", "সহায়তা কক্ষ")}</span><span className="text-[10px] text-archive-muted">{room.unread ? room.unread : ""}</span></span><span className="mt-1 block truncate text-xs text-archive-muted">{room.requester || id}</span><span className="mt-2 flex items-center justify-between gap-2"><StatusBadge status={room.status || "Under review"} /><span className="truncate text-[10px] text-archive-muted">{messageText(getMessages(room).at(-1)) || room.category || ""}</span></span></span></button>;
              }) : <p className="p-8 text-center text-sm text-archive-muted">{pick("No support rooms found.", "কোনো সহায়তা কক্ষ পাওয়া যায়নি।")}</p>}
            </div>
          </aside>

          <main className="flex min-h-[720px] min-w-0 flex-col">
            {!selectedId ? <div className="grid flex-1 place-items-center p-8 text-center"><div><MessageSquareText className="mx-auto h-12 w-12 text-archive-teal" /><h3 className="mt-4 font-display text-3xl font-semibold">{pick("Select a support room", "একটি সহায়তা কক্ষ নির্বাচন করুন")}</h3></div></div> : loadingChat && !selectedCase ? <div className="grid flex-1 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-archive-teal" /></div> : <>
              <header className="flex flex-col gap-4 border-b border-white/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-archive-teal/10 text-archive-teal"><UserRound className="h-5 w-5" /></span><div className="min-w-0"><h3 className="truncate font-display text-2xl font-semibold text-white">{selectedCase?.title || pick("Support room", "সহায়তা কক্ষ")}</h3><p className="truncate text-xs text-archive-muted">{selectedCase?.requester || selectedId} • {selectedCase?.assignedAdmin || pick("Unassigned", "দায়িত্বহীন")}</p></div></div>
                <div className="flex flex-wrap items-center gap-2"><select value={selectedCase?.status || "Under review"} onChange={(event) => changeFrontendStatus(event.target.value)} className="field-control h-10 min-w-44 py-1 text-xs"><option>Under review</option><option>In progress</option><option>Information required</option><option>Completed</option><option>Stopped</option></select><Link to={`/admin-panel/support-cases/${selectedId}`} className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-semibold text-[#C6C2BC]">{pick("Full case", "সম্পূর্ণ কেস")}<ArrowUpRight className="h-4 w-4" /></Link><button onClick={() => setDialog({ type: "hide", room: selectedCase })} className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-archive-rose/20 bg-archive-rose/[0.07] text-archive-rose" aria-label={pick("Remove from admin view", "অ্যাডমিন ভিউ থেকে সরান")}><Trash2 className="h-4 w-4" /></button></div>
              </header>

              {roomStopped && <div className="border-b border-archive-rose/20 bg-archive-rose/[0.06] px-5 py-3 text-sm text-[#DAB8BE]"><PauseCircle className="mr-2 inline h-4 w-4 text-archive-rose" />{selectedCase?.stoppedReason || pick("This conversation is stopped and remains visible as read-only.", "এই কথোপকথন বন্ধ এবং শুধু পড়ার জন্য দৃশ্যমান থাকবে।")}</div>}

              <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(75,155,141,.06),transparent_35%)] p-4 sm:p-6">
                {messages.length ? messages.map((item, index) => {
                  const adminMessage = isAdminMessage(item);
                  return <div key={item.id || item._id || `${index}-${messageTime(item)}`} className={`flex ${adminMessage ? "justify-end" : "justify-start"}`}><div className={`max-w-[86%] rounded-2xl border p-4 ${adminMessage ? "rounded-br-sm border-archive-amber/20 bg-archive-amber/[0.09]" : "rounded-bl-sm border-white/10 bg-white/[0.045]"}`}><div className="flex items-center justify-between gap-5"><p className={`text-xs font-semibold ${adminMessage ? "text-archive-amber" : "text-archive-teal"}`}>{messageName(item)}</p><span className="text-[10px] text-archive-muted">{messageTime(item)}</span></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#E0DBD3]">{messageText(item)}</p></div></div>;
                }) : <div className="grid min-h-80 place-items-center text-center text-sm text-archive-muted">{pick("No messages yet.", "এখনও কোনো বার্তা নেই।")}</div>}
                <div ref={endRef} />
              </div>

              <form onSubmit={sendReply} className="sticky bottom-0 border-t border-white/[0.08] bg-[#0D111A]/95 p-4 backdrop-blur-xl">
                {roomStopped ? <div className="rounded-xl border border-archive-rose/20 bg-archive-rose/[0.06] p-4 text-center text-sm text-[#DAB8BE]"><LockKeyhole className="mr-2 inline h-4 w-4" />{pick("Messaging is disabled because the room was stopped.", "কক্ষটি বন্ধ হওয়ায় বার্তা পাঠানো নিষ্ক্রিয়।")}</div> : <div className="flex items-end gap-3"><textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={2} className="field-control min-h-12 flex-1 resize-none" placeholder={pick("Write a message…", "বার্তা লিখুন…")} /><button type="submit" disabled={sending || !message.trim()} className="focus-ring inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-5 text-sm font-semibold text-ink-950 disabled:opacity-40">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{pick("Send", "পাঠান")}</button></div>}
              </form>
            </>}
          </main>
        </div>
      </section>

      {dialog && <div className="fixed inset-0 z-[160] flex items-center justify-center p-4" role="dialog" aria-modal="true"><button className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !savingAction && setDialog(null)} aria-label="Close" /><div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-ink-800 shadow-2xl"><div className="flex items-start justify-between border-b border-white/10 p-5"><div><p className="eyebrow">{dialog.type === "stop" ? pick("Close conversation", "কথোপকথন বন্ধ") : pick("Frontend removal", "ফ্রন্টএন্ড থেকে সরানো")}</p><h2 className="mt-2 font-display text-3xl font-semibold">{dialog.type === "stop" ? pick("Stop this support room?", "এই সহায়তা কক্ষ বন্ধ করবেন?") : pick("Remove this room from admin view?", "অ্যাডমিন ভিউ থেকে কক্ষটি সরাবেন?")}</h2></div><button onClick={() => setDialog(null)} className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-white/10"><X className="h-5 w-5" /></button></div><div className="p-5">{dialog.type === "stop" ? <><p className="text-sm leading-7 text-archive-muted">{pick("The user will see the updated Stopped status and the reason. Previous messages remain visible, but the composer is disabled.", "ব্যবহারকারী হালনাগাদ ‘Stopped’ অবস্থা ও কারণ দেখবেন। আগের বার্তা দৃশ্যমান থাকবে, কিন্তু বার্তা লেখার অংশ নিষ্ক্রিয় হবে।")}</p><label className="mt-5 block"><span className="field-label">{pick("Reason shown to the user", "ব্যবহারকারীকে দেখানো কারণ")}</span><textarea value={stopReason} onChange={(event) => setStopReason(event.target.value.slice(0, 500))} rows={4} className="field-control resize-none" placeholder={pick("The conversation has been completed…", "কথোপকথনটি সম্পন্ন হয়েছে…")} /><p className="mt-2 text-right text-xs text-archive-muted">{stopReason.length}/500</p></label></> : <div className="flex gap-3 rounded-xl border border-archive-rose/20 bg-archive-rose/[0.06] p-4"><AlertTriangle className="h-5 w-5 shrink-0 text-archive-rose" /><p className="text-sm leading-7 text-[#DAB8BE]">{pick("This only hides the room in this browser's admin view. It does not delete backend data or the user's history.", "এটি শুধু এই ব্রাউজারের অ্যাডমিন ভিউতে কক্ষটি লুকায়। ব্যাকএন্ড ডেটা বা ব্যবহারকারীর ইতিহাস মুছে দেয় না।")}</p></div>}</div><div className="flex justify-end gap-3 border-t border-white/10 p-5"><button onClick={() => setDialog(null)} className="focus-ring rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold">{pick("Cancel", "বাতিল")}</button><button onClick={dialog.type === "stop" ? confirmStop : confirmHide} disabled={dialog.type === "stop" && stopReason.trim().length < 5} className={`focus-ring inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40 ${dialog.type === "stop" ? "bg-archive-amber text-ink-950" : "bg-archive-rose text-white"}`}>{dialog.type === "stop" ? <PauseCircle className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}{dialog.type === "stop" ? pick("Stop room", "কক্ষ বন্ধ করুন") : pick("Remove from view", "ভিউ থেকে সরান")}</button></div></div></div>}
    </div>
  );
}
