import BackgroundImage from 'assets/login-background.jpg';
import { FullPageContainer } from 'components/Container';
import { LandingHeader } from 'components/Landing/LandingHeader';
import OnboardingGuidance from 'components/Landing/OnboardingGuidance';
import { HeadComponent } from 'components/Seo';
import { CONFIG } from 'config';
import { Socials } from 'pages';

export const getStaticProps = async () => ({
  props: {
    hideTopMenu: true,
  },
});

const OnboardingGuide: React.FC = () => {
  const { hostName } = CONFIG;

  return (
    <>
      <HeadComponent
        title="MetaGame: Onboarding Guide 🐙"
        description="Your journey into MetaGame has just begun. Here's how it works…"
        url={hostName}
        img={`${hostName}/assets/social.png`}
        cardStyle="summary_large_image"
      />
      <LandingHeader />
      <FullPageContainer
        bgImageUrl={BackgroundImage.src}
        bgSize="cover"
        bgPos="center"
        bgRepeat="no-repeat"
        overflow="auto"
      >
        <OnboardingGuidance />
      </FullPageContainer>
      <Socials />
    </>
  );
};
export default OnboardingGuide;
