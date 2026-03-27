import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/redux/hooks';
import { TiltCard } from "./TiltCard";

function Intro() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const showTeamRegistrationButton = isAuthenticated && user?.role === 'USER' && !user?.hasTeam;

    return (
        <section id="Intro" className="w-full min-h-screen py-24 md:py-24 lg:py-32 xl:py-30 relative">
            <div className="mx-auto w-[88%] max-w-[1240px] px-4 md:px-8 lg:px-10 relative z-10">
                <div className="grid items-center gap-8 md:gap-10 lg:gap-12 lg:grid-cols-[60%_40%]">
                    <div className="flex flex-col justify-center space-y-4 max-w-[680px]">
                        <div className="space-y-2">
                            <h1
                                className="text-4xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none bg-gradient-to-r from-white to-zinc-300 text-transparent bg-clip-text"
                                style={{ filter: "drop-shadow(0 2px 0 rgba(0,0,0,0.9)) drop-shadow(0 6px 0 rgba(0,0,0,0.75)) drop-shadow(0 14px 20px rgba(0,0,0,0.5)) drop-shadow(0 0 8px rgba(192,132,252,0.3)) drop-shadow(0 0 24px rgba(168,85,247,0.22))" }}
                            >
                                UIT COLLEGIATE PROGRAMMING CONTEST 2025
                            </h1>
                            <p className="max-w-[600px] text-zinc-400 md:text-xl">
                                A competitive programming event where students challenge their coding skills and teamwork.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 min-[400px]:flex-row">
                            {!isAuthenticated ? (
                                <>
                                    <button onClick={() => navigate('/register')} className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-11 rounded-md px-8 gap-1">
                                        Đăng ký tài khoản
                                    </button>
                                    <button onClick={() => navigate('/login')} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium border bg-background hover:text-accent-foreground h-11 rounded-md px-8 border-zinc-700 text-white hover:bg-zinc-800">
                                        Đăng nhập
                                    </button>
                                </>
                            ) : showTeamRegistrationButton ? (
                                <button onClick={() => navigate('/user')} className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-11 rounded-md px-16 gap-1">
                                    Đăng ký team
                                </button>
                            ) : null
                            }
                        </div>

                    </div>
                    {/* <div className="relative group">

                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />


                        <img
                            alt="Dashboard Preview"
                            loading="lazy"
                            width={600}
                            height={600}
                            decoding="async"
                            className="relative mx-auto w-[600px] overflow-hidden rounded-xl border border-zinc-800 shadow-2xl"
                            src="/photos/POSTER_02.png"
                            style={{ color: "transparent" }}
                        />
                    </div> */}

                    <div className="relative group w-full max-w-[460px] lg:justify-self-center">
                        <TiltCard
                            options={{ max: 30 , speed: 400, scale: 1.05 }}
                            className="rounded-3xl overflow-hidden w-full relative shadow-[0_0_40px_6px_rgba(208,32,157,0.6)] ring-[3px] ring-white/50 hover:shadow-[0_0_24px_12px_rgba(208,32,157,0.8)]"
                        >
                            <div className="absolute inset-0 blur-2xl opacity-50 rounded-3xl bg-[#D0209D]/40 z-0  group-hover:opacity-70" />
                            <img
                                src="/photos/POSTER_00.png"
                                className="object-cover w-full h-[60%] relative z-10"
                                alt="cover"
                            />
                        </TiltCard>
                    </div>


                </div>
            </div>
        </section >
    );
}

export default Intro;
