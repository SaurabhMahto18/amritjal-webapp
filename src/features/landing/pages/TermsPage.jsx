
import { useEffect } from "react";
import { Link } from "react-router-dom";

import LandingNavbar from "../../../components/landing/LandingNavbar";
import LandingFooter from "../../../components/landing/LandingFooter";

const termsSections = [
  {
    title: "1. INTRODUCTION AND ACCEPTANCE OF TERMS",
    paragraphs: [
      "Welcome to Amrit Jal. These Terms and Conditions govern your access to and use of the Amrit Jal website, web application, software, tools and related services (collectively referred to as the \"Services\").",
      "Amrit Jal is a business management platform designed to help water jar suppliers, RO water businesses, water distributors and delivery-based businesses manage their daily operations.",
      "By accessing, registering for or using any part of the Services, you acknowledge that you have read, understood and agreed to these Terms and Conditions. If you do not agree with these terms, you should discontinue using the Services.",
      "These Terms apply to all visitors, registered users, business owners, employees and other individuals accessing the platform."
    ],
  },
  {
    title: "2. DEFINITIONS",
    paragraphs: [
      "\"Amrit Jal\", \"we\", \"our\" or \"us\" refers to the provider of the Amrit Jal application and its related services.",
      "\"User\" refers to any person who visits, registers for or uses the website or application.",
      "\"Business Owner\" refers to the individual or organisation that creates and manages a business account on Amrit Jal.",
      "\"Customer\" refers to an individual or organisation whose details are entered into the application by a registered business.",
      "\"Account\" refers to a registered user or business profile created to access the Services.",
      "\"Business Data\" refers to information entered or generated through the platform, including customer details, deliveries, payments, invoices, expenses, employee records and reports.",
      "\"Subscription\" refers to any paid or free access arrangement offered for using the Services."
    ],
  },
  {
    title: "3. ELIGIBILITY AND ACCOUNT REGISTRATION",
    subsections: [
      {
        title: "(A) Eligibility",
        paragraphs: [
          "You must have the legal capacity to enter into an agreement under applicable law to create and operate an account.",
          "If you register on behalf of a business or organisation, you confirm that you are authorised to represent that business."
        ],
      },
      {
        title: "(B) Registration Information",
        paragraphs: [
          "You agree to provide accurate, complete and current information during registration.",
          "You are responsible for updating your information whenever your contact details, business details or other account information changes."
        ],
      },
      {
        title: "(C) Account Credentials",
        paragraphs: [
          "You are responsible for maintaining the confidentiality of your login credentials, passwords and authentication information.",
          "You must not share your account credentials with unauthorised individuals. You should notify us if you suspect unauthorised access or suspicious activity.",
          "Activities performed through your account may be treated as activities authorised by you, subject to applicable law."
        ],
      },
    ],
  },
  {
    title: "4. USE OF THE APPLICATION AND SERVICES",
    subsections: [
      {
        title: "(A) Permitted Use",
        paragraphs: [
          "You may use Amrit Jal to manage legitimate business activities, including customer records, water jar deliveries, jar operations, employee information, payments, invoices, expenses and business reports.",
          "You may use the features available under your account and applicable subscription or access plan."
        ],
      },
      {
        title: "(B) Prohibited Activities",
        paragraphs: [
          "You must not use the application for unlawful, fraudulent, misleading or unauthorised purposes.",
          "You must not attempt to access another user's account, business data, systems or restricted areas without permission.",
          "You must not interfere with the operation, availability, security or performance of the Services.",
          "You must not upload malicious code, attempt to exploit vulnerabilities, reverse engineer restricted software components or conduct unauthorised security testing.",
          "You must not use the platform to distribute spam, harmful content or information that violates applicable laws."
        ],
      },
    ],
  },
  {
    title: "5. CUSTOMER AND BUSINESS DATA",
    subsections: [
      {
        title: "(A) Accuracy of Information",
        paragraphs: [
          "You are responsible for ensuring that customer details, mobile numbers, delivery quantities, payment entries, invoices, employee records and other business information entered into the application are accurate.",
          "Amrit Jal does not independently verify every business record entered by users."
        ],
      },
      {
        title: "(B) Customer Information",
        paragraphs: [
          "You must have an appropriate lawful basis or permission to collect and use customer information entered into your account.",
          "You are responsible for communicating relevant information to your customers and complying with applicable data protection requirements."
        ],
      },
      {
        title: "(C) Ownership and Responsibility",
        paragraphs: [
          "You remain responsible for the business information that you enter, upload or maintain through the application.",
          "You must not enter information that you are not authorised to collect, process or manage."
        ],
      },
      {
        title: "(D) Data Backup",
        paragraphs: [
          "You should maintain appropriate independent records and backups of important business information.",
          "You should not rely exclusively on the application as the only record of critical financial, customer or statutory information."
        ],
      },
    ],
  },
  {
    title: "6. SUBSCRIPTION, PRICING AND BILLING",
    subsections: [
      {
        title: "(A) Pricing Plans",
        paragraphs: [
          "Amrit Jal may offer free access, trial plans and paid subscription plans.",
          "The applicable plan, customer limits, included features and subscription charges will be displayed or communicated through the official platform before purchase.",
          "Features and pricing may differ between plans."
        ],
      },
      {
        title: "(B) Subscription Payments",
        paragraphs: [
          "Where a paid subscription is selected, you agree to pay the applicable charges according to the billing cycle and payment conditions communicated at the time of purchase.",
          "Applicable taxes or additional charges, where required, may be charged separately."
        ],
      },
      {
        title: "(C) Renewal and Expiry",
        paragraphs: [
          "Subscription duration, renewal arrangements and expiry conditions will be communicated during the purchase process.",
          "If a subscription expires or payment is not completed, access to certain paid features may be restricted in accordance with the applicable plan conditions."
        ],
      },
      {
        title: "(D) Price Changes",
        paragraphs: [
          "We may revise subscription prices or plan features from time to time.",
          "Any changes affecting existing subscriptions will be communicated as required by applicable law and the relevant subscription terms."
        ],
      },
    ],
  },
  {
    title: "7. PAYMENTS, INVOICES AND FINANCIAL RECORDS",
    paragraphs: [
      "Amrit Jal may provide tools to record customer payments, delivery charges, outstanding balances, invoices, expenses and other financial transactions.",
      "The business owner is responsible for reviewing and verifying all financial entries, calculations, invoice details and payment records.",
      "Recording a payment in the application does not independently confirm that funds have been received by a bank, payment provider or other financial institution.",
      "Any third-party payment gateway or payment service used in connection with the platform may be governed by separate terms and conditions.",
      "The application should not be treated as a substitute for professional accounting, tax, legal or financial advice.",
      "You remain responsible for maintaining statutory books, issuing legally compliant invoices and meeting applicable tax and regulatory obligations."
    ],
  },
  {
    title: "8. EMPLOYEE AND ACCESS MANAGEMENT",
    paragraphs: [
      "Where employee or staff management features are available, business owners are responsible for assigning appropriate access permissions.",
      "You must ensure that employees access only the information and functions necessary for their assigned responsibilities.",
      "You are responsible for reviewing employee activity, salary records, advances and other staff-related entries maintained in your business account.",
      "You must promptly remove or modify access when an employee no longer requires access to the application."
    ],
  },
  {
    title: "9. DATA PRIVACY AND SECURITY",
    paragraphs: [
      "Your use of the Services is also governed by the Amrit Jal Privacy Policy, which explains how information may be collected, used, stored and processed.",
      "We take reasonable measures intended to protect application information and maintain the security of our Services.",
      "However, no website, software platform, database or electronic transmission can be guaranteed to be completely secure.",
      "You are responsible for protecting your account credentials, devices and business access permissions.",
      "You should avoid sharing confidential account information through unsecured communication channels."
    ],
  },
  {
    title: "10. THIRD-PARTY SERVICES AND INTEGRATIONS",
    paragraphs: [
      "Certain features may depend on third-party services, including hosting providers, database services, payment gateways, messaging platforms, analytics tools and other external technologies.",
      "Third-party services may have their own terms, privacy policies, availability conditions and technical limitations.",
      "Amrit Jal is not responsible for independent interruptions, failures or changes in third-party services, except to the extent required by applicable law.",
      "Your use of an external service may require you to accept that provider's terms separately."
    ],
  },
  {
    title: "11. INTELLECTUAL PROPERTY AND CONTENT",
    subsections: [
      {
        title: "(A) Platform Ownership",
        paragraphs: [
          "The Amrit Jal name, branding, logos, website design, application interface, software components and original platform content may be protected by applicable intellectual property laws.",
          "You may not copy, reproduce, distribute, modify or commercially exploit protected platform material without appropriate written permission."
        ],
      },
      {
        title: "(B) User Content",
        paragraphs: [
          "You retain responsibility for the business information and content that you submit through the application.",
          "You grant us permission to process such information only as reasonably necessary to operate, maintain, secure and provide the Services, subject to the Privacy Policy and applicable law."
        ],
      },
      {
        title: "(C) Restrictions",
        paragraphs: [
          "You must not claim ownership of Amrit Jal branding or represent the platform as your own software.",
          "Unauthorised use of platform content, logos or intellectual property is prohibited."
        ],
      },
    ],
  },
  {
    title: "12. SERVICE AVAILABILITY AND MAINTENANCE",
    paragraphs: [
      "We aim to provide reliable access to Amrit Jal. However, uninterrupted availability cannot be guaranteed.",
      "The Services may occasionally be unavailable due to maintenance, software updates, infrastructure issues, network failures, security incidents or circumstances outside our reasonable control.",
      "We may update, modify, suspend or discontinue individual features when necessary for maintenance, security, operational or business reasons, subject to applicable law.",
      "We will make reasonable efforts to minimise disruption where practicable."
    ],
  },
  {
    title: "13. DISCLAIMER OF WARRANTIES",
    paragraphs: [
      "The Services are provided subject to their actual features, availability and applicable subscription conditions.",
      "We do not guarantee that the application will meet every individual business requirement, operate without errors or remain continuously available.",
      "Any reports, summaries, calculations or business insights generated by the application should be reviewed by the user before being relied upon.",
      "You remain responsible for decisions made using information available through the application."
    ],
  },
  {
    title: "14. LIMITATION OF LIABILITY",
    paragraphs: [
      "To the extent permitted by applicable law, Amrit Jal shall not be liable for indirect, incidental, special or consequential losses arising from the use of, or inability to use, the Services.",
      "This may include loss of business opportunities, loss of anticipated profits, interruption of operations or loss of data, subject to applicable legal requirements.",
      "Nothing in these Terms excludes or limits liability that cannot legally be excluded or limited under applicable law.",
      "You remain responsible for maintaining appropriate business records, verifying important transactions and taking reasonable precautions to protect your information."
    ],
  },
  {
    title: "15. SUSPENSION AND TERMINATION",
    subsections: [
      {
        title: "(A) User-Initiated Termination",
        paragraphs: [
          "You may stop using Amrit Jal and request account closure by contacting the support team.",
          "Any outstanding payment obligations or other responsibilities accrued before account closure may continue to apply."
        ],
      },
      {
        title: "(B) Suspension by Amrit Jal",
        paragraphs: [
          "We may restrict, suspend or terminate access where there is suspected fraud, unauthorised access, security risk, misuse of the Services or a material violation of these Terms.",
          "Where reasonably possible and legally permitted, we may provide notice or an opportunity to resolve the issue."
        ],
      },
      {
        title: "(C) Information After Termination",
        paragraphs: [
          "The handling, retention and deletion of account information after closure will be subject to the Privacy Policy, applicable legal obligations and operational requirements."
        ],
      },
    ],
  },
  {
    title: "16. CHANGES TO THESE TERMS",
    paragraphs: [
      "We may update these Terms and Conditions to reflect changes in our application, services, business practices or applicable legal requirements.",
      "The revised version will be published on this page with an updated effective date.",
      "You should review this page periodically to remain informed about the applicable terms."
    ],
  },
  {
    title: "17. GOVERNING LAW AND DISPUTES",
    paragraphs: [
      "These Terms and Conditions shall be interpreted in accordance with the laws of India, subject to applicable legal requirements.",
      "Any disputes arising in connection with the Services should first be raised with the Amrit Jal team so that the parties may attempt to resolve them through good-faith communication.",
      "The appropriate jurisdiction and dispute resolution arrangements must be confirmed in the final published version of these Terms."
    ],
  },
  {
    title: "18. CONTACT AND SUPPORT",
    paragraphs: [
      "For questions, concerns or requests relating to these Terms and Conditions, please contact the Amrit Jal team through the official contact details published on our website.",
      "Please include sufficient information about your account or query so that we can understand and respond to your request."
    ],
  },
];

