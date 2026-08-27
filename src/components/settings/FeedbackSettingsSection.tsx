import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button, Card, Typography } from '../index'
import { FeedbackDialog } from '../FeedbackDialog'

export function FeedbackSettingsSection() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Card padding="md" className="flex flex-col gap-4">
        <Typography variant="body" className="text-muted-foreground">
          Tell us what is working, what is missing, or where you got stuck. Messages go to the
          HostsLedger team by email.
        </Typography>
        <Button className="self-start" allowWhenReadOnly onClick={() => setOpen(true)}>
          <MessageSquare className="size-4" aria-hidden />
          Leave feedback
        </Button>
      </Card>
      <FeedbackDialog open={open} onClose={() => setOpen(false)} source="app" />
    </>
  )
}
