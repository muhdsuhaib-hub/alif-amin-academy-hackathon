import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#fbfaf6] text-[#0f2e24] py-24 px-8 md:px-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-sm font-['Bricolage_Grotesque'] hover:underline mb-12 inline-flex items-center gap-2">&larr; Back to Home</Link>

        <h1 className="font-['Libre_Baskerville'] text-5xl md:text-6xl mb-8 leading-tight">Privacy Policy</h1>
        <p className="font-['Bricolage_Grotesque'] italic mb-12 opacity-70">Last Updated: March 2026</p>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">1. Introduction</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-6 opacity-85">Welcome to AlifAmin.com (&ldquo;Alif Amin Academy&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). We are committed to protecting your personal data and respecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our platform, or engage with our online Quran tutoring services. This policy complies with applicable data protection frameworks, including the Personal Data Protection Act (PDPA).</p>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">2. Information We Collect</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-4 opacity-85">We collect information that identifies, relates to, or could reasonably be linked to you. This includes:</p>
        <ul className="space-y-3 mb-6 ml-4">
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Account &amp; Profile Data:</strong> Full name, email address, phone number, timezone, password, and profile picture.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Onboarding &amp; Educational Data:</strong> User role (Student, Parent, or Tutor), current reading level, learning goals, schedule preferences, and progress tracking data.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Tutor Verification Data:</strong> For teachers, we collect identity verification documents, educational qualifications, Ijaza (if applicable), and background check information.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Financial Data:</strong> Payment processing details. (Note: We use secure third-party payment processors like Billplz. We do not store full credit card numbers on our servers; however, we do store payout banking details for tutors).</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Communications &amp; Session Data:</strong> Chat messages within the platform, customer support inquiries, and potentially video/audio session logs or recordings (solely for quality assurance and safety, with explicit prior notice).</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Technical &amp; Usage Data:</strong> IP addresses, browser types, device information, operating systems, and data on how you navigate and interact with our platform (collected via cookies and analytics tools).</li>
        </ul>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">3. How We Use Your Information</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-4 opacity-85">We use the collected data for the following purposes:</p>
        <ul className="space-y-3 mb-6 ml-4">
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Service Delivery:</strong> To create your account, match students with appropriate tutors, schedule sessions, and facilitate live video classes.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Financial Processing:</strong> To process subscription payments, handle refunds, and disburse earnings to tutors.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Platform Improvement:</strong> To analyze user behavior, troubleshoot technical issues, and improve our website&rsquo;s functionality and user experience.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Safety &amp; Security:</strong> To verify the identity and qualifications of tutors, monitor for fraudulent activity, and enforce our Terms of Service to ensure a safe learning environment.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Communication:</strong> To send you administrative emails (e.g., booking confirmations, password resets) and, with your consent, marketing or promotional materials.</li>
        </ul>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">4. How We Share Your Information</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-4 opacity-85">We do not sell, rent, or trade your personal information. We only share your data in the following circumstances:</p>
        <ul className="space-y-3 mb-6 ml-4">
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Between Users:</strong> Students/Parents and Tutors will see each other&rsquo;s necessary profile information (names, learning goals, scheduling availability) to facilitate the educational process. Contact details are kept private and routed through the platform.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Service Providers:</strong> We share data with trusted third-party vendors who assist us in operating our platform, such as payment gateways, video conferencing API providers, cloud hosting services (e.g., Google Cloud), and email delivery services.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Legal &amp; Compliance:</strong> We may disclose your information if required by law, subpoena, or other legal processes, or to protect the rights, property, and safety of Alif Amin Academy, our users, or the public.</li>
        </ul>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">5. Cookies and Tracking Technologies</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-6 opacity-85">We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept essential cookies, you may not be able to use some portions of our service (e.g., staying logged in).</p>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">6. Children&rsquo;s Privacy</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-6 opacity-85">Our services are designed for learners of all ages. However, users under the age of 18 must have an account created and managed by a parent or legal guardian. We do not knowingly collect personal information directly from children under 18 without verifiable parental consent. Parents have the right to review, edit, or request the deletion of their child&rsquo;s personal data at any time.</p>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">7. Data Security and Retention</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-6 opacity-85">We implement robust, industry-standard security measures (including SSL encryption and secure server hosting) to protect your data from unauthorized access, alteration, or destruction. We retain your personal information only for as long as is necessary for the purposes set out in this policy, or as required by legal, accounting, or regulatory obligations.</p>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">8. Your Data Rights</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-4 opacity-85">Depending on your jurisdiction, you have the right to:</p>
        <ul className="space-y-2 mb-6 ml-4">
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85">Access the personal data we hold about you.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85">Request corrections to inaccurate or incomplete data.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85">Request the deletion of your account and personal data.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85">Withdraw consent for marketing communications.</li>
        </ul>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-6 opacity-85">To exercise these rights, please contact us using the details below.</p>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">9. Contact Us</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-2 opacity-85">If you have any questions or concerns about this Privacy Policy, please contact our Data Protection Officer at:</p>
        <p className="font-['Bricolage_Grotesque'] text-lg font-semibold">Email: hello.alifamin@gmail.com</p>
      </div>
    </div>
  );
}
