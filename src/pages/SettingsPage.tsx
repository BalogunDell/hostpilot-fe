import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AccountSettingsSection } from '../components/settings/AccountSettingsSection'
import { SettingsPlansSection } from '../components/settings/SettingsPlansSection'
import { SettingsSection } from '../components/settings/SettingsSection'
import { WhatsAppSettingsSection } from '../components/settings/WhatsAppSettingsSection'
import { TeamSettingsPage } from './TeamSettingsPage'

export function SettingsPage() {
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return
    const target = document.querySelector(location.hash)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash, location.pathname])

  return (
    <div className="flex flex-col gap-6">
      <SettingsSection
        id="whatsapp"
        title="WhatsApp"
        description="Connect a WhatsApp Business number to add bookings and expenses by message."
      >
        <WhatsAppSettingsSection />
      </SettingsSection>

      <SettingsSection
        id="team"
        title="Co-hosts"
        description="Invite and manage co-hosts for your properties."
      >
        <TeamSettingsPage embedded />
      </SettingsSection>

      <SettingsSection
        id="pricing"
        title="Plans & pricing"
        description="View your current plan and upgrade options."
      >
        <SettingsPlansSection />
      </SettingsSection>

      <SettingsSection
        id="account"
        title="Account"
        description="Manage your profile, password, and account access."
      >
        <AccountSettingsSection />
      </SettingsSection>
    </div>
  )
}
