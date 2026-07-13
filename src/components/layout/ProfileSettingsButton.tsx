import { useNavigate } from 'react-router-dom'
import { Avatar } from '../Avatar'
import { Typography } from '../Typography'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'

function userInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}

interface ProfileSettingsButtonProps {
  showName?: boolean
  className?: string
}

export function ProfileSettingsButton({
  showName = true,
  className,
}: ProfileSettingsButtonProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.name ?? 'User'
  const role = user?.role === 'COHOST' ? 'Co-host' : 'Admin'

  return (
    <button
      type="button"
      onClick={() => navigate('/settings')}
      className={cn(
        'rounded-lg transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        showName ? 'flex items-center gap-3 px-1 py-1' : 'p-0',
        className,
      )}
      aria-label="Open settings"
    >
      {showName ? (
        <div className="text-right">
          <Typography variant="label" className="block leading-tight">
            {displayName}
          </Typography>
          <Typography variant="caption" className="leading-tight">
            {role}
          </Typography>
        </div>
      ) : null}
      <Avatar
        alt={displayName}
        fallback={userInitials(displayName)}
        size="sm"
      />
    </button>
  )
}
