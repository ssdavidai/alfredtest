const config = {
  appName: "Alfred - AI Automation Platform",
  appDescription: "Your AI butler for business automation. Get a dedicated VM with LibreChat, NocoDB, and unlimited MCP connections.",
  domainName: "alfred.rocks",
  crisp: { id: "", onlyShowOnRoutes: ["/"] },
  stripe: {
    plans: [{
      isFeatured: true,
      priceId: process.env.NODE_ENV === "development" ? "price_1Niyy5AxyNprDp7iZIqEyD2h" : "price_456",
      name: "Alfred Pro",
      description: "Complete AI automation infrastructure",
      price: 29,
      priceAnchor: 49,
      features: [
        { name: "Dedicated AI automation VM" },
        { name: "LibreChat (AI chat interface)" },
        { name: "NocoDB (database UI)" },
        { name: "Unlimited MCP connections" },
        { name: "SSH access to your VM" },
        { name: "24/7 health monitoring" },
      ],
    }],
  },
  aws: { bucket: "bucket-name", bucketUrl: `https://bucket-name.s3.amazonaws.com/`, cdn: "https://cdn-id.cloudfront.net/" },
  resend: { fromNoReply: `Alfred <onboarding@resend.dev>`, fromAdmin: `Alfred Team <onboarding@resend.dev>`, supportEmail: "support@alfred.rocks" },
  colors: { theme: "light", main: "hsl(var(--p))" },
  auth: { loginUrl: "/api/auth/signin", callbackUrl: "/dashboard" },
};
export default config;
