// import React, { useState, useEffect, useRef } from "react";
// import { Users, FileText, Shield } from "lucide-react";
// import clsx from "clsx";

// const tabs = [
//   {
//     id: "audience",
//     label: "Đối tượng",
//     icon: <Users size={18} />,
//     content: (
//       <p>
//         Các bạn học sinh, sinh viên đang theo học tại các trường trên địa bàn
//         thành phố Hồ Chí Minh.
//       </p>
//     ),
//   },
//   {
//     id: "format",
//     label: "Hình thức đăng ký",
//     icon: <FileText size={18} />,
//     content: (
//       <div className="space-y-2">
//         <p>- Sinh viên: đăng ký theo đội 3 thành viên.</p>
//         <p>
//           - Học sinh: đăng ký theo đội 3 thành viên và 1 huấn luyện viên là giáo
//           viên trường.
//         </p>
//         <p className="font-semibold">Lưu ý:</p>
//         <ul className="list-disc ml-6 text-sm">
//           <li>
//             Sinh viên từng đạt giải Quốc gia trở lên môn Tin sẽ không được tham
//             gia.
//           </li>
//         </ul>
//       </div>
//     ),
//   },
//   {
//     id: "rules",
//     label: "Quy định",
//     icon: <Shield size={18} />,
//     content: (
//       <ul className="list-disc ml-5 space-y-1">
//         <li>Không sử dụng internet trong thời gian thi.</li>
//         <li>Không gian lận, trao đổi giữa các đội.</li>
//         <li>Ban tổ chức có quyền xử lý các hành vi vi phạm.</li>
//       </ul>
//     ),
//   },
// ];

// export default function Rules() {
//   const [isVisible, setIsVisible] = useState(false);
//   const sectionRef = useRef(null);

//   // Các refs cho nhánh để theo dõi khi chúng xuất hiện
//   const branch1Ref = useRef(null);
//   const branch2Ref = useRef(null);
//   const branch3Ref = useRef(null);
//   const card1Ref = useRef(null);
//   const card2Ref = useRef(null);
//   const card3Ref = useRef(null);

//   // Trạng thái visible cho từng nhánh
//   const [branch1Visible, setBranch1Visible] = useState(false);
//   const [branch2Visible, setBranch2Visible] = useState(false);
//   const [branch3Visible, setBranch3Visible] = useState(false);
//   const [card1Visible, setCard1Visible] = useState(false);
//   const [card2Visible, setCard2Visible] = useState(false);
//   const [card3Visible, setCard3Visible] = useState(false);
//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           setIsVisible(true); // Khi phần tử chính xuất hiện
//         } else {
//           setIsVisible(false);
//         }
//       },
//       { threshold: 0.5 }
//     );

//     if (sectionRef.current) {
//       observer.observe(sectionRef.current);
//     }

//     return () => {
//       if (sectionRef.current) {
//         observer.unobserve(sectionRef.current);
//       }
//     };
//   }, []);

//   // Hàm theo dõi các nhánh
//   const observeBranch = (ref, setVisible) => {
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           setVisible(true);
//         } else {
//           setVisible(false);
//         }
//       },
//       { threshold: 0.5 }
//     );

//     if (ref.current) {
//       observer.observe(ref.current);
//     }

//     return () => {
//       if (ref.current) {
//         observer.unobserve(ref.current);
//       }
//     };
//   };

//   useEffect(() => {
//     const cleanBranch1 = observeBranch(branch1Ref, setBranch1Visible);
//     const cleanBranch2 = observeBranch(branch2Ref, setBranch2Visible);
//     const cleanBranch3 = observeBranch(branch3Ref, setBranch3Visible);
//     const cleanCard1 = observeBranch(card1Ref, setCard1Visible);
//     const cleanCard2 = observeBranch(card2Ref, setCard2Visible);
//     const cleanCard3 = observeBranch(card3Ref, setCard3Visible);
//     return () => {
//       cleanBranch1();
//       cleanBranch2();
//       cleanBranch3();
//       cleanCard1();
//       cleanCard2();
//       cleanCard3();
//     };
//   }, []);

