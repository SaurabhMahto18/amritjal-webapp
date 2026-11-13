# Amrit Jal Landing Page

React + Vite + Tailwind + React Router public landing page.

## Included

- Responsive public navbar and footer
- Hero section
- Trust highlights
- About section
- Features section
- How it works
- Dashboard preview
- Target audience
- FAQ
- CTA
- Contact section

## Dependencies

- react
- react-router-dom
- lucide-react
- Tailwind CSS

## Add public route

In your existing AppRouter.jsx, add:

import LandingPage from "../features/landing/pages/LandingPage";

Register the route before the protected application route:

<Route path="/" element={<LandingPage />} />

Remove the old root redirect to /dashboard after adding
the public landing route.

Keep /dashboard protected.

## SEO

Title:
Amrit Jal – Water Delivery Business Management Software

Description:
Manage water jar deliveries, customers, inventory, payments,
invoices and business operations with Amrit Jal.

Robots:
index, follow

Add your actual production domain as canonical URL.
Do not use a placeholder domain.

## Before publishing

1. Replace contact placeholders with official contact details.
2. Replace illustrative dashboard preview with real screenshots.
3. Add actual Privacy Policy and Terms links.
4. Confirm signup access policy.
5. Run npm run build.
6. Test landing page, login, signup and dashboard routes.

No Supabase schema or business logic is modified by these files.