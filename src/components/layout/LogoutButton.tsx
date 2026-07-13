import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../Button'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'

interface LogoutButtonProps {
  showLabel?: boolean
  className?: string
}

export function LogoutButton({ showLabel = false, className }: LogoutButtonProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <Button
      variant={showLabel ? 'outlined' : 'ghost'}
      size={showLabel ? 'sm' : 'icon-sm'}
      allowWhenReadOnly
      className={cn(className)}
      onClick={handleLogout}
      aria-label="Log out"
    >
      <LogOut className={showLabel ? 'size-4' : 'size-5'} />
      {showLabel ? 'Log out' : null}
    </Button>
  )
}
