import { useEffect, useState } from 'react'
import { Button, Dialog, Select, Typography } from '../components'
import { useSelectedProperty } from '../context/SelectedPropertyContext'

export function PropertySelectModal() {
  const {
    properties,
    selectedPropertyId,
    setSelectedPropertyId,
    needsPropertySelection,
    propertiesLoading,
  } = useSelectedProperty()
  const [draftId, setDraftId] = useState('')

  const open = needsPropertySelection

  useEffect(() => {
    if (!open) return
    setDraftId(selectedPropertyId || properties[0]?.id || '')
  }, [open, properties, selectedPropertyId])

  return (
    <Dialog
      open={open}
      onClose={() => undefined}
      preventDismiss
      title="Choose a property"
      description="Pick which property you want to work with. You can change this anytime from the top bar."
      className="max-w-md"
    >
      <div className="flex flex-col gap-4 border-t border-border pt-5">
        {propertiesLoading ? (
          <Typography variant="caption">Loading properties…</Typography>
        ) : (
          <Select
            label="Property"
            value={draftId}
            options={properties.map((property) => ({
              label: property.name,
              value: property.id,
            }))}
            onChange={(event) => setDraftId(event.target.value)}
          />
        )}
        <Button
          className="w-full"
          disabled={!draftId}
          onClick={() => {
            if (!draftId) return
            setSelectedPropertyId(draftId)
          }}
        >
          Continue
        </Button>
      </div>
    </Dialog>
  )
}
