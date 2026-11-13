
import { useEffect } from "react";
import { Link } from "react-router-dom";

import LandingNavbar from "../../../components/landing/LandingNavbar";
import LandingFooter from "../../../components/landing/LandingFooter";

const privacySections = [
  {
    title: "1. INTRODUCTION",
    paragraphs: [
      "Welcome to Amrit Jal. We respect your privacy and are committed to handling personal and business information responsibly.",
      "This Privacy Policy explains what information may be collected, how it may be used, stored, shared and protected when you visit our website or use the Amrit Jal business management application.",
      "Amrit Jal provides digital management tools for water jar suppliers, RO water businesses, water distributors and other delivery-based businesses.",
      "By accessing or using our Services, you acknowledge that you have read this Privacy Policy. This policy should be read together with our Terms and Conditions."
    ],
  },
  {
    title: "2. INFORMATION WE COLLECT",
    subsections: [
      {
        title: "(A) Personal Information",
        paragraphs: [
          "When you register for or use Amrit Jal, we may collect personal information such as your name, mobile number, email address and other contact details.",
          "We may also collect information that you voluntarily provide when contacting our support team, requesting a demo or communicating with us."
        ],
      },
      {
        title: "(B) Business Information",
        paragraphs: [
          "To provide business management services, the application may collect business-related information such as business name, address, contact details and operational information.",
          "This information helps organise your business account and provide relevant application functionality."
        ],
      },
      {
        title: "(C) Customer and Employee Information",
        paragraphs: [
          "Business users may enter information about their customers and employees, including names, mobile numbers, addresses, delivery details, employment information and related business records.",
          "The business owner or authorised user is responsible for ensuring that they have the necessary lawful basis or permission to collect and enter such information."
        ],
      },
      {
        title: "(D) Transaction and Financial Information",
        paragraphs: [
          "The application may store business records relating to deliveries, jar quantities, payments, outstanding balances, invoices, expenses, salary entries and other transactions entered by users.",
          "Such records are used to support the business management and reporting features of the application.",
          "Where third-party payment services are used, payment information may also be processed by the relevant service provider under its own terms and privacy policy."
        ],
      },
      {
        title: "(E) Technical Information",
        paragraphs: [
          "When you access our website or application, certain technical information may be processed, such as browser type, device information, IP address, access timestamps and application usage information, depending on the technologies and services in use.",
          "This information may help us maintain application performance, troubleshoot technical issues and protect our Services."
        ],
      },
    ],
  },
  {
    title: "3. HOW WE USE YOUR INFORMATION",
    paragraphs: [
      "We may use the information collected through Amrit Jal for the following purposes:"
    ],
    bullets: [
      "To create, manage and authenticate user and business accounts.",
      "To provide customer management and delivery tracking functionality.",
      "To maintain jar management and inventory-related records.",
      "To record and organise payments, invoices and outstanding balances.",
      "To support employee management and business operations.",
      "To generate reports, summaries and operational insights.",
      "To respond to customer enquiries and support requests.",
      "To communicate important service updates and account-related notifications.",
      "To identify technical issues, prevent misuse and improve application security.",
      "To comply with applicable legal and regulatory requirements."
    ],
  },
  {
    title: "4. CUSTOMER AND BUSINESS DATA",
    subsections: [
      {
        title: "(A) Business User Responsibility",
        paragraphs: [
          "Business owners and authorised users are responsible for the information they enter into Amrit Jal.",
          "You should ensure that customer and employee information is collected and processed lawfully and that appropriate permissions or notices are provided where required."
        ],
      },
      {
        title: "(B) Customer Records",
        paragraphs: [
          "Customer information entered into the application may be used to maintain delivery histories, payment records, invoices, outstanding balances and other business-related information.",
          "Business users are responsible for ensuring that this information is accurate and updated when necessary."
        ],
      },
      {
        title: "(C) Employee Records",
        paragraphs: [
          "Employee information entered by business owners may be used to manage staff details, salary records, advances, work-related transactions and other employee management activities.",
          "Business owners are responsible for ensuring that employee information is handled in accordance with applicable law."
        ],
      },
    ],
  },
  {
    title: "5. DATA STORAGE AND PROCESSING",
    subsections: [
      {
        title: "(A) Electronic Storage",
        paragraphs: [
          "Information submitted through the application may be stored and processed using electronic databases and infrastructure services.",
          "Amrit Jal may use third-party technology providers for hosting, database management, application infrastructure and related technical services."
        ],
      },
      {
        title: "(B) Data Processing",
        paragraphs: [
          "Information may be processed to operate application features, maintain account records, provide requested services, troubleshoot issues and support platform security.",
          "Access to business information should be limited according to applicable account permissions and technical controls."
        ],
      },
      {
        title: "(C) Data Location",
        paragraphs: [
          "Information may be processed or stored in locations determined by the infrastructure and service providers used to operate the application.",
          "Applicable legal requirements relating to data processing and cross-border transfers will be followed."
        ],
      },
    ],
  },
  {
    title: "6. SHARING AND DISCLOSURE OF INFORMATION",
    subsections: [
      {
        title: "(A) Technology and Service Providers",
        paragraphs: [
          "We may use third-party providers for hosting, database services, payment processing, communication, security and other operational requirements.",
          "Such providers may process information on our behalf to the extent necessary to provide their services and subject to applicable arrangements."
        ],
      },
      {
        title: "(B) Legal Requirements",
        paragraphs: [
          "We may disclose information where required by applicable law, a valid legal process, a court order or a lawful request from an authorised government authority."
        ],
      },
      {
        title: "(C) Business Protection",
        paragraphs: [
          "Information may be processed or disclosed where reasonably necessary to investigate suspected fraud, protect the security of the platform, enforce our terms or protect the rights and safety of users and others, subject to applicable law."
        ],
      },
      {
        title: "(D) No Unauthorised Sale of Business Records",
        paragraphs: [
          "We do not intend to sell users' customer lists, employee records or confidential business transaction records as a standalone commercial product.",
          "Any permitted sharing or processing remains subject to this Privacy Policy and applicable legal requirements."
        ],
      },
    ],
  },
  {
    title: "7. COOKIES AND SIMILAR TECHNOLOGIES",
    paragraphs: [
      "Our website or application may use cookies, local storage or similar technologies where necessary for functionality, security, preferences or performance.",
      "These technologies may help maintain login sessions, remember certain preferences and improve the user experience.",
      "You can manage or restrict cookies through your browser settings. However, disabling certain technologies may affect the functionality of some features.",
      "The specific cookies and tracking technologies used by the live application should be confirmed before this policy is published."
    ],
  },
  {
    title: "8. DATA SECURITY",
    paragraphs: [
      "We take reasonable technical and organisational measures intended to protect information against unauthorised access, alteration, disclosure, loss or misuse.",
      "Security measures may include access restrictions, authentication mechanisms, infrastructure safeguards and other controls appropriate to the Services.",
      "However, no internet transmission, electronic storage system or software platform can be guaranteed to be completely secure.",
      "Users are responsible for maintaining strong passwords, protecting login credentials, using trusted devices and restricting access to authorised individuals.",
      "If you suspect unauthorised access to your account, you should contact the Amrit Jal team promptly."
    ],
  },
  {
    title: "9. DATA RETENTION AND DELETION",
    subsections: [
      {
        title: "(A) Data Retention",
        paragraphs: [
          "Information may be retained for as long as necessary to provide the Services, maintain business records, fulfil contractual obligations, resolve disputes and meet applicable legal requirements.",
          "The actual retention period may vary depending on the type of information and the purpose for which it is processed."
        ],
      },
      {
        title: "(B) Account Closure",
        paragraphs: [
          "If you request account closure, we may process the request after verifying your identity and account ownership.",
          "Closing an account does not necessarily mean that all information will be immediately deleted. Certain records may need to be retained for legal, security, accounting or operational purposes."
        ],
      },
      {
        title: "(C) Deletion Requests",
        paragraphs: [
          "You may contact us to request deletion of personal information associated with your account, subject to applicable law and legitimate retention requirements.",
          "We will review such requests and respond in accordance with applicable legal obligations."
        ],
      },
    ],
  },
  {
    title: "10. YOUR PRIVACY RIGHTS",
    paragraphs: [
      "Subject to applicable law, you may have rights relating to your personal information, including:"
    ],
    bullets: [
      "Request information about personal data associated with your account.",
      "Request correction of inaccurate or incomplete personal information.",
      "Request deletion of eligible personal information.",
      "Withdraw consent where processing is based on consent.",
      "Raise concerns about the handling of your information.",
      "Request assistance regarding account-related privacy matters."
    ],
    extra: [
      "We may need to verify your identity before processing a request.",
      "Some requests may be limited where information must be retained to comply with legal obligations, resolve disputes or protect legitimate interests."
    ],
  },
  {
    title: "11. THIRD-PARTY LINKS AND SERVICES",
    paragraphs: [
      "Our website or application may contain links to third-party websites, platforms or services.",
      "These external services operate independently and may have their own privacy policies, security practices and terms of use.",
      "We are not responsible for the privacy practices or content of third-party websites that are not operated by Amrit Jal.",
      "We recommend reviewing the relevant privacy policy before providing personal information to any external service."
    ],
  },
  {
    title: "12. CHILDREN'S PRIVACY",
    paragraphs: [
      "Amrit Jal is designed for business management and is not intended to be directed towards children.",
      "We do not knowingly seek to collect personal information directly from children in connection with independent account registration.",
      "If you believe that a child's personal information has been submitted to the platform without appropriate authorisation, please contact us so that the matter can be reviewed."
    ],
  },
  {
    title: "13. COMMUNICATIONS AND NOTIFICATIONS",
    paragraphs: [
      "We may use your registered contact details to send service-related communications, account notifications, security alerts and support responses.",
      "Where promotional communications are introduced, they will be handled in accordance with applicable law and any required consent or preference mechanisms.",
      "You should keep your registered mobile number and email address updated so that important account communications can reach you."
    ],
  },
  {
    title: "14. CHANGES TO THIS PRIVACY POLICY",
    paragraphs: [
      "We may update this Privacy Policy when our Services, technology, data practices or applicable legal requirements change.",
      "The revised version will be published on this page with an updated effective date.",
      "We encourage users to review this page periodically to understand how their information is handled.",
      "Where required by applicable law, we will provide additional notice or obtain consent for material changes."
    ],
  },
  {
    title: "15. CONTACT AND PRIVACY REQUESTS",
    paragraphs: [
      "If you have questions about this Privacy Policy, wish to request access or correction of information, or have concerns about data handling, please contact the Amrit Jal team through the official contact details published on our website.",
      "Please provide sufficient information about your request so that we can identify the relevant account and review the matter.",
      "We may request reasonable verification before disclosing or modifying personal information."
    ],
  },
];

