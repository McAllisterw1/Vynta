import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Pain from "@/components/Pain";
import Features from "@/components/Features";
import Voices from "@/components/Voices";
import Results from "@/components/Results";
import Trust from "@/components/Trust";
import ReviewTrainingSection from "@/components/ReviewTrainingSection";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Pain />
      <Features />
      <Voices />
      <Results />
      <Trust />
      <ReviewTrainingSection />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
