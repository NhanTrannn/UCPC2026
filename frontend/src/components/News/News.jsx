import { AnimatePresence, motion } from "framer-motion";
import {
    Bell,
    Calendar,
    Newspaper,
    Trophy,
    Users,
} from "lucide-react";
import { useState } from "react";

const newsItems = [
    {
        image: "/photos/POSTER_00.png",
        imageAlt: "Poster cong bo lich thi UCPC 2025",
        icon: <Newspaper className="h-6 w-6 text-purple-500 mb-2" />,
        title: "Công bố thời gian tổ chức vòng loại",
        desc: "Vòng loại UCPC 2025 sẽ diễn ra vào ngày 5/6. Đăng ký trước ngày 28/5 để đảm bảo suất tham dự.",
    },
    {
        image: "/photos/POSTER_01.png",
        imageAlt: "Cong bo the le UCPC",
        icon: <Bell className="h-6 w-6 text-purple-500 mb-2" />,
        title: "Công bố thể lệ mới cho mùa giải 2026",
        desc: "Ban tổ chức đã cập nhật thể lệ thi đấu cho mùa giải 2026, bao gồm số lượng câu hỏi và thay đổi cách tính điểm.",
    },
    {
        image: "/photos/POSTER_02.png",
        imageAlt: "",
        icon: <Calendar className="h-6 w-6 text-purple-500 mb-2" />,
        title: "Lịch trình chi tiết đã được công bố",
        desc: "Lịch trình từ vòng loại đến vòng chung kết nay đã được cập nhật trên trang chính thức của UCPC.",
    },
    {
        image: "/photos/IMG_4707.JPG",
        imageAlt: "Vinh danh cac doi thi xuat sac",
        icon: <Trophy className="h-6 w-6 text-purple-500 mb-2" />,
        title: "Vinh danh các đội thi xuất sắc",
        desc: "Đội CodeBlitz, UIT Storm và NP-Hard đã có màn thể hiện xuất sắc tại UCPC năm trước.",
    },
    {
        image: "/photos/IMG_4832.JPG",
        imageAlt: "Dong dao thi sinh tham du UCPC",
        icon: <Users className="h-6 w-6 text-purple-500 mb-2" />,
        title: "Kỷ lục số lượng thí sinh",
        desc: "UCPC 2025 thu hút hơn 40 trường với gần 500 thí sinh — con số cao nhất từ trước đến nay.",
    },
];

export default function News() {
    const [activeIndex, setActiveIndex] = useState(0);
    const length = newsItems.length;

    const next = () => setActiveIndex((prev) => (prev + 1) % length);
    const prev = () => setActiveIndex((prev) => (prev - 1 + length) % length);

    // Trích 3 phần tử: prev - active - next (dạng vòng tròn)
    const getCircularItems = () => {
        const prevIndex = (activeIndex - 1 + length) % length;
        const nextIndex = (activeIndex + 1) % length;
        return [newsItems[prevIndex], newsItems[activeIndex], newsItems[nextIndex]];
    };

    const visibleItems = getCircularItems();

    return (
        <section
            id="News"
            className="relative w-full min-h-screen py-28"
        >
            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        {/* <div className="inline-block rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1 text-md text-white">
                            News
                        </div> */}
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight bg-gradient-to-r from-white to-zinc-300 text-transparent bg-clip-text">
                            Tin tức và thông báo
                        </h2>
                        <p className="max-w-[900px] text-zinc-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Cập nhật mới nhất về cuộc thi UIT Collegiate Programming Contest
                            2025: thông báo, lịch thi, thay đổi thể lệ và nhiều hơn nữa.
                        </p>
                    </div>
                </div>

                {/* Carousel - Hiển thị 3 tin và căn giữa */}
                <div className="flex justify-center items-center mt-10 space-x-6 transition-all duration-300">
                    <AnimatePresence mode="popLayout">
                        {visibleItems.map((item, idx) => {
                            const handleClick = () => {
                                if (idx === 0) prev();
                                else if (idx === 2) next();
                            };
                            const isCenter = idx === 1;
                            return (
                                <motion.div
                                    key={item.title}
                                    onClick={handleClick}
            className={`transform ${isCenter
                                            ? "scale-100 opacity-100 z-10"
                                            : "scale-90 opacity-50 z-0 hidden md:block"
                                        } w-full min-w-[320px] max-w-[460px] min-h-[52vh] bg-zinc-800/50 border border-zinc-700 rounded-xl p-7 shadow-sm backdrop-blur-sm`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    animate={{
                                        opacity: isCenter ? 1 : 0.5,
                                        scale: isCenter ? 1 : 0.9,
                                    }}
                                    exit={{ opacity: 0, scale: 0.85 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mb-4 overflow-hidden rounded-md border border-zinc-700/80">
                                        <img
                                            src={item.image}
                                            alt={item.imageAlt || item.title}
                                            className="h-52 w-full object-cover md:h-60"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div>{item.icon}</div>
                                    <h3 className="text-xl font-semibold text-white mb-2 md:text-2xl">
                                        {item.title}
                                    </h3>
                                    <p className="text-base leading-7 text-zinc-400">{item.desc}</p>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                </div>

                {/* Thanh trạng thái (nút chấm tròn) */}
                <div className="flex justify-center mt-6 space-x-2">
                    {newsItems.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === activeIndex
                                    ? "bg-purple-500 scale-110"
                                    : "bg-zinc-500 hover:bg-zinc-400"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
