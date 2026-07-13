const PAYSTACK_SCRIPT_URL = 'https://js.paystack.co/v1/inline.js'

export interface PaystackCheckoutConfig {
  publicKey: string
  email: string
  amountKobo: number
  reference: string
  accessCode?: string
  onSuccess: (reference: string) => void
  onClose?: () => void
}

interface PaystackHandler {
  openIframe: () => void
}

interface PaystackPop {
  setup: (options: {
    key: string
    email: string
    amount: number
    ref: string
    access_code?: string
    currency?: string
    callback: (response: { reference: string; status: string }) => void
    onClose: () => void
  }) => PaystackHandler
}

declare global {
  interface Window {
    PaystackPop?: PaystackPop
  }
}

let scriptPromise: Promise<void> | null = null

export function loadPaystackInline(): Promise<void> {
  if (window.PaystackPop) {
    return Promise.resolve()
  }

  if (scriptPromise) {
    return scriptPromise
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PAYSTACK_SCRIPT_URL}"]`,
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Paystack')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = PAYSTACK_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Paystack'))
    document.body.appendChild(script)
  })

  return scriptPromise
}

export async function openPaystackCheckout(config: PaystackCheckoutConfig) {
  await loadPaystackInline()

  if (!window.PaystackPop) {
    throw new Error('Paystack checkout is unavailable')
  }

  const handler = window.PaystackPop.setup({
    key: config.publicKey,
    email: config.email,
    amount: config.amountKobo,
    ref: config.reference,
    access_code: config.accessCode,
    currency: 'NGN',
    callback(response) {
      config.onSuccess(response.reference)
    },
    onClose() {
      config.onClose?.()
    },
  })

  handler.openIframe()
}
