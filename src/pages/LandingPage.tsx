import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Check,
  FileText,
  Home,
  Menu,
  MessageCircle,
  Repeat,
  X,
} from 'lucide-react'
import { cn } from '../lib/cn'
import { buttonVariants } from '../components/Button'

/* ------------------------------------------------------------------ */
/* Domains                                                             */
/* The marketing site (this build) is served at hostsledger.com, while */
/* the app (auth + dashboard) lives on the app.hostsledger.com subdomain. */
/* ------------------------------------------------------------------ */

const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://app.hostsledger.com'
const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://hostsledger.com'
const REGISTER_URL = `${APP_URL}/register`

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const LEDGER_ROWS = [
  {
    unit: 'Oceanview Penthouse A',
    status: 'Occupied',
    revenue: '1,450,000.00',
    expense: '212,400.00',
    net: '1,229,180.00',
    negative: false,
  },
  {
    unit: 'Executive Suite 4',
    status: 'Occupied',
    revenue: '980,000.00',
    expense: '143,360.00',
    net: '835,000.00',
    negative: false,
  },
  {
    unit: 'Lekki Phase 1 Loft',
    status: 'Vacant',
    revenue: '0.00',
    expense: '45,000.00',
    net: '\u201245,000.00',
    negative: true,
  },
] as const

const STEPS = [
  {
    icon: Home,
    step: 'Step 1',
    title: 'Add your property',
    body: 'Set up each place with its nightly rate in a couple of minutes.',
  },
  {
    icon: MessageCircle,
    step: 'Step 2',
    title: 'Log bookings & expenses',
    body: 'Add them in the app — or just send HostsLedger a message on WhatsApp.',
  },
  {
    icon: BarChart3,
    step: 'Step 3',
    title: 'See your real profit',
    body: 'Revenue, costs and net profit update automatically for every property.',
  },
] as const

// Kept in sync with the backend catalog in shared/src/plans.ts (PLAN_CATALOG).
const PLANS = [
  {
    name: 'Starter',
    price: '\u20A60',
    suffix: '/month',
    note: 'For hosts with a single property.',
    features: [
      '1 property',
      'Manual booking & expense tracking',
      '1 booking & 1 expense per month by WhatsApp',
      'Calendar view',
      'Basic income summary',
      'Guest review links',
    ],
    cta: 'Start free',
    featured: false,
  },
  {
    name: 'Growth',
    price: '\u20A625,000',
    suffix: '/month',
    note: 'For hosts scaling up their portfolio.',
    features: [
      'Up to 3 properties',
      'Everything in Starter',
      'Unlimited WhatsApp logging',
      'Airbnb & Booking.com calendar sync',
      'Monthly reports',
      'Property performance comparison',
    ],
    cta: 'Choose Growth',
    featured: true,
  },
  {
    name: 'Pro',
    price: '\u20A650,000',
    suffix: '/month',
    note: 'For serious hosts & property managers.',
    features: [
      'Up to 10 properties',
      'Everything in Growth',
      'Unlimited bookings & expenses',
      'Co-host access',
      'Portfolio dashboard',
      'Priority support',
    ],
    cta: 'Choose Pro',
    featured: false,
  },
  {
    name: 'Agency',
    price: 'Custom',
    suffix: '',
    note: 'For agencies & portfolios of 10+ properties.',
    features: [
      'Everything in Pro',
      'Unlimited properties',
      'Dedicated account manager',
      'Custom onboarding & support',
    ],
    cta: 'Talk to us',
    featured: false,
  },
] as const

/* ------------------------------------------------------------------ */
/* Scroll-reveal hook                                                  */
/* ------------------------------------------------------------------ */

