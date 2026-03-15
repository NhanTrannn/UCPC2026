import { ArrowRight, Crown, Medal, Sparkles, Trophy } from "lucide-react";

const awardCards = [
  {
    title: "Giải Nhất",
    amount: "12.000.000đ",
    Icon: Crown,
    accent: "from-amber-300 via-yellow-300 to-orange-400",
    perks: ["Cúp vô địch", "Chứng nhận chính thức", "Quà tặng từ ban tổ chức"],
  },
  {
    title: "Giải Nhì",
    amount: "8.000.000đ",
    Icon: Trophy,
    accent: "from-cyan-300 via-sky-300 to-blue-400",
    perks: ["Kỷ niệm chương", "Chứng nhận chính thức", "Quà tặng học thuật"],
  },
  {
    title: "Giải Ba",
    amount: "5.000.000đ",
    Icon: Medal,
    accent: "from-fuchsia-300 via-pink-300 to-rose-400",
    perks: ["Kỷ niệm chương", "Chứng nhận chính thức", "Phần quà lưu niệm"],
  },
];

export default function Awards() {
  return (
    <section id="Pricing" className="relative w-full py-24 md:py-28 overflow-hidden">
      <div className="absolute inset-0 opacity-50">
        <div className="absolute left-[8%] top-24 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute right-[10%] top-40 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-[88%] max-w-[1240px]">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 backdrop-blur-sm">
              <Sparkles size={16} className="text-amber-300" />
              Quỹ thưởng mùa giải 2026
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter md:text-5xl bg-gradient-to-r from-white via-zinc-100 to-zinc-400 text-transparent bg-clip-text">
                Giải thưởng xứng tầm cho những đội bứt phá mạnh nhất
              </h2>
              <p className="text-zinc-400 md:text-lg leading-8">
                Ngoài phần thưởng tiền mặt, các đội đạt thành tích cao còn nhận được cúp,
                chứng nhận và cơ hội ghi dấu ấn trong cộng đồng lập trình thi đấu của UIT.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Tổng giá trị</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-5xl font-black text-white">25M+</span>
                <span className="pb-1 text-zinc-400">VNĐ giải thưởng và quà tặng</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-zinc-400">
                Cơ cấu giải có thể được cập nhật thêm khi có các đơn vị đồng hành chiến lược
                trong giai đoạn cận ngày thi.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {awardCards.map((award) => (
              <article
                key={award.title}
                className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${award.accent}`} />
                <div className="flex items-center justify-between">
                  <award.Icon className="h-9 w-9 text-white/90" />
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-300">
                    Award
                  </span>
                </div>

                <div className="mt-8">
                  <p className="text-sm uppercase tracking-[0.24em] text-zinc-400">{award.title}</p>
                  <p className="mt-3 text-3xl font-black text-white">{award.amount}</p>
                </div>

                <div className="mt-6 space-y-3 text-sm text-zinc-300">
                  {award.perks.map((perk) => (
                    <div key={perk} className="flex items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r ${award.accent}`} />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-2 text-sm font-medium text-zinc-200 transition-transform duration-300 group-hover:translate-x-1">
                  <span>Ghi danh để tranh giải</span>
                  <ArrowRight size={16} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
