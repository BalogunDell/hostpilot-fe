import type { ReactNode } from 'react'
import { BarChart3 } from 'lucide-react'

const LAST_UPDATED = '26 July 2026'
const CONTACT_EMAIL = 'privacy@hostsledger.com'
const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://hostsledger.com'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-svh bg-background text-foreground font-body">
      <header className="border-b border-border bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[820px] items-center px-5">
          <a href={SITE_URL} aria-label="HostsLedger home" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-[9px] bg-primary-900 text-tertiary">
              <BarChart3 className="size-5" aria-hidden />
            </span>
            <span className="text-[17px] font-bold tracking-tight text-foreground">HostsLedger</span>
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[820px] px-5 py-12">
        <h1 className="font-heading text-[clamp(1.875rem,5vw,2.5rem)] font-extrabold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
          HostsLedger (&ldquo;HostsLedger&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
          &ldquo;our&rdquo;), a Dees Enterprise company, helps short-let and Airbnb hosts track
          bookings, expenses, and profit. This Privacy Policy explains what information we collect,
          how we use it, and the choices you have. It applies to our website, web application, and
          related services (together, the &ldquo;Service&rdquo;).
        </p>

        <Section title="Information we collect">
          <p>We collect the following categories of information:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong className="text-foreground">Account information.</strong> Your name, email
              address, and a securely hashed password when you create an account.
            </li>
            <li>
              <strong className="text-foreground">Property &amp; financial data.</strong> Details
              you add about your properties, bookings, guest names, revenue, and expenses.
            </li>
            <li>
              <strong className="text-foreground">WhatsApp data.</strong> If you connect a WhatsApp
              Business number, we store that number and process the booking and expense messages you
              send so we can log them on your account.
            </li>
            <li>
              <strong className="text-foreground">Calendar sync data.</strong> If you enable
              calendar sync, we store the iCal links you provide (for example from Airbnb or
              Booking.com) and the reservation data they contain.
            </li>
            <li>
              <strong className="text-foreground">Payment information.</strong> When you subscribe to
              a paid plan, payments are processed by our payment provider (Paystack). We receive
              transaction confirmations and plan details, but we do not store your full card
              details.
            </li>
            <li>
              <strong className="text-foreground">Usage &amp; device data.</strong> Basic technical
              information such as your IP address, browser type, and how you interact with the
              Service, used to keep it secure and reliable.
            </li>
          </ul>
        </Section>

        <Section title="How we use your information">
          <ul className="ml-5 list-disc space-y-2">
            <li>Provide, operate, and maintain the Service.</li>
            <li>Log your bookings and expenses, including those sent by WhatsApp.</li>
            <li>Sync your connected calendars and prevent double-bookings.</li>
            <li>Process subscription payments and manage your plan.</li>
            <li>Send you service-related communications and, where you opt in, product updates.</li>
            <li>Protect against fraud, abuse, and security threats, and comply with the law.</li>
          </ul>
        </Section>

        <Section title="How we share information">
          <p>
            We do not sell your personal information. We share it only with service providers who
            help us run the Service, and only as needed to provide it, including:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong className="text-foreground">Meta Platforms (WhatsApp Business API)</strong> —
              to send and receive your WhatsApp messages.
            </li>
            <li>
              <strong className="text-foreground">Paystack</strong> — to process subscription
              payments.
            </li>
            <li>
              <strong className="text-foreground">Email &amp; infrastructure providers</strong> — to
              send transactional emails and host the Service.
            </li>
          </ul>
          <p>
            We may also disclose information if required by law, to enforce our terms, or to protect
            the rights, safety, and property of HostsLedger, our users, or others.
          </p>
        </Section>

        <Section title="Data retention">
          <p>
            We keep your information for as long as your account is active or as needed to provide
            the Service. If you delete your account, we will delete or anonymise your personal data
            within a reasonable period, except where we must retain it to comply with legal
            obligations, resolve disputes, or enforce our agreements.
          </p>
        </Section>

        <Section title="Data security">
          <p>
            We use industry-standard measures to protect your information, including encryption in
            transit and hashed passwords. No method of transmission or storage is completely secure,
            so we cannot guarantee absolute security, but we work hard to protect your data.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Depending on your location, you may have the right to access, correct, export, or delete
            your personal data, and to object to or restrict certain processing. As a service used
            in Nigeria, we handle personal data consistent with the Nigeria Data Protection Act. To
            exercise any of these rights, contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-secondary hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            We use essential cookies and similar technologies to keep you signed in and to operate
            the Service. We do not use them to sell your data.
          </p>
        </Section>

        <Section title="Children">
          <p>
            The Service is not intended for anyone under 18, and we do not knowingly collect personal
            data from children.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. When we make material changes, we
            will update the &ldquo;Last updated&rdquo; date above and, where appropriate, notify you.
          </p>
        </Section>

        <Section title="Contact us">
          <p>
            If you have any questions about this Privacy Policy or how we handle your data, contact
            us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-secondary hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <div className="mt-12 border-t border-border pt-6 text-[13px] text-muted-foreground">
          © {new Date().getFullYear()} HostsLedger. A Dees Enterprise Company.
        </div>
      </main>
    </div>
  )
}
