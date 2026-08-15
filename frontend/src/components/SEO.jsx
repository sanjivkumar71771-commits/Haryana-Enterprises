import React from "react";
import { Helmet } from "react-helmet-async";

/**
 * Reusable SEO component. Renders <title>, meta description, canonical,
 * Open Graph, Twitter Card and optional JSON-LD structured data.
 *
 * Usage:
 *   <SEO title="..." description="..." path="/vacancies" jsonLd={...} />
 */
const SITE_URL = "https://hrdigitalservices.in";
const DEFAULT_IMAGE = `${SITE_URL}/og-cover.png`;

const SEO = ({
  title,
  description,
  path = "",
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  jsonLd = null,
}) => {
  const fullTitle = title
    ? `${title} | Haryana Enterprises`
    : "Haryana Enterprises | Govt. Approved Rooftop Solar Vendor · Sirsa";
  const url = `${SITE_URL}${path}`;
  const desc =
    description ||
    "Kagdana, Sirsa's Government-approved rooftop solar vendor. Consultation, site survey, installation assistance + latest sarkari job alerts for students.";

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