/** Adds `is-visible` once the element scrolls into view (fires once). */
function useInView<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, inView }
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-[9px] bg-primary-900 text-tertiary">
        <BarChart3 className="size-5" aria-hidden />
      </span>
      <span className="flex flex-col leading-tight">
        <strong className={cn('text-[15px] font-bold', dark ? 'text-white' : 'text-foreground')}>
          HostsLedger
        </strong>
        <em
          className={cn(
            'text-[11px] not-italic',
            dark ? 'text-primary-300' : 'text-muted-foreground',
          )}
        >
          Bookings, expenses &amp; profit
        </em>
      </span>
    </span>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.14em] text-tertiary-600">
      {children}
    </p>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const bento = useInView()
  const ledger = useInView()
  const market = useInView()
  const pricing = useInView()
  const cta = useInView()

  const lift = 'transition-transform duration-200 hover:scale-[1.03] active:scale-95'
  const darkBtn = cn(
    buttonVariants({ variant: 'primary', size: 'md' }),
    'bg-primary-900 hover:bg-primary-800',
    lift,
  )
  const mintBtn = cn(
    buttonVariants({ size: 'md' }),
    'bg-tertiary text-tertiary-foreground hover:bg-tertiary-600',
    lift,
  )
  const outlineBtn = cn(buttonVariants({ variant: 'outlined', size: 'md' }), lift)

  return (
    <div className="min-h-svh bg-background text-foreground font-body">
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between gap-4 px-5">
          <a href={SITE_URL} aria-label="HostsLedger home">
            <Brand />
          </a>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            <a href="#features" className="text-sm font-medium text-primary-700 hover:text-foreground">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-primary-700 hover:text-foreground">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <a href={REGISTER_URL} className={cn(darkBtn, 'hidden md:inline-flex')}>
              Start free
            </a>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-[9px] border border-border md:hidden"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="flex flex-col gap-1.5 border-b border-border bg-white px-5 pb-4 pt-3 md:hidden">
            <a
              href="#features"
              className="px-1 py-2.5 font-medium text-primary-700"
              onClick={() => setMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#pricing"
              className="px-1 py-2.5 font-medium text-primary-700"
              onClick={() => setMenuOpen(false)}
            >
              Pricing
            </a>
            <a href={REGISTER_URL} className={cn(darkBtn, 'mt-1.5 w-full')} onClick={() => setMenuOpen(false)}>
              Start free
            </a>
          </div>
        )}
      </header>

      <main>
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden">
          {/* Decorative floating glow */}
          <div
            aria-hidden
            className="hp-float hp-glow pointer-events-none absolute left-1/2 top-[-6rem] -z-10 size-[32rem] -translate-x-1/2 rounded-full bg-tertiary/25 blur-[120px]"
          />
          <div className="mx-auto w-full max-w-[1120px] px-5 pb-10 pt-16 text-center lg:pt-20">
            <p
              className="hp-enter mb-3.5 text-xs font-bold uppercase tracking-[0.14em] text-tertiary-600"
              style={{ animationDelay: '0.05s' }}
            >
              For short-let &amp; Airbnb hosts
            </p>
            <h1
              className="hp-enter font-heading text-[clamp(2.125rem,7vw,3.75rem)] font-extrabold leading-[1.1] tracking-[-0.035em]"
              style={{ animationDelay: '0.15s' }}
            >
              Know exactly what your
              <br className="hidden sm:inline" /> short-lets earn.
            </h1>
            <p
              className="hp-enter mx-auto mt-5 max-w-[620px] text-[clamp(0.9375rem,2.2vw,1.125rem)] text-muted-foreground"
              style={{ animationDelay: '0.28s' }}
            >
              Log bookings and expenses manually or with a WhatsApp message, sync your Airbnb &amp;
              Booking.com calendars, and see your real profit on every property — no spreadsheets.
            </p>
            <div
              className="hp-enter mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ animationDelay: '0.4s' }}
            >
              <a href={REGISTER_URL} className={cn(darkBtn, 'w-full sm:w-auto')}>
                Start free
              </a>
              <a href="#features" className={cn(outlineBtn, 'w-full sm:w-auto')}>
                See how it works
              </a>
            </div>
            <p
              className="hp-enter mt-4 text-[13px] text-muted-foreground"
              style={{ animationDelay: '0.5s' }}
            >
              Free forever plan · No card required
            </p>
          </div>
        </section>

        {/* ============ FEATURE BENTO ============ */}
        <section
          id="features"
          ref={bento.ref}
          className={cn(
            'reveal-group mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-4 px-5 pb-6 md:grid-cols-2 lg:grid-cols-3',
            bento.inView && 'is-visible',
          )}
        >
          {/* WhatsApp Logging (wide) */}
          <article className="reveal-item rounded-2xl border border-border bg-card p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-md md:col-span-2 md:grid md:grid-cols-2 md:items-center md:gap-5">
            <div>
              <div className="mb-3.5 grid size-9 place-items-center rounded-[10px] bg-muted">
                <MessageCircle className="size-5" aria-hidden />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Log bookings by WhatsApp</h3>
              <p className="text-sm text-muted-foreground">
                Just text HostsLedger like you&rsquo;d text a friend. Your bookings and expenses are
                saved instantly — no forms, no app switching.
              </p>
              <ul className="mt-3.5 grid gap-2">
                {['Add bookings & expenses in one message', 'Ask if a place is free on any date'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2 text-[13px] font-medium text-primary-700">
                      <Check className="size-4 shrink-0 text-tertiary" aria-hidden />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="mt-4 rounded-xl bg-muted p-4 md:mt-0">
              <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-3.5 shadow-card">
                <span className="text-[13px] font-bold">You → HostsLedger</span>
                <span className="text-xs text-muted-foreground">
                  &ldquo;Booking: Lekki flat, &#8358;150,000, Jul 24&ndash;27&rdquo;
                </span>
                <span className="text-xs font-medium text-tertiary-600">
                  ✓ Saved — 3 nights added to Lekki flat
                </span>
                <span className="mt-1.5 flex gap-1.5">
                  {['Booking', 'Lekki flat'].map((t) => (
                    <em key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold not-italic text-primary-700">
                      {t}
                    </em>
                  ))}
                </span>
              </div>
            </div>
          </article>

          {/* Owner Reporting (dark) */}
          <article className="reveal-item rounded-2xl border border-primary-800 bg-primary-900 p-6 text-white transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="mb-3.5 grid size-9 place-items-center rounded-[10px] bg-white/10 text-tertiary">
              <FileText className="size-5" aria-hidden />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Reports in one tap</h3>
            <p className="text-sm text-primary-300">
              Turn a month of bookings and expenses into a clean statement — keep it for your records
              or share it with the owners you manage.
            </p>
            <div className="mt-4 grid gap-2 rounded-[10px] border border-primary-700 bg-primary-800 p-3.5">
              <span className="text-[11px] font-semibold tracking-wide text-tertiary">
                MONTHLY_STATEMENT_OCT.pdf
              </span>
              <span className="h-2 rounded bg-primary-700" />
              <span className="h-2 w-3/5 rounded bg-primary-700" />
            </div>
          </article>

          {/* Multi-Channel Sync */}
          <article className="reveal-item rounded-2xl border border-border bg-card p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="mb-3.5 grid size-9 place-items-center rounded-[10px] bg-muted">
              <Repeat className="size-5" aria-hidden />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Never double-book again</h3>
            <p className="text-sm text-muted-foreground">
              Sync Airbnb, Booking.com and your direct bookings into one calendar, so two guests
              never land on the same night.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Airbnb', 'Booking.com', 'Direct'].map((c) => (
                <span key={c} className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-primary-700">
                  {c}
                </span>
              ))}
            </div>
          </article>

          {/* Expense Intel */}
          <article className="reveal-item rounded-2xl border border-border bg-card p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="mb-3.5 grid size-9 place-items-center rounded-[10px] bg-muted">
              <BarChart3 className="size-5" aria-hidden />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Profit, per property</h3>
            <p className="text-sm text-muted-foreground">
              Track every expense against every booking and see real net profit — not just what came
              in.
            </p>
            <div className="mt-4">
              <div className="flex h-[90px] items-end gap-2">
                {[40, 65, 50, 85, 70].map((h, i) => (
                  <span
                    key={i}
                    className={cn('hp-bar flex-1 rounded-t', i === 3 ? 'bg-primary-900' : 'bg-tertiary')}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-xs font-semibold text-tertiary-600">
                <span>Maintenance &minus;12%</span>
                <span>Net +5.3%</span>
              </div>
            </div>
          </article>
        </section>

        {/* ============ LEDGER TABLE ============ */}
        <section
          ref={ledger.ref}
          className={cn('reveal-group mt-6 bg-primary-900 py-16 text-white', ledger.inView && 'is-visible')}
        >
          <div className="mx-auto w-full max-w-[1120px] px-5">
            <div className="reveal-item mb-7">
              <h2 className="font-heading text-[clamp(1.5rem,4vw,2.125rem)] font-extrabold">
                All your properties, one clear view
              </h2>
              <p className="mt-2.5 text-primary-300">
                See revenue, expenses and net profit for every place at a glance — so you know what&rsquo;s
                making money and what&rsquo;s costing you.
              </p>
            </div>

            <div className="reveal-item overflow-x-auto rounded-2xl border border-primary-700 bg-primary-800">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-primary-700 text-left text-[11px] uppercase tracking-wider text-primary-400">
                    <th className="px-[18px] py-4 font-bold">Property Unit</th>
                    <th className="px-[18px] py-4 font-bold">Status</th>
                    <th className="px-[18px] py-4 text-right font-bold">Revenue (&#8358;)</th>
                    <th className="px-[18px] py-4 text-right font-bold">Expense (&#8358;)</th>
                    <th className="px-[18px] py-4 text-right font-bold">Net (&#8358;)</th>
                    <th className="w-[70px] px-[18px] py-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {LEDGER_ROWS.map((row, i) => (
                    <tr
                      key={row.unit}
                      className={cn('text-sm', i < LEDGER_ROWS.length - 1 && 'border-b border-primary-700')}
                    >
                      <td className="px-[18px] py-4 text-primary-100">{row.unit}</td>
                      <td className="px-[18px] py-4">
                        <span
                          className={cn(
                            'inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                            row.status === 'Occupied'
                              ? 'bg-tertiary/15 text-tertiary'
                              : 'bg-white/10 text-primary-300',
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className={cn('px-[18px] py-4 text-right tabular-nums', row.revenue !== '0.00' ? 'text-tertiary' : 'text-primary-100')}>
                        {row.revenue}
                      </td>
                      <td className="px-[18px] py-4 text-right tabular-nums text-red-300">{row.expense}</td>
                      <td className={cn('px-[18px] py-4 text-right tabular-nums', row.negative ? 'text-red-300' : 'text-primary-100')}>
                        {row.net}
                      </td>
                      <td className="px-[18px] py-4 text-right tracking-[2px] text-primary-400">•••</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section
          ref={market.ref}
          className={cn('reveal-group mx-auto w-full max-w-[1120px] px-5 pt-16', market.inView && 'is-visible')}
          aria-label="How it works"
        >
          <div className="reveal-item mb-7 text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-heading text-[clamp(1.5rem,4vw,2.125rem)] font-extrabold">
              Up and running in minutes
            </h2>
            <p className="mx-auto mt-2.5 max-w-[560px] text-muted-foreground">
              No setup headache. Add a property, log your stays, and let HostsLedger do the math.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, step, title, body }) => (
              <article
                key={title}
                className="reveal-item rounded-2xl border border-border bg-card p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-3.5 grid size-9 place-items-center rounded-[10px] bg-muted">
                  <Icon className="size-5" aria-hidden />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wide text-tertiary-600">
                  {step}
                </span>
                <h3 className="mb-2 mt-1 text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ============ PRICING ============ */}
        <section
          id="pricing"
          ref={pricing.ref}
          className={cn('reveal-group py-16', pricing.inView && 'is-visible')}
        >
          <div className="mx-auto w-full max-w-[1120px] px-5">
            <div className="reveal-item mb-9 text-center">
              <h2 className="font-heading text-[clamp(1.5rem,4vw,2.125rem)] font-extrabold">
                Start free. Upgrade when you grow.
              </h2>
              <p className="mx-auto mt-3 max-w-[560px] text-muted-foreground">
                No card required to start. Pick the plan that fits how many properties you manage.
              </p>
            </div>

            <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PLANS.map((plan) => (
                <article
                  key={plan.name}
                  className={cn(
                    'reveal-item relative flex flex-col rounded-2xl border p-7 transition duration-300 hover:-translate-y-1 hover:shadow-md',
                    plan.featured
                      ? 'border-primary-900 bg-primary-900 text-white shadow-md lg:scale-[1.03]'
                      : 'border-border bg-card',
                  )}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-tertiary px-3.5 py-1 text-[11px] font-extrabold tracking-wide text-tertiary-foreground">
                      MOST POPULAR
                    </span>
                  )}
                  <h3 className={cn('text-[15px] font-bold', plan.featured ? 'text-white/85' : 'opacity-85')}>
                    {plan.name}
                  </h3>
                  <p className="mb-1 mt-2.5 text-[38px] font-extrabold leading-none tracking-[-0.03em]">
                    {plan.price}
                    {plan.suffix && <span className="text-sm font-medium opacity-60">{plan.suffix}</span>}
                  </p>
                  <p className={cn('mb-4.5 text-[13px]', plan.featured ? 'text-primary-300' : 'text-muted-foreground')}>
                    {plan.note}
                  </p>
                  <ul className="mb-6 grid gap-3">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className={cn('flex items-start gap-2 text-sm', plan.featured ? 'text-primary-100' : 'text-primary-700')}
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-tertiary" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={REGISTER_URL}
                    className={cn('mt-auto w-full', plan.featured ? mintBtn : outlineBtn)}
                  >
                    {plan.cta}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CTA BANNER ============ */}
        <section
          ref={cta.ref}
          className={cn('reveal-group mx-auto w-full max-w-[1120px] px-5', cta.inView && 'is-visible')}
        >
          <div className="reveal-item mb-16 flex flex-col items-start gap-5 rounded-[20px] bg-tertiary px-7 py-8 shadow-md transition duration-300 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-9">
            <div>
              <h2 className="font-heading text-[clamp(1.375rem,3.5vw,1.875rem)] font-extrabold text-[#04241b]">
                Run your short-lets like a business.
              </h2>
              <p className="mt-2 max-w-[560px] text-[#0a3b2e]">
                Add your first property in minutes and see your real numbers. Free to start - no card
                required.
              </p>
            </div>
            <a href={REGISTER_URL} className={cn(darkBtn, 'shrink-0')}>
              Start free
            </a>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="bg-primary-900 py-12 text-white">
        <div className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-8 border-b border-primary-700 px-5 pb-8 md:grid-cols-[1.4fr_1fr_1.2fr]">
          <Brand dark />

          <div>
            <h4 className="mb-3.5 text-xs uppercase tracking-widest text-primary-400">Legal</h4>
            <a href="#" className="block py-1 text-sm text-primary-200 hover:text-white">
              Privacy Policy
            </a>
            <a href="#" className="block py-1 text-sm text-primary-200 hover:text-white">
              Terms of Service
            </a>
          </div>

          <div>
            <h4 className="mb-3.5 text-xs uppercase tracking-widest text-primary-400">Stay Updated</h4>
            <NewsletterForm />
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1120px] px-5 pt-5 text-[13px] text-primary-400">
          © {new Date().getFullYear()} HostsLedger. A Dees Enterprise Company.
        </div>
      </footer>
    </div>
  )
}

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  return (
    <>
      <form
        className="flex max-w-[320px] gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (email) {
            setDone(true)
            setEmail('')
          }
        }}
      >
        <label htmlFor="newsletter-email" className="sr-only">
          Your email
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="min-w-0 flex-1 rounded-[10px] border border-primary-700 bg-primary-800 px-3.5 py-2.5 text-sm text-white placeholder:text-primary-400 focus:border-tertiary focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Subscribe"
          className="grid place-items-center rounded-[10px] bg-tertiary px-4 text-tertiary-foreground transition duration-200 hover:bg-tertiary-600 hover:scale-105 active:scale-95"
        >
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </form>
      {done && <p className="mt-2.5 text-[13px] text-tertiary">Thanks — we&rsquo;ll be in touch.</p>}
    </>
  )
}

export default LandingPage