//   return (
//     <section
//       id="Rules"
//       className="w-full px-6 md:px-20 bg-gradient-to-br from-purple-900/20 to-black h-screen py-12 md:py-24 lg:py-32 relative overflow-hidden text-white"
//       ref={sectionRef}
//     >
//       {/* Background gradient */}
//       <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-black z-0" />
//       <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] opacity-10 mix-blend-overlay z-0" />

//       {/* Nội dung chính */}
//       <div className="flex flex-col items-center justify-center space-y-4 text-center">
//         <div className="relative inline-block rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1 text-md text-white">
//           Rules
//         </div>
//         <h2 className="relative text-3xl font-bold tracking-tighter md:text-4xl/tight bg-gradient-to-r from-white to-zinc-300 text-transparent bg-clip-text">
//           Thể lệ cuộc thi
//         </h2>
//         <p className="relative max-w-[900px] text-zinc-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
//           Cùng khám phá những điều kiện và quy định giúp bạn sẵn sàng chinh phục
//           đấu trường lập trình.
//         </p>
//       </div>

//       <div className="relative z-10 max-w-6xl mx-auto">
//         <div className="relative w-full flex justify-center my-10 items-start py-10">
//           {/* Thanh dọc động */}
//           <div
//             className={clsx("absolute top-0 left-1/2 w-1 bg-cyan-300", {
//               "animate-dropDown": isVisible,
//             })}
//           />

//           {/* Thanh ngang động */}
//           <div
//             className={clsx("absolute top-[80px] left-1/2 h-1 bg-cyan-300", {
//               "animate-expandLine": isVisible,
//             })}
//           />

//           {/* Ba nhánh nội dung */}
//           <div className="relative w-full mt-[100px] z-10 h-[300px]">
//             {/* Nhánh 1 */}
//             <div className="absolute left-[calc(10%-66px)] flex flex-col items-center w-[250px]">
//               <div
//                 className={clsx("absolute -top-15 w-1 bg-cyan-300", {
//                   "animate-branchDown": isVisible,
//                 })}
//               />
//               <div
//                 className={clsx(
//                   "w-5 h-5 rounded-full bg-cyan-300 shadow-lg ring-2 ring-white opacity-0",
//                   {
//                     "animate-fadeIn": isVisible,
//                   }
//                 )}
//                 style={{
//                   animationDelay: "2.3s",
//                   animationFillMode: "forwards",
//                 }}
//               />
//               <h3 className="font-semibold text-lg mt-3">Đối tượng</h3>
//               <div
//                 ref={card1Ref}
//                 className={clsx(
//                   "transition-opacity duration-700 ease-in-out",
//                   card1Show
//                     ? "opacity-100"
//                     : "opacity-0 h-0 overflow-hidden pointer-events-none"
//                 )}
//               >
//                 Các bạn học sinh, sinh viên đang theo học tại các trường trên
//                 địa bàn thành phố Hồ Chí Minh.
//               </div>
//             </div>
//             {/* Nhánh 2 */}
//             <div className="absolute left-[calc(50%-123px)] flex flex-col items-center w-[250px]">
//               <div
//                 className={clsx("absolute -top-15 w-1 bg-cyan-300", {
//                   "animate-branchDown": isVisible,
//                 })}
//               />
//               <div
//                 className={clsx(
//                   "w-5 h-5 rounded-full bg-cyan-300 shadow-lg ring-2 ring-white opacity-0",
//                   {
//                     "animate-fadeIn": isVisible,
//                   }
//                 )}
//                 style={{
//                   animationDelay: "2.3s",
//                   animationFillMode: "forwards",
//                 }}
//               />
//               <h3 className="font-semibold text-lg mt-3">Hình thức đăng ký</h3>
//               <div
//                 ref={card2Ref}
//                 className={clsx(
//                   "card-animation mt-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/20 text-left text-white text-sm transition-all duration-700",
//                   {
//                     "opacity-100 translate-y-0": card2Visible,
//                     "opacity-0 translate-y-10": !card2Visible,
//                   }
//                 )}
//                 style={{
//                   animationDelay: "2.5s",
//                   animationFillMode: "forwards",
//                 }}
//               >
//                 <p>- Sinh viên đăng ký theo đội 3 thành viên.</p>
//                 <p>
//                   - Học sinh đăng ký theo đội 3 thành viên và 1 huấn luyện viên
//                   là giáo viên.
//                 </p>
//                 <p>
//                   Lưu ý: Sinh viên từng đạt giải Quốc gia sẽ không được tham
//                   gia.
//                 </p>
//               </div>
//             </div>
//             {/* Nhánh 3 */}
//             <div className="absolute left-[calc(50%+277px)] flex flex-col items-center w-[250px]">
//               <div
//                 className={clsx("absolute -top-15 w-1 bg-cyan-300", {
//                   "animate-branchDown": isVisible,
//                 })}
//               />
//               <div
//                 className={clsx(
//                   "w-5 h-5 rounded-full bg-cyan-300 shadow-lg ring-2 ring-white opacity-0",
//                   {
//                     "animate-fadeIn": isVisible,
//                   }
//                 )}
//                 style={{
//                   animationDelay: "2.3s",
//                   animationFillMode: "forwards",
//                 }}
//               />
//               <h3 className="font-semibold text-lg mt-3">Quy định</h3>
//               <div
//                 ref={card3Ref}
//                 className={clsx(
//                   "card-animation mt-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/20 text-left text-white text-sm transition-all duration-700",
//                   {
//                     "opacity-100 translate-y-0": card3Visible,
//                     "opacity-0 translate-y-10": !card3Visible,
//                   }
//                 )}
//                 style={{
//                   animationDelay: "2.5s",
//                   animationFillMode: "forwards",
//                 }}
//               >
//                 <p>- Không sử dụng internet trong thời gian thi.</p>
//                 <p>- Không gian lận hoặc trao đổi giữa các đội.</p>
//                 <p>- Ban tổ chức có toàn quyền xử lý vi phạm.</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// import React, { useState, useEffect, useRef } from "react";
// import { Users, FileText, Shield } from "lucide-react";
// import clsx from "clsx";

