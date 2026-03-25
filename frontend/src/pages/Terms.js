import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#fbfaf6] text-[#0f2e24] py-24 px-8 md:px-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-sm font-['Bricolage_Grotesque'] hover:underline mb-12 inline-flex items-center gap-2">&larr; Back to Home</Link>

        <h1 className="font-['Libre_Baskerville'] text-5xl md:text-6xl mb-8 leading-tight">Terms of Service</h1>
        <p className="font-['Bricolage_Grotesque'] italic mb-12 opacity-70">Last Updated: March 2026</p>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">1. Acceptance of Terms</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-6 opacity-85">By registering for an account, accessing, or using the website AlifAmin.com (&ldquo;Platform&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree with any part of these Terms, you must not use our services.</p>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">2. Description of Service</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-6 opacity-85">Alif Amin Academy is an online educational marketplace that connects students seeking to learn the Quran (&ldquo;Students&rdquo;) with independent, qualified Quran educators (&ldquo;Tutors&rdquo;). The Platform provides directory services, scheduling tools, secure video communication interfaces, and payment processing.</p>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">3. User Accounts and Eligibility</h2>
        <ul className="space-y-3 mb-6 ml-4">
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Age Requirement:</strong> You must be at least 18 years old to create an account. Parents or legal guardians may create accounts on behalf of minors and are strictly responsible for monitoring their child&rsquo;s use of the Platform.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Account Accuracy:</strong> You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Security:</strong> You are responsible for safeguarding your password. Alif Amin Academy cannot and will not be liable for any loss or damage arising from your failure to protect your login credentials.</li>
        </ul>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">4. Roles and Responsibilities</h2>
        <ul className="space-y-3 mb-6 ml-4">
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>For Tutors:</strong> Tutors act as independent contractors, not employees of Alif Amin Academy. Tutors are responsible for maintaining a reliable internet connection, preparing appropriate lesson materials, and conducting themselves with the utmost professionalism. Tutors must pass our internal verification and background check processes before their profiles are made active.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>For Students/Parents:</strong> Students are expected to attend scheduled sessions on time. Parents of minor students are encouraged to be present or nearby during initial sessions to ensure a comfortable learning environment.</li>
        </ul>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">5. Islamic Code of Conduct (Adab)</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-4 opacity-85">Because we are a platform dedicated to the sacred learning of the Quran, all users are expected to uphold high moral and ethical standards (Adab).</p>
        <ul className="space-y-3 mb-6 ml-4">
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Dress Code &amp; Environment:</strong> Both Tutors and Students must be dressed modestly and appropriately during video sessions. The background environment should be quiet, clean, and free of inappropriate imagery.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Behavior:</strong> Harassment, bullying, discriminatory language, or any inappropriate conduct will not be tolerated and will result in immediate, permanent account termination without refund.</li>
        </ul>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">6. Payments, Subscriptions, and Fees</h2>
        <ul className="space-y-3 mb-6 ml-4">
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Student Payments:</strong> All payments for classes or subscriptions must be made securely through the Platform. Taking transactions off-platform violates these Terms and may result in account suspension.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Tutor Payouts:</strong> Alif Amin Academy collects funds from Students and disburses earnings to Tutors on a set schedule, minus a clearly communicated platform commission fee used to maintain the software and marketing.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Taxes:</strong> Tutors are solely responsible for reporting and paying any applicable income taxes on their earnings in their respective jurisdictions.</li>
        </ul>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">7. Cancellations, Rescheduling, and Refunds</h2>
        <ul className="space-y-3 mb-6 ml-4">
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Cancellation Policy:</strong> Sessions must be canceled or rescheduled at least 24 hours prior to the scheduled start time.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Student No-Shows:</strong> If a student fails to attend a scheduled class without 24 hours&rsquo; notice, the tutor will still be compensated, and the student will be charged for the session.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Tutor No-Shows:</strong> If a tutor fails to attend a session, the student will be fully refunded or provided a makeup credit, and the tutor&rsquo;s standing on the platform may be penalized.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Refunds:</strong> Refund requests for unused credits or unresolved disputes must be submitted via the platform or to hello.alifamin@gmail.com within 7 days of the incident. We reserve the right to review and resolve disputes on a case-by-case basis.</li>
        </ul>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">8. Intellectual Property</h2>
        <ul className="space-y-3 mb-6 ml-4">
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Platform Content:</strong> All text, graphics, logos, software, and underlying code on AlifAmin.com are the intellectual property of Alif Amin Academy. You may not copy, modify, or distribute our proprietary content without written permission.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>User Content:</strong> By posting reviews, feedback, or public profile information, you grant Alif Amin Academy a non-exclusive, royalty-free license to use, display, and reproduce that content for promotional purposes.</li>
        </ul>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">9. Disclaimers and Limitation of Liability</h2>
        <ul className="space-y-3 mb-6 ml-4">
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>&ldquo;As Is&rdquo; Basis:</strong> The Platform is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. We do not warrant that the service will be uninterrupted or error-free.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Tutor Disclaimer:</strong> While we rigorously vet our Tutors, Alif Amin Academy is not legally responsible for the actions, statements, or teaching methods of independent Tutors.</li>
          <li className="font-['Bricolage_Grotesque'] text-lg leading-relaxed opacity-85"><strong>Liability Cap:</strong> To the maximum extent permitted by applicable law, Alif Amin Academy&rsquo;s total liability for any claims arising out of these Terms shall not exceed the total amount paid by the user to the Platform in the three (3) months preceding the claim.</li>
        </ul>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">10. Account Suspension and Termination</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-6 opacity-85">We reserve the right to suspend or terminate your account at our sole discretion, without prior notice, if you breach any of these Terms, engage in fraudulent activity, or behave in a manner that harms the reputation of the Platform or the safety of other users.</p>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">11. Governing Law</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-6 opacity-85">These Terms shall be governed and construed in accordance with the laws of Malaysia, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts located in Malaysia.</p>

        <h2 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl font-bold mt-12 mb-6">12. Changes to Terms</h2>
        <p className="font-['Bricolage_Grotesque'] text-lg leading-relaxed mb-6 opacity-85">We reserve the right to modify or replace these Terms at any time. We will provide notice of significant changes via email or platform notification. Continued use of the Platform following such changes constitutes your acceptance of the new Terms.</p>
      </div>
    </div>
  );
}
