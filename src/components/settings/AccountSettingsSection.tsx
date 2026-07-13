import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Dialog, Input, Typography } from '../index'
import { LogoutButton } from '../layout/LogoutButton'
import { ApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'

export function AccountSettingsSection() {
  const api = useApi()
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      api('/auth/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError('')
      showToast('Password updated')
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to update password'
      setPasswordError(message)
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: () =>
      api('/auth/me', {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword }),
      }),
    onSuccess: () => {
      logout()
      navigate('/login', { replace: true })
      showToast('Your account has been deleted')
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to delete account'
      setDeleteError(message)
    },
  })

  function handleChangePassword() {
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    setPasswordError('')
    changePasswordMutation.mutate()
  }

  function handleDeleteAccount() {
    if (!deletePassword) {
      setDeleteError('Enter your password to confirm')
      return
    }
    setDeleteError('')
    deleteAccountMutation.mutate()
  }

  return (
    <>
      <Card padding="md" className="flex flex-col gap-6">
        <Input
          label="Email"
          type="email"
          value={user?.email ?? ''}
          disabled
          helperText="Your email address cannot be changed."
        />

        <div className="flex flex-col gap-4 border-t border-border pt-6">
          <Typography variant="h4">Change password</Typography>
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {passwordError ? (
            <Typography variant="caption" className="text-destructive">
              {passwordError}
            </Typography>
          ) : null}
          <Button
            className="self-start"
            allowWhenReadOnly
            loading={changePasswordMutation.isPending}
            disabled={!currentPassword || !newPassword || !confirmPassword}
            onClick={handleChangePassword}
          >
            Update password
          </Button>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <Typography variant="h4">Sign out</Typography>
          <Typography variant="body" className="text-muted-foreground">
            End your session on this device.
          </Typography>
          <LogoutButton showLabel className="self-start" />
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <Typography variant="h4">Delete account</Typography>
          <Typography variant="body" className="text-muted-foreground">
            Permanently remove your account and all associated data from StayPilot.
          </Typography>
          <Button
            variant="destructive"
            allowWhenReadOnly
            className="self-start"
            onClick={() => {
              setDeletePassword('')
              setDeleteError('')
              setDeleteOpen(true)
            }}
          >
            Delete account
          </Button>
        </div>
      </Card>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete your account?"
      >
        <div className="flex flex-col gap-4">
          <Typography variant="body" className="text-muted-foreground">
            This action cannot be undone. Deleting your account will permanently remove
            all of your properties, bookings, expenses, and other data.
          </Typography>
          <Input
            label="Confirm with your password"
            type="password"
            autoComplete="current-password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
          />
          {deleteError ? (
            <Typography variant="caption" className="text-destructive">
              {deleteError}
            </Typography>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outlined" allowWhenReadOnly onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              allowWhenReadOnly
              loading={deleteAccountMutation.isPending}
              disabled={!deletePassword}
              onClick={handleDeleteAccount}
            >
              Delete my account
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