function PrivacySection({ section }) {
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

      {section.bullets && (
        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-[#405168] sm:text-[15px]">
          {section.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      {section.extra && (
        <div className="mt-4 space-y-3">
          {section.extra.map((paragraph, index) => (
            <p
              key={index}
              className="text-sm leading-7 text-[#405168] sm:text-[15px]"
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = "Privacy Policy | Amrit Jal";

    const description =
      "Read the Amrit Jal Privacy Policy covering personal information, business data, customer records, data security, storage, retention and privacy rights.";

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

            {/* PAGE HEADER */}
            <div className="border-b border-[#E5E9ED] pb-7">
              <div className="mb-4 flex items-center gap-2 text-xs text-[#64748B]">
                <Link to="/" className="hover:text-[#087E85]">
                  Home
                </Link>
                <span>/</span>
                <span className="text-[#101F35]">
                  Privacy Policy
                </span>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#087E85]">
                Legal Information
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173451] sm:text-4xl">
                Privacy Policy
              </h1>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-[#405168] sm:text-[15px]">
                This Privacy Policy explains how Amrit Jal collects,
                uses, stores, processes and protects information when
                you visit our website or use our business management
                application. Please read this document carefully
                to understand our information handling practices.
              </p>

              <p className="mt-4 text-xs text-[#8291A2]">
                Effective date: To be confirmed before publication
              </p>
            </div>

            {/* INTRODUCTION */}
            <div className="py-8">
              <p className="text-sm leading-7 text-[#405168] sm:text-[15px]">
                We recognise that personal information and business
                records are important. This policy describes the
                categories of information that may be processed
                through Amrit Jal and the responsibilities of both
                the platform and its users.
              </p>
            </div>

            {/* POLICY CONTENT */}
            <div className="space-y-8">
              {privacySections.map((section) => (
                <PrivacySection
                  key={section.title}
                  section={section}
                />
              ))}
            </div>

            {/* TERMS LINK */}
            <div className="mt-10 rounded-xl border border-[#E2E8E8] bg-[#F7F8F5] p-5">
              <h2 className="text-sm font-bold text-[#173451]">
                Also read our Terms & Conditions
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                Understand the rules and conditions governing
                your use of Amrit Jal.
              </p>

              <Link
                to="/terms"
                className="mt-3 inline-flex text-sm font-bold text-[#087E85] hover:underline"
              >
                Read Terms & Conditions →
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