// const tabs = [
//   {
//     id: "audience",
//     label: "Đối tượng",
//     icon: <Users size={18} />,
//     content: (
//       <p>
//         Các bạn học sinh, sinh viên đang theo học tại các trường trên địa bàn
//         thành phố Hồ Chí Minh.
//       </p>
//     ),
//   },
//   {
//     id: "format",
//     label: "Hình thức đăng ký",
//     icon: <FileText size={18} />,
//     content: (
//       <div className="space-y-2">
//         <p>- Sinh viên: đăng ký theo đội 3 thành viên.</p>
//         <p>
//           - Học sinh: đăng ký theo đội 3 thành viên và 1 huấn luyện viên là giáo
//           viên trường.
//         </p>
//         <p className="font-semibold">Lưu ý:</p>
//         <ul className="list-disc ml-6 text-sm">
//           <li>
//             Sinh viên từng đạt giải Quốc gia trở lên môn Tin sẽ không được tham
//             gia.
//           </li>
//         </ul>
//       </div>
//     ),
//   },
//   {
//     id: "rules",
//     label: "Quy định",
//     icon: <Shield size={18} />,
//     content: (
//       <ul className="list-disc ml-5 space-y-1">
//         <li>Không sử dụng internet trong thời gian thi.</li>
//         <li>Không gian lận, trao đổi giữa các đội.</li>
//         <li>Ban tổ chức có quyền xử lý các hành vi vi phạm.</li>
//       </ul>
//     ),
//   },
// ];

// export default function Rules() {
//   const [isVisible, setIsVisible] = useState(false);
//   const sectionRef = useRef(null);

//   const card1Ref = useRef(null);
//   const card2Ref = useRef(null);
//   const card3Ref = useRef(null);

//   const [card1Show, setCard1Show] = useState(false);
//   const [card2Show, setCard2Show] = useState(false);
//   const [card3Show, setCard3Show] = useState(false);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           setIsVisible(true);
//         } else {
//           setIsVisible(false);
//         }
//       },
//       { threshold: 0.5 }
//     );

