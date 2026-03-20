import { Building2, Handshake, Mail, Rocket } from "lucide-react";

const sponsorGroups = [
  {
    title: "Đơn vị tổ chức",
    Icon: Building2,
    entries: ["University of Information Technology (UIT)", "UIT Computer Science Faculty"],
    accent: "from-sky-400/30 to-cyan-300/10",
  },
  {
    title: "Đối tác cộng đồng",
    Icon: Handshake,
    entries: ["Mạng lưới cựu sinh viên UIT", "Cộng đồng lập trình thi đấu sinh viên"],
    accent: "from-emerald-400/30 to-teal-300/10",
  },
  {
    title: "Mở hợp tác 2026",
    Icon: Rocket,
    entries: ["Logo trên toàn bộ ấn phẩm truyền thông", "Không gian booth và hoạt động tuyển dụng"],
    accent: "from-fuchsia-400/30 to-rose-300/10",
  },
];

export default function Sponsors() {
  return (
    <section id="Investor" className="relative w-full py-24 md:py-28 overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
        <div className="absolute left-1/2 top-1/2 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
      </div>

      <div className="relative z-10 mx-auto w-[88%] max-w-[1240px]">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="mt-4 text-3xl font-bold tracking-tighter md:text-5xl bg-gradient-to-r from-white via-zinc-100 to-zinc-400 text-transparent bg-clip-text">
            Nhà tài trợ và đơn vị đồng hành
          </h2>
          <p className="mt-5 text-zinc-400 md:text-lg leading-8">
            UCPC tạo ra một điểm chạm trực tiếp giữa cộng đồng lập trình, sinh viên công nghệ và
            các tổ chức muốn đồng hành cùng thế hệ kỹ sư trẻ.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {sponsorGroups.map((group) => (
              <article
                key={group.title}
                className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm shadow-[0_24px_60px_rgba(0,0,0,0.22)]"
              >
                <div className={`inline-flex rounded-2xl bg-gradient-to-br ${group.accent} p-3`}>
                  <group.Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{group.title}</h3>
                <div className="mt-5 space-y-3">
                  {group.entries.map((entry) => (
                    <div key={entry} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-zinc-300">
                      {entry}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-7 md:p-8 backdrop-blur-sm shadow-[0_28px_70px_rgba(0,0,0,0.28)]">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Sponsor With UCPC</p>
            <h3 className="mt-4 text-3xl font-bold text-white md:text-4xl">
              Tìm kiếm một sân chơi công nghệ có chiều sâu để thương hiệu xuất hiện đúng nơi?
            </h3>
            <p className="mt-5 text-zinc-300 leading-8">
              Phần đồng hành tài trợ phù hợp với các đơn vị muốn tiếp cận nhóm sinh viên công nghệ,
              xây dựng hiện diện thương hiệu và tham gia vào chuỗi hoạt động học thuật chất lượng.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-3xl font-black text-white">500+</p>
                <p className="mt-2 text-sm text-zinc-400">Thí sinh và cộng đồng theo dõi dự kiến</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-3xl font-black text-white">40+</p>
                <p className="mt-2 text-sm text-zinc-400">Trường và đội thi kết nối qua mạng lưới cuộc thi</p>
              </div>
            </div>

            <a
              href="mailto:cs@uit.edu.vn?subject=UCPC%202026%20Sponsor%20Inquiry"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-400/10 px-6 py-3 text-sm font-medium text-emerald-300 transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-400/20 hover:shadow-[0_0_18px_rgba(110,231,183,0.35)]"
            >
              <Mail size={16} />
              Trở thành đơn vị đồng hành
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
