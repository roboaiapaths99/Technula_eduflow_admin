import React from 'react';

export default function PublicPrivacyPolicy() {
  return (
    <div style={{
      maxWidth: '860px',
      margin: '0 auto',
      padding: '40px 24px 80px 24px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1e293b',
      lineHeight: '1.7'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '24px',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'inline-block',
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          fontWeight: '700',
          fontSize: '12px',
          padding: '4px 12px',
          borderRadius: '9999px',
          marginBottom: '12px'
        }}>
          OFFICIAL PRIVACY & DATA SAFETY POLICY
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
          Technula EduFlow Privacy Policy
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Last Updated: October 2026 • Valid for Mobile Apps (Android / iOS) and Web Portals
        </p>
      </div>

      {/* Overview */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>1. Overview & Platform Purpose</h2>
        <p>
          <strong>Technula EduFlow</strong> ("we", "our", or "the Platform") is a multi-tenant school operating system and educational management application. It provides real-time academic records, attendance logs, exam report cards, fee receipts, digital gate passes, and school communications between educational institutions, teachers, and enrolled students' parents or legal guardians.
        </p>
      </section>

      {/* Information Collection */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>2. Information We Collect</h2>
        <p>We collect only the minimum information necessary to provide educational and safety services:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>Guardian Profile Information:</strong> Name, mobile phone number, email address, and verified relationship to enrolled students.
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Student Academic Records:</strong> Student name, admission number, roll number, class and section, daily attendance marks, examination results, report cards, homework tasks, and leave applications.
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Device & Notification Tokens:</strong> Firebase Cloud Messaging (FCM) registration tokens to deliver urgent school circulars, attendance notifications, and bus gate passes.
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Financial Transactions:</strong> When paying school tuition fees, all transactions are processed through RBI-approved, PCI-DSS certified third-party payment gateways (such as Razorpay, PayU, or Stripe). <em>Technula EduFlow does NOT store credit/debit card numbers or bank PINs on our servers.</em>
          </li>
        </ul>
      </section>

      {/* What we do not collect */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>3. Information We DO NOT Collect</h2>
        <p>In accordance with Google Play Store User Data policies:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>We do <strong>NOT</strong> track continuous background GPS physical location.</li>
          <li style={{ marginBottom: '8px' }}>We do <strong>NOT</strong> access device microphones or record audio.</li>
          <li style={{ marginBottom: '8px' }}>We do <strong>NOT</strong> read private SMS messages or personal device photos outside of intentional user uploads (such as medical leave proof or homework files).</li>
          <li style={{ marginBottom: '8px' }}>We do <strong>NOT</strong> sell, rent, or trade student or parent information to third-party advertisers.</li>
        </ul>
      </section>

      {/* COPPA / Child Safety */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>4. Student & Child Privacy (COPPA & FERPA Compliance)</h2>
        <p>
          Technula EduFlow is designed for use by school faculty and parents/legal guardians. Student records are maintained under the contractual authority of the respective affiliated school. We strictly adhere to child data privacy standards:
        </p>
        <ul style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Student profiles are strictly scoped and never publicly visible.</li>
          <li style={{ marginBottom: '8px' }}>Access is restricted to verified school staff and the student's authenticated parent/guardian.</li>
          <li style={{ marginBottom: '8px' }}>No behavioral profiling, ad targeting, or commercial exploitation of student data is permitted.</li>
        </ul>
      </section>

      {/* Data Security & Retention */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>5. Security, Encryption & Multi-Tenant Isolation</h2>
        <p>
          All communications between the mobile application, web portal, and servers utilize Transport Layer Security (TLS 1.3 / HTTPS). Database storage utilizes AES-256 encryption for sensitive credentials and exam answer sheets. Each educational institution operates within isolated tenant scopes to prevent unauthorized cross-school data access.
        </p>
      </section>

      {/* Account & Data Deletion */}
      <section style={{
        marginBottom: '32px',
        backgroundColor: '#fff7ed',
        border: '1px solid #fed7aa',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#9a3412', marginTop: 0 }}>
          6. User Data & Account Deletion Policy
        </h2>
        <p style={{ color: '#7c2d12' }}>
          In full accordance with Google Play's Account Deletion Policy:
        </p>
        <p style={{ color: '#7c2d12' }}>
          <strong>How to Delete Your Account:</strong>
        </p>
        <ol style={{ paddingLeft: '20px', color: '#7c2d12' }}>
          <li style={{ marginBottom: '6px' }}>Inside the mobile app, tap <strong>Menu → Guardian Profile → Delete Account & Data</strong>.</li>
          <li style={{ marginBottom: '6px' }}>Or submit a deletion request by emailing <strong>privacy@technula.com</strong> with your registered mobile number and school name.</li>
        </ol>
        <p style={{ color: '#7c2d12', fontSize: '13px', margin: '12px 0 0 0' }}>
          * Upon verification, all user credentials, sessions, and device tokens will be permanently deleted within 30 days. Statutory student academic archives (such as official board results and fee financial audits) are preserved as legally mandated by local educational regulatory frameworks.
        </p>
      </section>

      {/* Contact */}
      <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>7. Contact Our Data Protection Team</h2>
        <p style={{ color: '#475569', fontSize: '14px' }}>
          For inquiries or rights requests under applicable privacy laws, contact:
        </p>
        <p style={{ color: '#0f172a', fontWeight: '600', fontSize: '14px' }}>
          Technula EduFlow Data Privacy Office<br />
          Email: <a href="mailto:privacy@technula.com" style={{ color: '#2563eb' }}>privacy@technula.com</a> / <a href="mailto:admin@technula.com" style={{ color: '#2563eb' }}>admin@technula.com</a><br />
          Website: <a href="https://technulaeduflow.technula.com" style={{ color: '#2563eb' }}>https://technulaeduflow.technula.com</a>
        </p>
      </section>
    </div>
  );
}
