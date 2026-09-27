export default function PrivacyPolicy() {
  return (
    <div className="static-page">
      <div className="static-doc-header">
        <div className="doc-meta"><strong>DOCUMENT ID</strong> DT-POL-001</div>
        <div className="doc-meta"><strong>SUBJECT</strong> PRIVACY POLICY</div>
        <div className="doc-meta"><strong>LAST UPDATED</strong> SEP 2026</div>
      </div>

      <div className="static-doc-content">
        <h2>Information We Collect</h2>
        <p>
          GoFact collects minimal data to operate this service. We do not
          require user accounts, and we do not collect personally identifiable
          information unless you voluntarily provide it through our contact
          form.
        </p>

        <h2>Cookies and Tracking Technologies</h2>
        <p>
          This site may use cookies and similar technologies for the following
          purposes:
        </p>
        <ul>
          <li>
            Analytics cookies to understand aggregate usage patterns (e.g.,
            page views, traffic sources). These help us improve the service.
          </li>
          <li>
            Advertising cookies placed by Google AdSense to serve relevant
            advertisements. Google may use information about your visits to
            this and other websites to provide targeted ads. You can opt out of
            personalized advertising by visiting{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Ads Settings
            </a>
            .
          </li>
        </ul>

        <h2>Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul>
          <li>
            Google AdSense for advertising (subject to{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google's Privacy Policy
            </a>
            )
          </li>
          <li>Neon for database hosting</li>
          <li>AI summarization APIs (Grok, Gemini, Groq) for content processing</li>
        </ul>

        <h2>Data Retention</h2>
        <p>
          Article summaries and metadata are retained indefinitely as part of
          the public news archive. Contact form submissions are retained for
          up to 12 months.
        </p>

        <h2>Your Rights</h2>
        <p>
          You may request deletion of any personal data you have submitted by
          contacting us. Since we do not require registration, most users have
          no personal data stored on our systems.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Changes will be posted
          on this page with an updated revision date.
        </p>

        <h2>Contact</h2>
        <p>
          For privacy-related inquiries, please use the{" "}
          <a href="/contact">contact page</a>.
        </p>
      </div>
    </div>
  );
}
