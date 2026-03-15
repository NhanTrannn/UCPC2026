import Awards from '../../../components/Awards/Awards';
import FadeInSection from '../../../components/FadeInSection';
import Footer from '../../../components/Footer/footer';
import Intro from '../../../components/Intro/Intro';
import News from '../../../components/News/News';
import Rules from '../../../components/Rules/Rules';
import Sponsors from '../../../components/Sponsors/Sponsors';
import UITInformation from '../../../components/UITInformation/Info';
import Header from '../../../pages/Home/header';

function HomePage() {
  return (
    <div className="relative flex flex-col w-full space-y-0 text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#492A51] via-[#1F2937] to-[#374151]" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-black" />

      <div className="relative z-10">
        <Header />
        <FadeInSection delay={0.05}>
          <Intro />
        </FadeInSection>
        <FadeInSection delay={0.08}>
          <News />
        </FadeInSection>
        <FadeInSection delay={0.1}>
          <Rules />
        </FadeInSection>
        <FadeInSection delay={0.12}>
          <Awards />
        </FadeInSection>
        <FadeInSection delay={0.14}>
          <Sponsors />
        </FadeInSection>
        <FadeInSection delay={0.16}>
          <UITInformation />
        </FadeInSection>
        <FadeInSection delay={0.06}>
          <Footer />
        </FadeInSection>
      </div>
    </div>
  );
}

export default HomePage;
