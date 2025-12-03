const config = {
  appName: "Alfred",
  appDescription: "Your AI butler - Zero-config AI automation platform with dedicated infrastructure",
  domainName: "alfred.rocks",
  crisp: { id: "", onlyShowOnRoutes: ["/"] },
  stripe: {
    plans: [{
      isFeatured: true,
      priceId: process.env.NODE_ENV === "development" ? "price_1Niyy5AxyNprDp7iZIqEyD2h" : "price_456",
      name: "Alfred Pro",
      description: "Your personal AI butler for automation",
      price: 29,
      priceAnchor: 49,
      features: [
        { name: "Dedicated AI agent infrastructure" },
        { name: "Zero-config deployment" },
        { name: "Full data sovereignty" },
        { name: "Extensible plugin system" },
        { name: "Self-teaching capabilities" },
        { name: "Priority support" },
      ],
    }],
  },
  aws: { bucket: "bucket-name", bucketUrl: `https://bucket-name.s3.amazonaws.com/`, cdn: "https://cdn-id.cloudfront.net/" },
  resend: { fromNoReply: `Alfred <noreply@alfred.rocks>`, fromAdmin: `Alfred Team <hello@alfred.rocks>`, supportEmail: "support@alfred.rocks" },
  colors: { theme: "light", main: "hsl(var(--p))" },
  auth: { loginUrl: "/api/auth/signin", callbackUrl: "/dashboard" },
};
export default config;
