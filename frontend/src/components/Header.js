import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ChevronDown,
  Languages,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { toast } from "react-toastify";

import Logo from "./Logo";
import SummaryApi from "../common";
import { setUserDetails } from "../store/userSlice";
import { isAdminUser } from "../common/role";
import ProfileDisplay from "./ProfileDisplay";
import { useLanguage } from "../context/LanguageContext";
import useScrollLock from "../hooks/useScrollLock";
import Button from "./ui/Button";
import { cn } from "../lib/utils";

const accountLinks = [
  {
    key: "dashboard",
    to: "/account",
  },
  {
    key: "mySubmissions",
    to: "/account/submissions",
  },
  {
    key: "supportRooms",
    to: "/account/support-rooms",
  },
  {
    key: "myReports",
    to: "/account/reports",
  },
  {
    key: "savedDrafts",
    to: "/account/drafts",
  },
  {
    key: "profile",
    to: "/account/profile",
  },
];

const directNavigation = [
  {
    label: "Home",
    labelBn: "হোম",
    to: "/home",
  },
  {
    label: "Archive",
    labelBn: "আর্কাইভ",
    to: "/archive",
  },
];

const groupedNavigation = [
  {
    id: "remember",
    label: "Remember July",
    labelBn: "জুলাইকে স্মরণ",

    items: [
      {
        label: "Movement Timeline",
        labelBn: "আন্দোলনের সময়রেখা",
        to: "/timeline",
      },
      {
        label: "Hero Stories",
        labelBn: "বীরত্বের গল্প",
        to: "/stories",
      },
      {
        label: "Aynaghor",
        labelBn: "আয়নাঘর",
        to: "/aynaghor",
      },
      {
        label: "Internet Blackout",
        labelBn: "ইন্টারনেট ব্ল্যাকআউট",
        to: "/july-history#blackout",
      },
      {
        label: "Power & Transition",
        labelBn: "ক্ষমতা ও রূপান্তর",
        to: "/july-history#power-transition",
      },
      {
        label: "Graffiti",
        labelBn: "গ্রাফিতি",
        to: "/july-history#graffiti",
      },
      {
        label: "All July Chapters",
        labelBn: "জুলাইয়ের সব অধ্যায়",
        to: "/july-history",
      },
      {
        label: "Voices of July",
        labelBn: "জুলাইয়ের কণ্ঠস্বর",
        to: "/voices",
      },
    ],
  },
  {
    id: "help",
    label: "Support & Search",
    labelBn: "সহায়তা ও অনুসন্ধান",

    items: [
      {
        label: "Support",
        labelBn: "সহায়তা",
        to: "/support",
      },
      {
        label: "Missing Persons",
        labelBn: "নিখোঁজ ব্যক্তি",
        to: "/missing-persons",
      },
    ],
  },
];

const splitNavigationTarget = (target) => {
  const [pathname, hash] = String(target).split("#");

  return {
    pathname,
    hash: hash ? `#${hash}` : "",
  };
};

const isNavigationItemActive = (
  target,
  location,
) => {
  const {
    pathname,
    hash,
  } = splitNavigationTarget(target);

  if (hash) {
    return (
      location.pathname === pathname &&
      location.hash === hash
    );
  }

  if (
    location.pathname === pathname
  ) {
    return !location.hash;
  }

  return location.pathname.startsWith(
    `${pathname}/`,
  );
};

const isNavigationGroupActive = (
  group,
  location,
) => {
  return group.items.some((item) => {
    const {
      pathname,
    } = splitNavigationTarget(item.to);

    return (
      location.pathname === pathname ||
      location.pathname.startsWith(
        `${pathname}/`,
      )
    );
  });
};

