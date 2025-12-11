import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Warning } from '@phosphor-icons/react'
import { Input } from './ui/input'

interface PanicWipeDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function PanicWipeDialog({ open, onClose, onConfirm }: PanicWipeDialogProps) {
  const [confirmation, setConfirmation] = useState('')
  const CONFIRM_TEXT = 'DELETE'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md animate-pulse-border border-2">
        <DialogHeader>
          <DialogTitle className="text-2xl text-destructive flex items-center gap-2">
            <Warning size={28} weight="fill" />
            Panic Wipe
          </DialogTitle>
          <DialogDescription className="text-base">
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <Warning size={18} weight="fill" />
            <AlertDescription>
              This will permanently erase all locally stored card metadata and app settings from this browser. 
              You will need to set a new PIN and re-enter all your cards.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Type <span className="font-mono font-bold">{CONFIRM_TEXT}</span> to confirm:
            </p>
            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={CONFIRM_TEXT}
              className="font-mono"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={confirmation !== CONFIRM_TEXT}
          >
            Wipe All Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
