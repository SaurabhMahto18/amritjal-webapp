
import { useEffect } from "react";

import LandingNavbar from "../../../components/landing/LandingNavbar";
import LandingFooter from "../../../components/landing/LandingFooter";
import HeroSection from "../components/HeroSection";
import TrustHighlights from "../components/TrustHighlights";
import AboutSection from "../components/AboutSection";
import FeaturesSection from "../components/FeaturesSection";
import HowItWorksSection from "../components/HowItWorksSection";
import TargetAudienceSection from "../components/TargetAudienceSection";
import FAQSection from "../components/FAQSection";
import CTASection from "../components/CTASection";
import ContactSection from "../components/ContactSection";
import BusinessChallengesSection from "../components/BusinessChallengesSection";
import PricingSection from "../components/PricingSection";

const SEO = {
  title:
    "Amrit Jal – Water Delivery & Jar Business Management Software",
  description:
    "Manage your water jar delivery business with Amrit Jal. Track customers, daily deliveries, jar inventory, payments, invoices, expenses and business performance in one platform.",
  keywords: [
    "water delivery management software",
    "water jar delivery software",
    "water supplier management system",
    "water can business management software",
    "water delivery billing software",
    "water jar inventory management",
    "water delivery business app",
    "customer ledger management",
    "water delivery invoice software",
  ].join(", "),
};

function updateMetaTag(attribute, key, content) {
  let element = document.head.querySelector(
    `meta[${attribute}="${key}"]`
  );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

export default function LandingPage() {
  useEffect(() => {
    const canonicalUrl =
      `${window.location.origin}${window.location.pathname}`;

    // Basic SEO
    document.title = SEO.title;

    updateMetaTag("name", "description", SEO.description);
    updateMetaTag("name", "keywords", SEO.keywords);
    updateMetaTag("name", "robots", "index, follow");
    updateMetaTag("name", "googlebot", "index, follow");
    updateMetaTag("name", "author", "Amrit Jal");
    updateMetaTag("name", "theme-color", "#F7FAFC");

    // Canonical URL
    let canonical = document.head.querySelector(
      'link[rel="canonical"]'
    );

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }

    canonical.setAttribute("href", canonicalUrl);

    // Open Graph SEO
    updateMetaTag("property", "og:type", "website");
    updateMetaTag("property", "og:site_name", "Amrit Jal");
    updateMetaTag("property", "og:title", SEO.title);
    updateMetaTag("property", "og:description", SEO.description);
    updateMetaTag("property", "og:url", canonicalUrl);
    updateMetaTag("property", "og:locale", "en_IN");

    // Twitter Cards
    updateMetaTag("name", "twitter:card", "summary_large_image");
    updateMetaTag("name", "twitter:title", SEO.title);
    updateMetaTag("name", "twitter:description", SEO.description);

    // Structured Data: SoftwareApplication
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Amrit Jal",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: SEO.description,
      url: canonicalUrl,
    };

    let schemaScript = document.getElementById(
      "amrit-jal-structured-data"
    );

    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.id = "amrit-jal-structured-data";
      schemaScript.type = "application/ld+json";
      document.head.appendChild(schemaScript);
    }

    schemaScript.textContent = JSON.stringify(structuredData);

  }, []);

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-slate-900">
      <LandingNavbar />

      <main>
        <HeroSection />
        <TrustHighlights />
        <BusinessChallengesSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <TargetAudienceSection />
        <AboutSection/>
        <FAQSection />
        <CTASection />
        <ContactSection />

      </main>

      <LandingFooter />
    </div>
  );
}
