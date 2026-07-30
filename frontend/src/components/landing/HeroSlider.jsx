import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Images,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useLanguage } from "../../context/LanguageContext";

/*
 * Automatically imports the first four images from:
 * src/assest/hero/
 */
const heroImageContext = require.context(
  "../../assest/hero",
  false,
  /\.(png|jpe?g|webp|avif)$/i,
);

const importedImages = heroImageContext
  .keys()
  .sort((firstImage, secondImage) =>
    firstImage.localeCompare(secondImage, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  )
  .slice(0, 4)
  .map((imagePath, index) => {
    const imageModule = heroImageContext(imagePath);

    return {
      id: index + 1,
      src: imageModule?.default || imageModule,
      en: `July Smriti archive image ${index + 1}`,
      bn: `জুলাই স্মৃতি আর্কাইভের ছবি ${index + 1}`,
    };
  });

const imagePositions = [
  "center center",
  "center 35%",
  "center 45%",
  "center 30%",
];

export default function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const shouldReduceMotion = useReducedMotion();
  const { pick } = useLanguage();

  const slides = useMemo(
    () => importedImages,
    [],
  );

  const totalSlides = slides.length;
  const activeSlide = slides[activeIndex];

  const previousSlide =
    totalSlides > 0
      ? slides[
          (activeIndex - 1 + totalSlides) %
            totalSlides
        ]
      : null;

  const nextSlide =
    totalSlides > 0
      ? slides[
          (activeIndex + 1) % totalSlides
        ]
      : null;

  const secondarySlide =
    totalSlides > 0
      ? slides[
          (activeIndex + 2) % totalSlides
        ]
      : null;

  const changeSlide = (
    nextIndex,
    nextDirection = 1,
  ) => {
    if (
      totalSlides <= 1 ||
      nextIndex === activeIndex
    ) {
      return;
    }

    setDirection(nextDirection);
    setActiveIndex(nextIndex);
  };

  const showNextSlide = () => {
    if (totalSlides <= 1) return;

    changeSlide(
      (activeIndex + 1) % totalSlides,
      1,
    );
  };

  const showPreviousSlide = () => {
    if (totalSlides <= 1) return;

    changeSlide(
      (activeIndex - 1 + totalSlides) %
        totalSlides,
      -1,
    );
  };

  useEffect(() => {
    if (
      shouldReduceMotion ||
      totalSlides <= 1
    ) {
      return undefined;
    }

    const sliderInterval = window.setInterval(
      () => {
        setDirection(1);

        setActiveIndex((currentIndex) => {
          return (
            (currentIndex + 1) % totalSlides
          );
        });
      },
      5500,
    );

    return () => {
      window.clearInterval(sliderInterval);
    };
  }, [shouldReduceMotion, totalSlides]);

  if (!totalSlides) {
    return (
      <div className="flex min-h-[480px] items-center justify-center text-center">
        <div>
          <Images className="mx-auto h-9 w-9 text-archive-amber" />

          <p className="mt-4 text-sm text-archive-muted">
            {pick(
              "Add four images inside src/assest/hero.",
              "src/assest/hero ফোল্ডারে চারটি ছবি যোগ করুন।",
            )}
          </p>
        </div>
      </div>
    );
  }

  const imageTransition = shouldReduceMotion
    ? {
        duration: 0,
      }
    : {
        duration: 1.1,
        ease: [0.22, 1, 0.36, 1],
      };

  return (
    <div className="relative isolate mx-auto h-[480px] w-full max-w-[760px] sm:h-[580px] lg:h-[650px]">
      {/* Background glow */}
      <motion.div
        aria-hidden="true"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.08, 1],
                opacity: [0.4, 0.7, 0.4],
              }
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute left-[13%] top-[12%] h-[60%] w-[65%] rounded-full bg-archive-amber/15 blur-[105px]"
      />

      <motion.div
        aria-hidden="true"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 15, 0],
                y: [0, -18, 0],
              }
        }
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute bottom-[4%] right-[4%] h-[46%] w-[48%] rounded-full bg-archive-rose/10 blur-[100px]"
      />

      {/* Previous image echo */}
      {previousSlide && (
        <motion.div
          aria-hidden="true"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [0, -14, 0],
                  rotate: [-2, 1, -2],
              }
          }
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-[3%] top-[16%] h-[61%] w-[31%] overflow-hidden opacity-30"
          style={{
            clipPath:
              "polygon(35% 0%, 100% 7%, 82% 92%, 5% 100%, 0% 24%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 16%, black 80%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 16%, black 80%, transparent 100%)",
          }}
        >
          <img
            src={previousSlide.src}
            alt=""
            className="h-full w-full scale-110 object-cover grayscale-[30%]"
          />

          <div className="absolute inset-0 bg-[#090908]/35" />
        </motion.div>
      )}

      {/* Main cinematic image */}
      <div
        className="absolute inset-y-[3%] left-[7%] right-[2%] overflow-hidden"
        style={{
          clipPath:
            "polygon(11% 1%, 84% 0%, 100% 17%, 96% 78%, 78% 98%, 18% 94%, 0% 75%, 3% 22%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, black 7%, black 94%, transparent 100%)",
          maskImage:
            "linear-gradient(90deg, transparent 0%, black 7%, black 94%, transparent 100%)",
        }}
      >
        <AnimatePresence
          initial={false}
          custom={direction}
          mode="sync"
        >
          <motion.img
            key={activeSlide.id}
            custom={direction}
            src={activeSlide.src}
            alt={pick(
              activeSlide.en,
              activeSlide.bn,
            )}
            initial={
              shouldReduceMotion
                ? {
                    opacity: 1,
                  }
                : {
                    opacity: 0,
                    scale: 1.12,
                    x:
                      direction > 0
                        ? 55
                        : -55,
                  }
            }
            animate={{
              opacity: 1,
              scale: shouldReduceMotion
                ? 1
                : 1.035,
              x: 0,
            }}
            exit={
              shouldReduceMotion
                ? {
                    opacity: 0,
                  }
                : {
                    opacity: 0,
                    scale: 1.08,
                    x:
                      direction > 0
                        ? -45
                        : 45,
                  }
            }
            transition={imageTransition}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition:
                imagePositions[activeIndex] ||
                "center center",
            }}
          />
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#090908]/35 via-transparent to-[#090908]/20" />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090908]/70 via-transparent to-[#090908]/15" />

        {/* Moving light over image */}
        <motion.div
          aria-hidden="true"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: ["-150%", "190%"],
                }
          }
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatDelay: 2.5,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute inset-y-0 w-[22%] skew-x-[-12deg] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent blur-md"
        />
      </div>

      {/* Bottom image echo */}
      {nextSlide && (
        <motion.div
          aria-hidden="true"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [0, 12, 0],
                  x: [0, -7, 0],
              }
          }
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-[1%] right-[4%] h-[32%] w-[43%] overflow-hidden opacity-50"
          style={{
            clipPath:
              "ellipse(49% 45% at 52% 52%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        >
          <img
            src={nextSlide.src}
            alt=""
            className="h-full w-full scale-110 object-cover"
          />

          <div className="absolute inset-0 bg-[#090908]/25" />
        </motion.div>
      )}

      {/* Upper image texture */}
      {secondarySlide && (
        <motion.div
          aria-hidden="true"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1.05, 1.12, 1.05],
                  opacity: [0.14, 0.27, 0.14],
              }
          }
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-[1%] top-[1%] h-[34%] w-[35%] overflow-hidden"
          style={{
            clipPath:
              "polygon(18% 0%, 100% 12%, 87% 91%, 0% 72%)",
            WebkitMaskImage:
              "linear-gradient(135deg, transparent 3%, black 38%, transparent 92%)",
            maskImage:
              "linear-gradient(135deg, transparent 3%, black 38%, transparent 92%)",
          }}
        >
          <img
            src={secondarySlide.src}
            alt=""
            className="h-full w-full object-cover grayscale"
          />
        </motion.div>
      )}

      {/* Decorative lines */}
      <motion.div
        aria-hidden="true"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                y: [0, 22, 0],
              }
        }
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute right-[7%] top-[12%] h-24 w-px bg-gradient-to-b from-transparent via-archive-amber/70 to-transparent"
      />

      <motion.div
        aria-hidden="true"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                y: [0, -16, 0],
              }
        }
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute bottom-[17%] left-[9%] h-20 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"
      />

      {/* Simple navigation without numbers */}
      {totalSlides > 1 && (
        <div className="absolute bottom-[7%] right-[8%] z-20 flex items-center gap-3">
          <button
            type="button"
            onClick={showPreviousSlide}
            aria-label={pick(
              "Previous image",
              "আগের ছবি",
            )}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/30 text-white/75 backdrop-blur-xl transition hover:border-archive-amber/50 hover:bg-archive-amber/10 hover:text-archive-amber focus:outline-none focus:ring-2 focus:ring-archive-amber/40"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={showNextSlide}
            aria-label={pick(
              "Next image",
              "পরের ছবি",
            )}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/30 text-white/75 backdrop-blur-xl transition hover:border-archive-amber/50 hover:bg-archive-amber/10 hover:text-archive-amber focus:outline-none focus:ring-2 focus:ring-archive-amber/40"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Small non-numbered dots */}
      {totalSlides > 1 && (
        <div className="absolute bottom-[8.5%] left-[13%] z-20 flex items-center gap-2">
          {slides.map((slide, index) => {
            const isActive =
              index === activeIndex;

            return (
              <button
                key={slide.id}
                type="button"
                onClick={() =>
                  changeSlide(
                    index,
                    index > activeIndex
                      ? 1
                      : -1,
                  )
                }
                aria-label={pick(
                  "Show archive image",
                  "আর্কাইভের ছবি দেখুন",
                )}
                aria-current={
                  isActive ? "true" : undefined
                }
                className={`h-1.5 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-archive-amber/40 ${
                  isActive
                    ? "w-8 bg-archive-amber"
                    : "w-1.5 bg-white/30 hover:bg-white/60"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}