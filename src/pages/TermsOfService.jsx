import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function TermsOfService() {
  usePageTitle('Terms of Service');
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-text">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-8 text-text-muted"><strong>Last Updated:</strong> August 24, 2026</p>
      
      <div className="space-y-6 text-text-secondary leading-relaxed">
        <p>These Terms of Service ("Terms") govern your access to and use of Openlysts ("Openlysts," "we," "us," or "our").</p>
        <p>By accessing or using Openlysts, you agree to these Terms. If you do not agree with these Terms, please do not use the service.</p>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">1. About Openlysts</h2>
          <p className="mb-2">Openlysts is a discovery platform designed to help users discover and explore publicly available open-source software, repositories, developer tools, and related resources.</p>
          <p className="mb-2">Openlysts may organize, categorize, rank, index, or present information about publicly available projects.</p>
          <p>Openlysts is not the owner, developer, maintainer, or operator of every project displayed on the platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">2. Eligibility</h2>
          <p className="mb-2">You must be at least 18 years of age to use Openlysts and create an account, in compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act).</p>
          <p className="mb-2">You may use Openlysts provided that you are legally permitted to do so under the laws applicable to you.</p>
          <p>If you use Openlysts on behalf of an organization, you represent that you have authority to accept these Terms on its behalf.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">3. Acceptable Use</h2>
          <p className="mb-2">You agree to use Openlysts lawfully and responsibly.</p>
          <p className="mb-2">You must not use Openlysts to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Violate applicable laws or regulations.</li>
            <li>Interfere with or disrupt the operation of Openlysts.</li>
            <li>Attempt to gain unauthorized access to Openlysts or its infrastructure.</li>
            <li>Circumvent security controls or access restrictions.</li>
            <li>Introduce malicious code, malware, or other harmful material.</li>
            <li>Conduct attacks against Openlysts or third-party systems.</li>
            <li>Abuse automated access mechanisms in a manner that harms the service.</li>
            <li>Misrepresent your identity or affiliation.</li>
            <li>Use Openlysts in a way that infringes another person's rights.</li>
          </ul>
          <p>Nothing in these Terms grants you permission to access or interfere with systems belonging to third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">4. Open-Source Projects and Third-Party Content</h2>
          <p className="mb-2">Openlysts may display information about projects hosted on third-party platforms.</p>
          <p className="mb-2">The presence of a project on Openlysts does not mean that Openlysts endorses, guarantees, sponsors, maintains, or is affiliated with that project.</p>
          <p className="mb-2">Open-source projects remain subject to their respective licenses and the terms established by their authors, maintainers, or hosting platforms.</p>
          <p>You are responsible for reviewing and complying with the applicable license before using, modifying, distributing, or incorporating third-party software.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">5. Accuracy of Information</h2>
          <p className="mb-2">Openlysts attempts to provide useful and accurate information about the projects it displays.</p>
          <p className="mb-2">However, project information may change, become outdated, be incomplete, or contain errors.</p>
          <p className="mb-2">Openlysts does not guarantee that:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Repository information is always current.</li>
            <li>Project descriptions are complete or accurate.</li>
            <li>Projects remain available.</li>
            <li>Projects are secure.</li>
            <li>Projects are maintained.</li>
            <li>Projects are free of vulnerabilities or malicious code.</li>
            <li>Project licenses are accurately represented at all times.</li>
            <li>A project will meet your particular requirements.</li>
          </ul>
          <p>You should independently evaluate any software before downloading, installing, executing, or relying upon it.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">6. No Warranty</h2>
          <p className="mb-2">Openlysts is provided on an <strong>"as is" and "as available"</strong> basis to the maximum extent permitted by applicable law.</p>
          <p className="mb-2">To the maximum extent permitted by law, Openlysts makes no warranties, express or implied, regarding the service, including warranties of:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Merchantability;</li>
            <li>Fitness for a particular purpose;</li>
            <li>Availability;</li>
            <li>Accuracy;</li>
            <li>Reliability;</li>
            <li>Security;</li>
            <li>Non-infringement; or</li>
            <li>Uninterrupted operation.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">7. Third-Party Websites and Services</h2>
          <p className="mb-2">Openlysts may contain links to third-party websites and services.</p>
          <p className="mb-2">Those websites operate independently from Openlysts.</p>
          <p className="mb-2">Openlysts does not control and is not responsible for:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Third-party content;</li>
            <li>Third-party privacy practices;</li>
            <li>Third-party terms;</li>
            <li>Third-party availability;</li>
            <li>Third-party security;</li>
            <li>Third-party software;</li>
            <li>Transactions conducted with third parties.</li>
          </ul>
          <p>Your use of third-party websites is governed by their respective terms and policies.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">8. Limitation of Liability</h2>
          <p className="mb-2">To the maximum extent permitted by applicable law, in no event will Openlysts, its affiliates, developers, or maintainers be liable for any:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Indirect damages;</li>
            <li>Consequential damages;</li>
            <li>Incidental damages;</li>
            <li>Special damages;</li>
            <li>Punitive damages;</li>
            <li>Loss of profits;</li>
            <li>Loss of revenue;</li>
            <li>Loss of data;</li>
            <li>Loss of use;</li>
            <li>Loss of goodwill; or</li>
            <li>Business interruption</li>
          </ul>
          <p>arising out of or in connection with these Terms or the use of Openlysts, regardless of the theory of liability.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">9. Intellectual Property</h2>
          <p className="mb-2">The Openlysts website, including its original branding, interface, design, code, text, graphics, and other original materials, may be protected by applicable intellectual-property laws.</p>
          <p className="mb-2">Unless otherwise stated, you may not reproduce, redistribute, modify, publicly display, or commercially exploit Openlysts's proprietary materials without appropriate authorization.</p>
          <p>Third-party repository names, trademarks, logos, software, and other materials remain the property of their respective owners and are subject to their applicable licenses and rights.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">10. Privacy and Data Protection (DPDP Act 2023)</h2>
          <p className="mb-2">Your use of Openlysts is also governed by our Privacy Policy, which is incorporated into these Terms by reference.</p>
          <p className="mb-2">Openlysts strictly complies with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> of India. By creating an account, you provide explicit, free, specific, and informed consent to the processing of your personal data as a Data Principal.</p>
          <p className="mb-2">You have the right to withdraw your consent, access your data, and request the erasure of your personal data at any time through your account settings or by contacting our Data Protection Officer.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">11. Availability and Changes</h2>
          <p className="mb-2">We may modify, suspend, discontinue, or restrict access to any part of Openlysts at any time.</p>
          <p className="mb-2">We may also modify features, functionality, repository indexing, categories, ranking systems, or other aspects of the service without notice.</p>
          <p>We are not obligated to maintain any particular feature indefinitely.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">10. Limitation of Liability</h2>
          <p className="mb-2">To the maximum extent permitted by applicable law, Openlysts and its operators, contributors, and affiliates will not be liable for indirect, incidental, consequential, special, exemplary, or punitive damages arising from or relating to your use of, or inability to use, Openlysts.</p>
          <p className="mb-2">This includes, without limitation, losses relating to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Software downloaded or discovered through Openlysts;</li>
            <li>Data loss;</li>
            <li>Business interruption;</li>
            <li>Security incidents involving third-party services;</li>
            <li>Inaccurate or outdated repository information;</li>
            <li>Third-party websites or services; or</li>
            <li>Reliance on information presented through Openlysts.</li>
          </ul>
          <p>Nothing in these Terms excludes or limits liability where doing so is prohibited by applicable law.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">11. Indemnification</h2>
          <p className="mb-2">To the maximum extent permitted by applicable law, you agree to indemnify and hold harmless Openlysts and its operators, contributors, and affiliates from claims, damages, liabilities, losses, and expenses arising from:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Your misuse of Openlysts;</li>
            <li>Your violation of these Terms;</li>
            <li>Your violation of applicable law; or</li>
            <li>Your violation of the rights of another person or entity.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">12. Privacy</h2>
          <p className="mb-2">Openlysts's privacy practices are described in the Openlysts Privacy Policy.</p>
          <p>Openlysts does not intentionally collect, store, sell, rent, profile, or otherwise use personal information about its users.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">13. Termination</h2>
          <p className="mb-2">We may suspend or terminate access to Openlysts where we reasonably believe that a user has violated these Terms, abused the service, attempted to compromise the service, or created a security or legal risk.</p>
          <p>We may also discontinue Openlysts entirely at any time.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">14. Governing Law</h2>
          <p className="mb-2">These Terms will be governed by and interpreted in accordance with the laws applicable to the jurisdiction in which the Openlysts operator is established, unless applicable law requires otherwise.</p>
          <p>Any disputes will be subject to the jurisdiction of the courts having appropriate legal authority over the matter, subject to applicable law.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">15. Severability</h2>
          <p>If any provision of these Terms is determined to be invalid or unenforceable, the remaining provisions will continue in full force and effect to the extent permitted by law.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">16. Entire Agreement</h2>
          <p>These Terms, together with the Openlysts Privacy Policy and any other policies expressly incorporated into these Terms, constitute the agreement governing your use of Openlysts.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">17. Changes to These Terms</h2>
          <p className="mb-2">We may update these Terms from time to time.</p>
          <p className="mb-2">When we make changes, we will update the "Last Updated" date at the top of this document.</p>
          <p>Your continued use of Openlysts after changes become effective constitutes acceptance of the updated Terms, to the extent permitted by applicable law.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-2 mt-8">18. Contact</h2>
          <p>Questions regarding these Terms may be submitted through the contact method provided on the Openlysts website.</p>
        </section>

        <hr className="my-10 border-border" />
        
        <p className="text-center font-medium italic text-text pb-10">
          Openlysts is built around a simple principle: discover open-source software without requiring users to surrender personal information to us.
        </p>
      </div>
    </div>
  );
}
