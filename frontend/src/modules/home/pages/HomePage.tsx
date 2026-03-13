import FadeInSection from '../../../components/FadeInSection';
import Footer from '../../../components/Footer/footer';
import Intro from '../../../components/Intro/Intro';
import News from '../../../components/News/News';
import Rules from '../../../components/Rules/Rules';
import UITInformation from '../../../components/UITInformation/Info';
import Header from '../../../pages/Home/header';

function HomePage() {
  return (
    <div className="flex flex-col w-full space-y-0 bg-gradient-to-br from-[#492A51] via-[#1F2937] to-[#374151] text-white">
      <Header />
      <FadeInSection>
        <Intro />
      </FadeInSection>
      <FadeInSection>
        <News />
      </FadeInSection>
      <FadeInSection>
        <Rules />
      </FadeInSection>
      <FadeInSection>
        <UITInformation />
      </FadeInSection>
      <Footer />
    </div>
  );
}

export default HomePage;