function LegalSection({ section }) {
  return (
    <section className="border-b border-[#E7EAE8] pb-7 last:border-b-0">
      <h2 className="text-base font-bold leading-7 text-[#173451] sm:text-lg">
        {section.title}
      </h2>

      {section.paragraphs && (
        <div className="mt-4 space-y-4">
          {section.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-sm leading-7 text-[#405168] sm:text-[15px]"
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {section.subsections && (
        <div className="mt-5 space-y-6">
          {section.subsections.map((subsection) => (
            <div key={subsection.title}>
              <h3 className="text-sm font-bold text-[#263D55]">
                {subsection.title}
              </h3>

              <div className="mt-3 space-y-3">
                {subsection.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-sm leading-7 text-[#405168] sm:text-[15px]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function TermsPage() {
  useEffect(() => {
    document.title = "Terms & Conditions | Amrit Jal";

    const description =
      "Read the Amrit Jal Terms and Conditions covering account registration, application usage, business data, subscriptions, payments and responsibilities.";

    const setMeta = (name, content) => {
      let element = document.head.querySelector(
        `meta[name="${name}"]`
      );

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("name", name);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("robots", "index, follow");
    setMeta("googlebot", "index, follow");
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#101F35]">
      <LandingNavbar />

      <main>
        <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-14">
          <div className="mx-auto max-w-[1400px]">

            {/* PAGE TITLE */}
            <div className="border-b border-[#E5E9ED] pb-7">
              <div className="mb-4 flex items-center gap-2 text-xs text-[#64748B]">
                <Link to="/" className="hover:text-[#087E85]">
                  Home
                </Link>
                <span>/</span>
                <span className="text-[#101F35]">
                  Terms & Conditions
                </span>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#087E85]">
                Legal Information
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173451] sm:text-4xl">
                Terms & Conditions
              </h1>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-[#405168] sm:text-[15px]">
                These Terms and Conditions describe the rules,
                responsibilities and conditions applicable to your
                access to and use of the Amrit Jal website and
                business management application. Please read them
                carefully before using our Services.
              </p>

              <p className="mt-4 text-xs text-[#8291A2]">
                Effective date: To be confirmed before publication
              </p>
            </div>

            {/* INTRODUCTION */}
            <div className="py-8">
              <p className="text-sm leading-7 text-[#405168] sm:text-[15px]">
                Amrit Jal provides digital tools for managing water
                delivery and related business operations. By using
                our platform, you agree to follow these Terms,
                together with our Privacy Policy and any additional
                conditions communicated for specific services.
              </p>
            </div>

            {/* TERMS CONTENT */}
            <div className="space-y-8">
              {termsSections.map((section) => (
                <LegalSection
                  key={section.title}
                  section={section}
                />
              ))}
            </div>

            {/* PRIVACY LINK */}
            <div className="mt-10 rounded-xl border border-[#E2E8E8] bg-[#F7F8F5] p-5">
              <h2 className="text-sm font-bold text-[#173451]">
                Also read our Privacy Policy
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                Learn how Amrit Jal handles account information
                and business data.
              </p>

              <Link
                to="/privacy-policy"
                className="mt-3 inline-flex text-sm font-bold text-[#087E85] hover:underline"
              >
                Read Privacy Policy →
              </Link>
            </div>

            {/* BACK LINK */}
            <div className="mt-10 border-t border-[#E5E9ED] pt-6">
              <Link
                to="/"
                className="text-sm font-semibold text-[#087E85] hover:underline"
              >
                ← Back to Amrit Jal
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
