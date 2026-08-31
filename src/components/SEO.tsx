import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  url?: string;
  image?: string;
}

export function SEO({
  title,
  description = "A simple, powerful app to manage your daily expenses, track your budget, and achieve financial goals.",
  keywords = "expense tracker, finance, budget planner, coding gurus",
  url = "https://expensetracker.com",
  image = "/logo.png"
}: SEOProps) {
  const fullTitle = `${title} | Expense Tracker`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Expense Tracker",
    "url": url,
    "description": description,
    "applicationCategory": "FinanceApplication",
    "author": {
      "@type": "Organization",
      "name": "Coding Gurus"
    }
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
