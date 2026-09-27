import { useState } from "react";
import type { FormEvent } from "react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // In production, wire this to a backend endpoint or email service
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="static-page">
        <h1 className="page-heading">Contact</h1>
        <p>
          Thank you for your message. We will respond within 2 business
          days.
        </p>
      </div>
    );
  }

  return (
    <div className="static-page">
      <div className="static-doc-header">
        <div className="doc-meta"><strong>DOCUMENT ID</strong> DT-CNT-001</div>
        <div className="doc-meta"><strong>SUBJECT</strong> CONTACT US</div>
        <div className="doc-meta"><strong>STATUS</strong> ACCEPTING INQUIRIES</div>
      </div>

      <div className="static-doc-content">
        <p>
          Have a question, content removal request, or general inquiry? Send
          us a message below or email{" "}
          <a href="mailto:hello@gofact.in">hello@gofact.in</a>.
        </p>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              type="text"
              name="name"
              required
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              type="email"
              name="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="contact-message">Message</label>
            <textarea id="contact-message" name="message" required></textarea>
          </div>
          <button type="submit" className="form-submit">
            TRANSMIT MESSAGE
          </button>
        </form>
      </div>
    </div>
  );
}
