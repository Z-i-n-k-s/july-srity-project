import Hero from "../components/landing/Hero";
import TrustStrip from "../components/landing/TrustStrip";
import ArchiveOverview from "../components/landing/ArchiveOverview";
import FeaturedArchive from "../components/landing/FeaturedArchive";
import InteractiveMemoryMap from "../components/landing/InteractiveMemoryMap";
import TimelinePreview from "../components/landing/TimelinePreview";
import StoriesSection from "../components/landing/StoriesSection";
import SupportSection from "../components/landing/SupportSection";
import MissingSection from "../components/landing/MissingSection";
import VerificationSection from "../components/landing/VerificationSection";
import StatsSection from "../components/landing/StatsSection";
import SubmissionCTA from "../components/landing/SubmissionCTA";
import FinalCTA from "../components/landing/FinalCTA";

const Home = () => (
  <>
    <Hero />
    <TrustStrip />
    <ArchiveOverview />
    <FeaturedArchive />
    <InteractiveMemoryMap />
    <TimelinePreview />
    <StoriesSection />
    <SupportSection />
    <MissingSection />
    <VerificationSection />
    <StatsSection />
    <SubmissionCTA />
    <FinalCTA />
  </>
);

export default Home;
