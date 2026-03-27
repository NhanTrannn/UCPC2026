import { motion, useInView } from "framer-motion";
import { Award, CircleDot, Crown, Trophy } from "lucide-react";
import { useRef } from "react";

const awardCards = [
  {
    title: "Giải Nhì",
    amount: "30.000.000đ",
    Icon: Award,
    tagline: "Silver Trophy",
    perks: ["Quà tặng từ NTT Công nghệ"],
    isFeatured: false,
    frameClass: "border-slate-200/75 shadow-[0_0_22px_rgba(226,232,240,0.5)]",
    textClass: "text-slate-100",
    amountClass: "text-white",
  },
  {
    title: "Giải Nhất",
    amount: "100.000.000đ",
    Icon: Trophy,
    badge: "Winner Champion",
    tagline: "Gold Cup & Certificates",
    perks: ["Suất thực tập tại Big Tech"],
    isFeatured: true,
    frameClass: "border-yellow-300 shadow-[0_0_22px_rgba(255,215,0,0.7),0_0_64px_rgba(255,215,0,0.32)]",
    textClass: "text-yellow-100",
    amountClass: "text-white",
  },
  {
    title: "Giải Ba",
    amount: "15.000.000đ",
    Icon: Crown,
    tagline: "Bronze Trophy",
    perks: ["Quà tặng NTT"],
    isFeatured: false,
    frameClass: "border-amber-700/70 shadow-[0_0_18px_rgba(217,119,6,0.38)]",
    textClass: "text-amber-200",
    amountClass: "text-amber-400",
  },
];

export default function Awards() {
  const cardsRef = useRef(null);
  const cardsInView = useInView(cardsRef, { once: true, margin: "-80px 0px -40px 0px" });

  return (
    <section id="Pricing" className="relative -mt-px w-full overflow-hidden py-24 md:py-28">
      <div className="relative z-10 mx-auto w-[92%] max-w-[1180px]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-bevietnam mt-4 px-2 text-3xl font-bold leading-tight tracking-tight text-white md:px-0 md:text-5xl">
            Giải thưởng xứng tầm cho những đội đột phá mạnh nhất
          </h2>
          <p className="mt-4 text-[10px] uppercase tracking-[0.35em] text-zinc-400 md:text-xs">Quỹ thưởng mùa giải 2026</p>
          <div className="mx-auto mt-4 h-px w-20 bg-cyan-300/80" />
        </div>

        <div ref={cardsRef} className="mt-12 grid items-end gap-6 md:grid-cols-3 md:gap-8">
          {awardCards.map((award, index) => (
            <motion.article
              key={award.title}
              initial={{ opacity: 0, y: 42, scale: 0.96 }}
              animate={cardsInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{
                duration: 0.68,
                delay: 0.12 + index * 0.14,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`relative overflow-hidden rounded-[22px] border bg-[#0c0a1a]/88 px-5 pb-7 pt-8 backdrop-blur-sm transition duration-300 md:px-6 ${award.frameClass} ${award.isFeatured ? "md:min-h-[460px] md:scale-[1.03]" : "md:min-h-[390px] md:translate-y-7"}`}
            >
              {award.isFeatured && (
                <>
                  <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-yellow-300/25 blur-3xl" />
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-xl border-x border-b border-yellow-200/60 bg-yellow-300 px-5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-900">
                    {award.badge}
                  </div>
                </>
              )}

              <div className="relative z-10 mt-3 flex flex-col items-center text-center">
                <award.Icon className={`h-10 w-10 ${award.isFeatured ? "text-yellow-300" : award.textClass}`} />
                <h3 className={`mt-5 text-3xl font-black uppercase italic tracking-tight ${award.textClass}`}>
                  {award.title}
                </h3>
                <p className={`mt-4 text-[42px] font-black leading-none md:text-[48px] ${award.amountClass}`}>
                  {award.amount}
                </p>

                <p className={`mt-6 text-sm italic ${award.isFeatured ? "text-yellow-300" : "text-zinc-400"}`}>
                  {award.tagline}
                </p>

                <div className="mt-5 space-y-2 text-sm text-zinc-300">
                  {award.perks.map((perk) => (
                    <p key={perk} className="flex items-center justify-center gap-2">
                      <CircleDot size={12} className={award.isFeatured ? "text-yellow-300" : "text-zinc-500"} />
                      <span>{perk}</span>
                    </p>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