//     if (sectionRef.current) {
//       observer.observe(sectionRef.current);
//     }

//     return () => {
//       if (sectionRef.current) {
//         observer.unobserve(sectionRef.current);
//       }
//     };
//   }, []);

//   const observeWithDelay = (ref, setVisibleFn) => {
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           const timeout = setTimeout(() => {
//             setVisibleFn(true);
//           }, 2600);
//           return () => clearTimeout(timeout);
//         } else {
//           setVisibleFn(false);
//         }
//       },
//       { threshold: 0.5 }
//     );

//     if (ref.current) observer.observe(ref.current);

//     return () => {
//       if (ref.current) observer.unobserve(ref.current);
//     };
//   };

//   useEffect(() => {
//     const clean1 = observeWithDelay(card1Ref, setCard1Show);
//     const clean2 = observeWithDelay(card2Ref, setCard2Show);
//     const clean3 = observeWithDelay(card3Ref, setCard3Show);

//     return () => {
//       clean1();
//       clean2();
//       clean3();
//     };
//   }, []);

//   return (
//     <section
//       id="Rules"
//       className="w-full px-6 md:px-20 bg-gradient-to-br from-purple-900/20 to-black h-screen py-12 md:py-24 lg:py-32 relative overflow-hidden text-white"
//       ref={sectionRef}
//     >
//       <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-black z-0" />
//       <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] opacity-10 mix-blend-overlay z-0" />

//       <div className="flex flex-col items-center justify-center space-y-4 text-center">
//         <div className="relative inline-block rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1 text-md text-white">
//           Rules
//         </div>
//         <h2 className="relative text-3xl font-bold tracking-tighter md:text-4xl/tight bg-gradient-to-r from-white to-zinc-300 text-transparent bg-clip-text">
//           Thể lệ cuộc thi
//         </h2>
//         <p className="relative max-w-[900px] text-zinc-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
//           Cùng khám phá những điều kiện và quy định giúp bạn sẵn sàng chinh phục
//           đấu trường lập trình.
//         </p>
//       </div>

//       <div className="relative z-10 max-w-6xl mx-auto">
//         <div className="relative w-full flex justify-center my-10 items-start py-10">
//           <div
//             className={clsx("absolute top-0 left-1/2 w-1 bg-cyan-300", {
//               "animate-dropDown": isVisible,
//             })}
//           />

//           <div
//             className={clsx("absolute top-[80px] left-1/2 h-1 bg-cyan-300", {
//               "animate-expandLine": isVisible,
//             })}
//           />

//           <div className="relative w-full mt-[100px] z-10 h-[300px]">
//             {/* Nhánh 1 */}
//             <div className="absolute left-[calc(10%-66px)] flex flex-col items-center w-[250px]">
//               <div
//                 className={clsx("absolute -top-15 w-1 bg-cyan-300", {
//                   "animate-branchDown": isVisible,
//                 })}
//               />
//               <div
//                 className={clsx(
//                   "w-5 h-5 rounded-full bg-cyan-300 shadow-lg ring-2 ring-white opacity-0",
//                   {
//                     "animate-fadeIn": isVisible,
//                   }
//                 )}
//                 style={{
//                   animationDelay: "2.3s",
//                   animationFillMode: "forwards",
//                 }}
//               />

//               <div
//                 ref={card1Ref}
//                 className={clsx(
//                   "transition-opacity duration-700 ease-in-out",
//                   card1Show
//                     ? "opacity-100"
//                     : "opacity-0 h-0 overflow-hidden pointer-events-none"
//                 )}
//               >
//                 <h3 className="text-center font-semibold text-lg mt-3">
//                   Đối tượng
//                 </h3>
//                 Các bạn học sinh, sinh viên đang theo học tại các trường trên
//                 địa bàn thành phố Hồ Chí Minh.
//               </div>
//             </div>

//             {/* Nhánh 2 */}
//             <div className="absolute left-[calc(50%-123px)] flex flex-col items-center w-[250px]">
//               <div
//                 className={clsx("absolute -top-15 w-1 bg-cyan-300", {
//                   "animate-branchDown": isVisible,
//                 })}
//               />
//               <div
//                 className={clsx(
//                   "w-5 h-5 rounded-full bg-cyan-300 shadow-lg ring-2 ring-white opacity-0",
//                   {
//                     "animate-fadeIn": isVisible,
//                   }
//                 )}
//                 style={{
//                   animationDelay: "2.3s",
//                   animationFillMode: "forwards",
//                 }}
//               />

//               <div
//                 ref={card2Ref}
//                 className={clsx(
//                   "transition-opacity duration-700 ease-in-out",
//                   card2Show
//                     ? "opacity-100"
//                     : "opacity-0 h-0 overflow-hidden pointer-events-none"
//                 )}
//               >
//                 <h3 className="text-center font-semibold text-lg mt-3">
//                   Hình thức đăng ký
//                 </h3>
//                 <p>- Sinh viên đăng ký theo đội 3 thành viên.</p>
//                 <p>
//                   - Học sinh đăng ký theo đội 3 thành viên và 1 huấn luyện viên
//                   là giáo viên.
//                 </p>
//                 <p>
//                   Lưu ý: Sinh viên từng đạt giải Quốc gia sẽ không được tham
//                   gia.
//                 </p>
//               </div>
//             </div>

//             {/* Nhánh 3 */}
//             <div className="absolute left-[calc(50%+277px)] flex flex-col items-center w-[250px]">
//               <div
//                 className={clsx("absolute -top-15 w-1 bg-cyan-300", {
//                   "animate-branchDown": isVisible,
//                 })}
//               />
//               <div
//                 className={clsx(
//                   "w-5 h-5 rounded-full bg-cyan-300 shadow-lg ring-2 ring-white opacity-0",
//                   {
//                     "animate-fadeIn": isVisible,
//                   }
//                 )}
//                 style={{
//                   animationDelay: "2.3s",
//                   animationFillMode: "forwards",
//                 }}
//               />

//               <div
//                 ref={card3Ref}
//                 className={clsx(
//                   "transition-opacity duration-700 ease-in-out",
//                   card3Show
//                     ? "opacity-100"
//                     : "opacity-0 h-0 overflow-hidden pointer-events-none"
//                 )}
//               >
//                 <h3 className="text-center font-semibold text-lg mt-3">
//                   Quy định
//                 </h3>

//                 <p >- Không sử dụng internet trong thời gian thi.</p>
//                 <p>- Không gian lận hoặc trao đổi giữa các đội.</p>
//                 <p>- Ban tổ chức có toàn quyền xử lý vi phạm.</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

import { FileText, Shield, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ruleCards = [
  {
    id: "audience",
    title: "Đối tượng",
    Icon: Users,
    content: (
      <div className="space-y-2">
        <p>
          - Sinh viên trường Đại học Công nghệ Thông tin; sinh viên của các trường Cao đẳng/ Đại học khác; học sinh Trung học phổ thông có yêu thích và muốn thử sức với phong cách thi lập trình sinh viên quốc tế đều được phép lập và đăng ký đội dự thi UCPC theo quy định của Ban Tổ chức.
        </p>
        <p>
          - Độ tuổi: 15 - 23 tuổi (tính đến ngày diễn ra cuộc thi).
        </p>
      </div>
    ),
  },
  {
    id: "format",
    title: "Hình thức đăng ký",
    Icon: FileText,
    content: (
      <div className="space-y-2">
        <p>- Sinh viên: đăng ký theo đội 3 thành viên.</p>
        <p>
          - Học sinh: đăng ký theo đội 3 thành viên và 1 huấn luyện viên là giáo
        </p>
        <p className="font-semibold">Lưu ý:</p>
        <ul className="list-disc ml-5 space-y-1 text-sm">
          <li>
            Sinh viên từng đạt giải Quốc gia trở lên môn Tin sẽ không được tham
            gia.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "rules",
    title: "Quy định",
    Icon: Shield,
    content: (
      <ul className="list-disc ml-5 space-y-1">
        <li>Không sử dụng internet trong thời gian thi.</li>
        <li>Không gian lận, trao đổi giữa các đội.</li>
        <li>Ban tổ chức có quyền xử lý các hành vi vi phạm.</li>
      </ul>
    ),
  },
];

export default function Rules() {
  const flowDuration = 5000;
  const sectionRef = useRef(null);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [reached, setReached] = useState([false, false, false]);
  const [flipped, setFlipped] = useState([false, false, false]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimationStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!animationStarted) {
      return;
    }

    const reachAt = [1 / 6, 1 / 2, 5 / 6].map((point) =>
      Math.round(flowDuration * point)
    );
    const timers = [];

    reachAt.forEach((time, index) => {
      timers.push(
        setTimeout(() => {
          setReached((prev) =>
            prev.map((value, cardIndex) => (cardIndex === index ? true : value))
          );
          setFlipped((prev) =>
            prev.map((value, cardIndex) => (cardIndex === index ? true : value))
          );
        }, time)
      );
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [animationStarted, flowDuration]);

  return (
    <section
      id="Rules"
      ref={sectionRef}
      className="w-full px-6 md:px-20 min-h-screen py-12 md:py-24 lg:py-28 relative overflow-hidden text-white"
    >
      <div className="relative z-30 flex flex-col items-center justify-center space-y-4 text-center">
        <h2 className="block py-1 text-3xl font-bold tracking-tighter leading-[1.18] md:text-5xl md:leading-[1.12] bg-gradient-to-r from-white via-zinc-100 to-zinc-400 text-transparent bg-clip-text">
          Thể lệ cuộc thi
        </h2>
        <p className="max-w-[900px] text-zinc-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          Cùng khám phá những điều kiện và quy định giúp bạn sẵn sàng chinh phục
          đấu trường lập trình.
        </p>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto mt-12">
        <div className="hidden md:block relative h-8 mb-8">
          <div className="absolute inset-x-8 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-purple-300/25" />
          <div
            className={`absolute left-8 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-[5000ms] ease-linear ${
              animationStarted ? "w-[calc(100%-4rem)]" : "w-0"
            }`}
          />
          <div className="absolute inset-y-0 inset-x-8 grid grid-cols-3 items-center">
            {ruleCards.map((card, index) => (
              <div key={card.id} className="flex justify-center">
                <span
                  className={`h-4 w-4 rounded-full border transition-all duration-300 ${
                    reached[index]
                      ? "border-purple-100 bg-purple-400 shadow-[0_0_18px_rgba(192,132,252,0.9)]"
                      : "border-purple-200/40 bg-zinc-700"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ruleCards.map((card, index) => (
            <article key={card.id} className="rules-card-shell mx-auto w-full max-w-[420px] md:max-w-[340px] lg:max-w-[360px]">
              <div
                className={`rules-card-inner ${
                  flipped[index] ? "is-flipped" : ""
                }`}
              >
                <div className="rules-card-face rules-card-back">
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.25em] text-purple-200/90">
                      UIT UCPC
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-fuchsia-100">
                      Thể Lệ {index + 1}
                    </p>
                  </div>
                </div>

                <div className="rules-card-face rules-card-front">
                  <div className="flex items-center gap-2 text-purple-300 mb-4">
                    <card.Icon size={18} />
                    <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                  </div>
                  <div className="text-sm text-zinc-300 leading-relaxed">{card.content}</div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className={`flex justify-center mt-10 ${flipped[2] ? "rules-btn-float-in" : "opacity-0 pointer-events-none"}`}>
          <a
            href="https://docs.google.com/document/d/1Q7Hm3W1r0LklF08nodmUKhHDkhYilKnX/edit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-purple-400/50 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:from-purple-700 hover:to-pink-700 hover:shadow-[0_0_20px_rgba(219,39,119,0.35)] transition-all duration-300"
          >
            Xem thêm
          </a>
        </div>
      </div>
    </section>
  );
}
