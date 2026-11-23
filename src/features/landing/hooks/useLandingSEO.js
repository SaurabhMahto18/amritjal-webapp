
import { useEffect } from "react";

const SITE_NAME = "Amrit Jal";
const DEFAULT_THEME_COLOR = "#F7F6F0";

function updateMetaTag(attribute, key, content) {
  if (!content) return;

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

function updateCanonical(url) {
  let canonical = document.head.querySelector(
    'link[rel="canonical"]'
  );

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }

  canonical.setAttribute("href", url);
}

function updateStructuredData(data) {
  let script = document.getElementById(
    "amrit-jal-structured-data"
  );

  if (!script) {
    script = document.createElement("script");
    script.id = "amrit-jal-structured-data";
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
}

export function useLandingSEO({
  title,
  description,
  keywords = [],
  canonicalPath = "/",
  schemaType = "software",
  image,
}) {
  useEffect(() => {
    const origin = window.location.origin;
    const canonicalUrl = new URL(canonicalPath, origin).href;

    document.title = title;

    updateMetaTag("name", "description", description);
    updateMetaTag("name", "keywords", keywords.join(", "));
    updateMetaTag("name", "robots", "index, follow");
    updateMetaTag("name", "googlebot", "index, follow");
    updateMetaTag("name", "author", SITE_NAME);
    updateMetaTag("name", "theme-color", DEFAULT_THEME_COLOR);

    updateCanonical(canonicalUrl);

    updateMetaTag("property", "og:type", "website");
    updateMetaTag("property", "og:site_name", SITE_NAME);
    updateMetaTag("property", "og:title", title);
    updateMetaTag("property", "og:description", description);
    updateMetaTag("property", "og:url", canonicalUrl);
    updateMetaTag("property", "og:locale", "en_IN");

    if (image) {
      updateMetaTag("property", "og:image", image);
    }

    updateMetaTag("name", "twitter:card", "summary_large_image");
    updateMetaTag("name", "twitter:title", title);
    updateMetaTag("name", "twitter:description", description);

    if (image) {
      updateMetaTag("name", "twitter:image", image);
    }

    if (schemaType === "software") {
      updateStructuredData({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description,
        url: canonicalUrl,
      });
    }

    return () => {
      const script = document.getElementById(
        "amrit-jal-structured-data"
      );

      if (script) script.remove();
    };
  }, [
    title,
    description,
    keywords,
    canonicalPath,
    schemaType,
    image,
  ]);
}
