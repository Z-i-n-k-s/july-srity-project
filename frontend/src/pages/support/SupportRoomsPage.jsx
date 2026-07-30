import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Loader2,
  MessageSquareText,
  Plus,
} from "lucide-react";

import { Link } from "react-router-dom";

import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";

import { demoSupportRooms } from "../../data/demoData";

import {
  STORAGE_KEYS,
  storage,
} from "../../lib/storage";

import {
  userApi,
  unwrap,
} from "../../lib/api";

import { useLanguage } from "../../context/LanguageContext";

const ROOM_REFRESH_INTERVAL = 5000;

const getRoomId = (room) =>
  room?.id || room?._id || "";

const extractRooms = (payload) => {
  const data = unwrap(payload);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.rooms)) {
    return data.rooms;
  }

  if (Array.isArray(data?.supportRooms)) {
    return data.supportRooms;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return null;
};

const mergeRooms = (...roomLists) => {
  const roomMap = new Map();

  roomLists
    .flat()
    .filter(Boolean)
    .forEach((room) => {
      const id = getRoomId(room);

      if (!id) {
        return;
      }

      const existing = roomMap.get(String(id));

      roomMap.set(String(id), {
        ...(existing || {}),
        ...room,
      });
    });

  return Array.from(roomMap.values());
};

const formatUpdatedAt = (value) => {
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

export default function SupportRoomsPage() {
  const fallback = useMemo(() => {
    const storedRooms = storage.get(
      STORAGE_KEYS.supportRooms,
      []
    );

    return mergeRooms(
      storedRooms,
      demoSupportRooms
    );
  }, []);

  const [rooms, setRooms] =
    useState(fallback);

  const [refreshing, setRefreshing] =
    useState(false);

  const requestInProgressRef =
    useRef(false);

  const { pick } = useLanguage();

  useEffect(() => {
    let active = true;

    const loadRooms = async ({
      showLoader = false,
    } = {}) => {
      if (requestInProgressRef.current) {
        return;
      }

      requestInProgressRef.current = true;

      if (showLoader && active) {
        setRefreshing(true);
      }

      try {
        const payload =
          await userApi.getSupportRooms();

        if (!active) {
          return;
        }

        const remoteRooms =
          extractRooms(payload);

        if (!Array.isArray(remoteRooms)) {
          return;
        }

        const locallyStoredRooms =
          storage.get(
            STORAGE_KEYS.supportRooms,
            []
          );

        const nextRooms = mergeRooms(
          locallyStoredRooms,
          remoteRooms
        );

        setRooms(nextRooms);

        storage.set(
          STORAGE_KEYS.supportRooms,
          nextRooms
        );
      } catch (error) {
        if (active) {
          console.error(
            "Unable to refresh support rooms:",
            error
          );
        }
      } finally {
        requestInProgressRef.current =
          false;

        if (active) {
          setRefreshing(false);
        }
      }
    };

    void loadRooms({
      showLoader: true,
    });

    const intervalId =
      window.setInterval(() => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadRooms();
        }
      }, ROOM_REFRESH_INTERVAL);

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void loadRooms();
      }
    };

    const handleOnline = () => {
      void loadRooms({
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
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow">
              {pick(
                "Private account",
                "ব্যক্তিগত অ্যাকাউন্ট"
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
                    "Checking updates",
                    "হালনাগাদ দেখা হচ্ছে"
                  )
                : pick(
                    "Live updates",
                    "স্বয়ংক্রিয় হালনাগাদ"
                  )}
            </span>
          </div>

          <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
            {pick(
              "My Support Rooms",
              "আমার সহায়তা কক্ষ"
            )}
          </h1>

          <p className="mt-3 text-sm leading-6 text-archive-muted">
            {pick(
              "View messages, requested documents and case progress.",
              "বার্তা, চাওয়া নথি ও কেসের অগ্রগতি দেখুন।"
            )}
          </p>
        </div>

        <Button to="/support/new">
          <Plus className="h-4 w-4" />

          {pick(
            "New Request",
            "নতুন অনুরোধ"
          )}
        </Button>
      </div>

      {rooms.length ? (
        <div className="mt-8 space-y-4">
          {rooms.map((room) => {
            const roomId = getRoomId(room);

            return (
              <Link
                key={roomId}
                to={`/account/support-rooms/${roomId}`}
                className="focus-ring group flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-archive-teal/30 hover:bg-white/[0.045] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-archive-teal/20 bg-archive-teal/10 text-archive-teal">
                    <MessageSquareText className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-2xl font-semibold">
                        {room.title ||
                          pick(
                            "Support request",
                            "সহায়তা অনুরোধ"
                          )}
                      </h2>

                      {Number(room.unread) >
                        0 && (
                        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-archive-rose px-1.5 text-xs font-bold text-white">
                          {room.unread}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-archive-muted">
                      {roomId} •{" "}
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
                </div>

                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <StatusBadge
                    status={
                      room.status ||
                      "Under review"
                    }
                  />

                  <p className="text-xs text-archive-muted">
                    {pick(
                      "Updated",
                      "হালনাগাদ"
                    )}{" "}
                    {formatUpdatedAt(
                      room.updatedAt
                    )}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title={pick(
              "No support rooms yet",
              "এখনও কোনো সহায়তা কক্ষ নেই"
            )}
            description={pick(
              "Create a private support request to begin a room.",
              "একটি ব্যক্তিগত সহায়তা অনুরোধ করে কক্ষ শুরু করুন।"
            )}
            actionLabel={pick(
              "Open Support Request",
              "সহায়তা অনুরোধ খুলুন"
            )}
            actionTo="/support/new"
          />
        </div>
      )}
    </div>
  );
}