const navLinkClass = ({
  isActive,
}) =>
  cn(
    "focus-ring relative rounded-lg px-3 py-2 text-sm font-medium",
    "transform-gpu transition-all duration-200",
    "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px",
    "after:origin-left after:scale-x-0 after:bg-archive-amber",
    "after:transition-transform after:duration-200",
    "hover:z-10 hover:-translate-y-0.5 hover:scale-[1.04]",
    "hover:text-white hover:after:scale-x-100",
    isActive
      ? "text-white after:scale-x-100"
      : "text-[#A8ABB4]",
  );

function DesktopNavGroup({
  group,
  location,
  pick,
  open,
  onOpen,
  onClose,
  onToggle,
  onNavigate,
}) {
  const active =
    isNavigationGroupActive(
      group,
      location,
    );

  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onFocus={onOpen}
      onBlur={(event) => {
        if (
          !event.currentTarget.contains(
            event.relatedTarget,
          )
        ) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
          "transform-gpu transition-all duration-200",
          "hover:z-10 hover:-translate-y-0.5 hover:scale-[1.04] hover:text-white",
          active
            ? "text-white"
            : "text-[#A8ABB4]",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {pick(
          group.label,
          group.labelBn,
        )}

        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 4,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 8,
              scale: 0.98,
            }}
            transition={{
              duration: 0.16,
            }}
            className="absolute left-1/2 top-full z-40 w-72 -translate-x-1/2 rounded-2xl border border-white/10 bg-[#11141E] p-2 shadow-2xl"
            role="menu"
          >
            {group.items.map((item) => {
              const itemActive =
                isNavigationItemActive(
                  item.to,
                  location,
                );

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "focus-ring block rounded-xl px-4 py-3 text-sm",
                    "transform-gpu transition-all duration-200",
                    "hover:z-10 hover:translate-x-1 hover:scale-[1.02]",
                    itemActive
                      ? "bg-archive-amber/10 font-semibold text-archive-amber"
                      : "text-[#C6C2BC] hover:bg-white/[0.07] hover:text-white",
                  )}
                  role="menuitem"
                >
                  {pick(
                    item.label,
                    item.labelBn,
                  )}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Header = () => {
  const user = useSelector(
    (state) => state?.user?.user,
  );

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    language,
    toggleLanguage,
    t,
    pick,
  } = useLanguage();

  const [scrolled, setScrolled] =
    useState(false);

  const [
    openDesktopGroup,
    setOpenDesktopGroup,
  ] = useState(null);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [
    mobileSection,
    setMobileSection,
  ] = useState("remember");

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [
    profileDisplay,
    setProfileDisplay,
  ] = useState(false);

  const authenticated = Boolean(
    user?._id || user?.id,
  );

  const admin = isAdminUser(user);

  const profileRef = useRef(null);
  const desktopNavRef = useRef(null);

  useScrollLock(mobileOpen);

  const closeNavigation = () => {
    setOpenDesktopGroup(null);
    setMobileOpen(false);
    setProfileOpen(false);
  };

  const openMobileNavigation = () => {
    setOpenDesktopGroup(null);
    setProfileOpen(false);
    setMobileSection("remember");
    setMobileOpen(true);
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(
        window.scrollY > 18,
      );
    };

    onScroll();

    window.addEventListener(
      "scroll",
      onScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        onScroll,
      );
    };
  }, []);

  /*
   * Close every menu after pathname or hash changes.
   * Hash is included because the three July sections
   * share the same page pathname.
   */
  useEffect(() => {
    setOpenDesktopGroup(null);
    setMobileOpen(false);
    setProfileOpen(false);

    if (!location.hash) {
      return undefined;
    }

    const timeoutId =
      window.setTimeout(() => {
        const element =
          document.getElementById(
            location.hash.slice(1),
          );

        element?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    location.pathname,
    location.hash,
  ]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeNavigation();
      }
    };

    const onDocumentClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target,
        )
      ) {
        setProfileOpen(false);
      }

      if (
        desktopNavRef.current &&
        !desktopNavRef.current.contains(
          event.target,
        )
      ) {
        setOpenDesktopGroup(null);
      }
    };

    document.addEventListener(
      "keydown",
      onKeyDown,
    );

    document.addEventListener(
      "mousedown",
      onDocumentClick,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        onKeyDown,
      );

      document.removeEventListener(
        "mousedown",
        onDocumentClick,
      );
    };
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch(
        SummaryApi.logout_user.url,
        {
          method:
            SummaryApi.logout_user
              .method,

          credentials: "include",
        },
      );

      const payload = await response
        .json()
        .catch(() => ({}));

      if (
        !response.ok ||
        payload?.error
      ) {
        throw new Error(
          payload?.message ||
            "Unable to sign out.",
        );
      }

      toast.success(
        payload?.message ||
          "Signed out successfully.",
      );
    } catch (error) {
      toast.info(
        "Local session cleared.",
      );
    } finally {
      dispatch(
        setUserDetails(null),
      );

      closeNavigation();

      navigate("/", {
        replace: true,
      });
    }
  };

  const mobileDrawer =
    typeof document !== "undefined"
      ? createPortal(
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                key="mobile-navigation"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                className="fixed inset-0 z-[999] xl:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation"
              >
                <motion.button
                  type="button"
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                  aria-label="Close navigation menu"
                />

                <motion.aside
                  initial={{
                    x: "100%",
                  }}
                  animate={{
                    x: 0,
                  }}
                  exit={{
                    x: "100%",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 280,
                    damping: 30,
                  }}
                  className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto border-l border-white/10 bg-[#080A11] shadow-2xl"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(185,103,118,.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(75,155,141,.14),transparent_40%)]" />

                  <div className="relative flex min-h-full flex-col px-5 py-4 sm:px-6">
                    <div className="flex h-14 items-center justify-between">
                      <Logo />

                      <button
                        type="button"
                        onClick={() =>
                          setMobileOpen(false)
                        }
                        className="focus-ring grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.05] transition-all duration-200 hover:scale-105 hover:bg-white/[0.09]"
                        aria-label="Close navigation menu"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {authenticated && (
                      <div className="mt-6 rounded-2xl border border-white/10 bg-[#11141E] p-4 shadow-lg">
                        <div className="flex items-center gap-3">
                          {user?.profilePic ? (
                            <img
                              src={
                                user.profilePic
                              }
                              alt=""
                              className="h-11 w-11 rounded-full object-cover"
                            />
                          ) : (
                            <span className="grid h-11 w-11 place-items-center rounded-full bg-archive-teal/15 text-archive-teal">
                              <User className="h-5 w-5" />
                            </span>
                          )}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {user?.name}
                            </p>

                            <p className="mt-1 truncate text-xs text-archive-muted">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <nav
                      className="mt-6 grid gap-2"
                      aria-label="Mobile navigation"
                    >
                      {directNavigation.map(
                        (item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={
                              closeNavigation
                            }
                            className={({
                              isActive,
                            }) =>
                              cn(
                                "focus-ring rounded-xl px-4 py-3.5 text-lg font-medium",
                                "transform-gpu transition-all duration-200",
                                "hover:-translate-y-0.5 hover:scale-[1.02]",
                                isActive
                                  ? "bg-archive-amber/10 text-archive-amber"
                                  : "bg-white/[0.035] text-[#D4D0C9] hover:bg-white/[0.07] hover:text-white",
                              )
                            }
                          >
                            {pick(
                              item.label,
                              item.labelBn,
                            )}
                          </NavLink>
                        ),
                      )}

                      {groupedNavigation.map(
                        (group) => {
                          const expanded =
                            mobileSection ===
                            group.id;

                          return (
                            <div
                              key={
                                group.id
                              }
                              className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#10131C] shadow-lg"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setMobileSection(
                                    expanded
                                      ? ""
                                      : group.id,
                                  )
                                }
                                className="focus-ring flex w-full items-center justify-between px-4 py-3.5 text-left text-lg font-medium text-[#E2DDD5] transition-all duration-200 hover:bg-white/[0.05]"
                                aria-expanded={
                                  expanded
                                }
                              >
                                {pick(
                                  group.label,
                                  group.labelBn,
                                )}

                                <ChevronDown
                                  className={cn(
                                    "h-5 w-5 text-archive-muted transition-transform duration-200",
                                    expanded &&
                                      "rotate-180",
                                  )}
                                />
                              </button>

                              <AnimatePresence
                                initial={false}
                              >
                                {expanded && (
                                  <motion.div
                                    initial={{
                                      height: 0,
                                      opacity: 0,
                                    }}
                                    animate={{
                                      height:
                                        "auto",
                                      opacity: 1,
                                    }}
                                    exit={{
                                      height: 0,
                                      opacity: 0,
                                    }}
                                    transition={{
                                      duration:
                                        0.2,
                                    }}
                                    className="overflow-hidden"
                                  >
                                    <div className="grid gap-1 border-t border-white/[0.07] p-2">
                                      {group.items.map(
                                        (
                                          item,
                                        ) => {
                                          const active =
                                            isNavigationItemActive(
                                              item.to,
                                              location,
                                            );

                                          return (
                                            <Link
                                              key={
                                                item.to
                                              }
                                              to={
                                                item.to
                                              }
                                              onClick={
                                                closeNavigation
                                              }
                                              className={cn(
                                                "focus-ring rounded-lg px-4 py-3 text-sm",
                                                "transform-gpu transition-all duration-200",
                                                "hover:translate-x-1 hover:scale-[1.02]",
                                                active
                                                  ? "bg-archive-amber/10 font-semibold text-archive-amber"
                                                  : "text-[#C6C2BC] hover:bg-white/[0.07] hover:text-white",
                                              )}
                                            >
                                              {pick(
                                                item.label,
                                                item.labelBn,
                                              )}
                                            </Link>
                                          );
                                        },
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        },
                      )}

                      <NavLink
                        to="/about"
                        onClick={
                          closeNavigation
                        }
                        className={({
                          isActive,
                        }) =>
                          cn(
                            "focus-ring rounded-xl px-4 py-3.5 text-lg font-medium",
                            "transform-gpu transition-all duration-200",
                            "hover:-translate-y-0.5 hover:scale-[1.02]",
                            isActive
                              ? "bg-archive-amber/10 text-archive-amber"
                              : "bg-white/[0.035] text-[#D4D0C9] hover:bg-white/[0.07] hover:text-white",
                          )
                        }
                      >
                        {pick(
                          "About",
                          "আমাদের সম্পর্কে",
                        )}
                      </NavLink>
                    </nav>

                    {authenticated &&
                      !admin && (
                        <div className="mt-5 grid grid-cols-2 gap-2">
                          {accountLinks.map(
                            (item) => (
                              <Link
                                key={
                                  item.to
                                }
                                to={item.to}
                                onClick={
                                  closeNavigation
                                }
                                className="focus-ring rounded-xl border border-white/10 bg-[#11141E] px-3 py-3 text-sm text-[#C6C2BC] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-white/[0.07] hover:text-white"
                              >
                                {t(
                                  item.key,
                                )}
                              </Link>
                            ),
                          )}
                        </div>
                      )}

                    <div className="mt-auto grid gap-3 pt-8">
                      {admin ? (
                        <Button
                          to="/admin-panel"
                          size="lg"
                          showArrow
                          onClick={
                            closeNavigation
                          }
                        >
                          {t(
                            "adminPanel",
                          )}
                        </Button>
                      ) : (
                        <>
                          <Button
                            to="/support/new"
                            variant="rose"
                            size="lg"
                            onClick={
                              closeNavigation
                            }
                          >
                            {t(
                              "getSupport",
                            )}
                          </Button>

                          <Button
                            to="/submit"
                            size="lg"
                            showArrow
                            onClick={
                              closeNavigation
                            }
                          >
                            {t(
                              "submitEvidence",
                            )}
                          </Button>
                        </>
                      )}

                      {!authenticated ? (
                        <Button
                          to="/login"
                          variant="secondary"
                          size="lg"
                          onClick={
                            closeNavigation
                          }
                        >
                          {t(
                            "signIn",
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="lg"
                          onClick={
                            handleLogout
                          }
                        >
                          {t(
                            "signOut",
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "border-white/10 bg-ink-950/[0.92] py-2 shadow-xl backdrop-blur-xl"
            : "border-white/[0.06] bg-ink-950/35 py-3 backdrop-blur-sm",
        )}
      >
        <div className="page-shell flex h-14 items-center justify-between gap-4">
          <Logo
            compact
            className="shrink-0"
          />

          <nav
            ref={desktopNavRef}
            className="hidden items-center gap-1 xl:flex"
            aria-label="Primary navigation"
          >
            {directNavigation.map(
              (item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={
                    closeNavigation
                  }
                  className={
                    navLinkClass
                  }
                >
                  {pick(
                    item.label,
                    item.labelBn,
                  )}
                </NavLink>
              ),
            )}

            {groupedNavigation.map(
              (group) => (
                <DesktopNavGroup
                  key={group.id}
                  group={group}
                  location={location}
                  pick={pick}
                  open={
                    openDesktopGroup ===
                    group.id
                  }
                  onOpen={() =>
                    setOpenDesktopGroup(
                      group.id,
                    )
                  }
                  onClose={() =>
                    setOpenDesktopGroup(
                      null,
                    )
                  }
                  onToggle={() =>
                    setOpenDesktopGroup(
                      (
                        current,
                      ) =>
                        current ===
                        group.id
                          ? null
                          : group.id,
                    )
                  }
                  onNavigate={
                    closeNavigation
                  }
                />
              ),
            )}

            <NavLink
              to="/about"
              onClick={
                closeNavigation
              }
              className={navLinkClass}
            >
              {pick(
                "About",
                "আমাদের সম্পর্কে",
              )}
            </NavLink>
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            <button
              type="button"
              onClick={() => {
                setOpenDesktopGroup(
                  null,
                );

                toggleLanguage();
              }}
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold text-[#C6C2BC] transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:border-archive-amber/30 hover:text-white"
              aria-label="Change language"
            >
              <Languages className="h-4 w-4" />

              {language === "en"
                ? "বাংলা"
                : "EN"}
            </button>

            {authenticated ? (
              <>
                {admin ? (
                  <Button
                    to="/admin-panel"
                    size="sm"
                    showArrow
                    onClick={
                      closeNavigation
                    }
                  >
                    {t(
                      "adminPanel",
                    )}
                  </Button>
                ) : (
                  <Button
                    to="/submit"
                    size="sm"
                    showArrow
                    onClick={
                      closeNavigation
                    }
                  >
                    {t(
                      "submitEvidence",
                    )}
                  </Button>
                )}

                <div
                  ref={profileRef}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDesktopGroup(
                        null,
                      );

                      setProfileOpen(
                        (value) =>
                          !value,
                      );
                    }}
                    className="focus-ring flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-archive-paper transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-white/[0.07]"
                    aria-expanded={
                      profileOpen
                    }
                    aria-haspopup="menu"
                  >
                    {user?.profilePic ? (
                      <img
                        src={
                          user.profilePic
                        }
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-archive-teal/15 text-archive-teal">
                        <User className="h-4 w-4" />
                      </span>
                    )}

                    <span className="max-w-28 truncate">
                      {user?.name ||
                        t(
                          "account",
                        )}
                    </span>

                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-archive-muted transition-transform duration-200",
                        profileOpen &&
                          "rotate-180",
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 8,
                          scale: 0.98,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: 5,
                          scale: 0.98,
                        }}
                        className="absolute right-0 mt-3 w-64 overflow-hidden rounded-xl border border-white/10 bg-ink-800 p-2 shadow-2xl"
                        role="menu"
                      >
                        <div className="border-b border-white/10 px-3 py-3">
                          <p className="truncate text-sm font-semibold text-white">
                            {user?.name}
                          </p>

                          <p className="truncate text-xs text-archive-muted">
                            {user?.email}
                          </p>
                        </div>

                        <div className="py-2">
                          {!admin &&
                            accountLinks.map(
                              (link) => (
                                <Link
                                  key={
                                    link.to
                                  }
                                  to={
                                    link.to
                                  }
                                  onClick={
                                    closeNavigation
                                  }
                                  className="focus-ring block rounded-lg px-3 py-2.5 text-sm text-[#C6C2BC] transition-all duration-200 hover:translate-x-1 hover:scale-[1.02] hover:bg-white/5 hover:text-white"
                                  role="menuitem"
                                >
                                  {t(
                                    link.key,
                                  )}
                                </Link>
                              ),
                            )}

                          <button
                            type="button"
                            onClick={() => {
                              setProfileOpen(
                                false,
                              );

                              setProfileDisplay(
                                true,
                              );
                            }}
                            className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-[#C6C2BC] transition-all duration-200 hover:translate-x-1 hover:scale-[1.02] hover:bg-white/5 hover:text-white"
                          >
                            <Settings className="h-4 w-4" />

                            {pick(
                              "Quick profile settings",
                              "দ্রুত প্রোফাইল সেটিংস",
                            )}
                          </button>

                          {admin && (
                            <Link
                              to="/admin-panel"
                              onClick={
                                closeNavigation
                              }
                              className="focus-ring flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-archive-amber transition-all duration-200 hover:translate-x-1 hover:scale-[1.02] hover:bg-archive-amber/10"
                            >
                              <ShieldCheck className="h-4 w-4" />

                              {t(
                                "adminPanel",
                              )}
                            </Link>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={
                            handleLogout
                          }
                          className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-[#E6B4BD] transition-all duration-200 hover:translate-x-1 hover:scale-[1.02] hover:bg-archive-rose/10"
                          role="menuitem"
                        >
                          <LogOut className="h-4 w-4" />

                          {t(
                            "signOut",
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Button
                  to="/login"
                  size="sm"
                  variant="ghost"
                  onClick={
                    closeNavigation
                  }
                >
                  {t("signIn")}
                </Button>

                <Button
                  to="/sign-up"
                  size="sm"
                  showArrow
                  onClick={
                    closeNavigation
                  }
                >
                  {pick(
                    "Create Account",
                    "অ্যাকাউন্ট তৈরি",
                  )}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 xl:hidden">
            <button
              type="button"
              onClick={toggleLanguage}
              className="focus-ring grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] transition-all duration-200 hover:scale-105 hover:bg-white/[0.08]"
              aria-label="Change language"
            >
              <Languages className="h-5 w-5" />
            </button>

            {!admin && (
              <Link
                to="/support/new"
                className="focus-ring hidden min-h-10 items-center gap-2 rounded-xl border border-archive-rose/25 bg-archive-rose/10 px-3 text-xs font-semibold text-[#F0C6CE] transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 sm:flex"
              >
                <ShieldCheck className="h-4 w-4" />

                {t(
                  "getSupport",
                )}
              </Link>
            )}

            <button
              type="button"
              onClick={
                openMobileNavigation
              }
              className="focus-ring grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] transition-all duration-200 hover:scale-105 hover:bg-white/[0.08]"
              aria-label="Open navigation menu"
              aria-expanded={
                mobileOpen
              }
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileDrawer}

      {profileDisplay && (
        <ProfileDisplay
          onClose={() =>
            setProfileDisplay(false)
          }
          name={user?.name}
          email={user?.email}
          role={user?.role}
          userId={
            user?._id || user?.id
          }
          profilePic={
            user?.profilePic
          }
          callFunc={() =>
            window.location.reload()
          }
        />
      )}
    </>
  );
};

export default Header;