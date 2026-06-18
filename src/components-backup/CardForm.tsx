import { useState, useEffect } from 'react'
import { Card as CardType, CardNetwork, CardStatus } from '@/lib/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { X } from '@phosphor-icons/react'
import { generateId } from '@/lib/storage'

interface CardFormProps {
  open: boolean
  onClose: () => void
  onSave: (card: CardType) => void
  editCard?: CardType | null
}

const networks: CardNetwork[] = ['Visa', 'Mastercard', 'Amex', 'Discover', 'Other']
const statuses: CardStatus[] = ['active', 'frozen', 'closed']
const commonTags = ['shopping', 'bills', 'subscriptions', 'travel', 'rewards', 'dining', 'business', 'backup', 'primary']

export function CardForm({ open, onClose, onSave, editCard }: CardFormProps) {
  const [formData, setFormData] = useState<CardType>({
    id: '',
    label: '',
    bank: '',
    network: 'Visa',
    last4: '',
    expMonth: '',
    expYear: '',
    status: 'active',
    usageTags: [],
    notes: '',
    sourceUrl: '',
  })

  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    queueMicrotask(() => {
      if (editCard) {
        setFormData(editCard)
      } else {
      setFormData({
        id: generateId(),
        label: '',
        bank: '',
        network: 'Visa',
        last4: '',
        expMonth: '',
        expYear: '',
        status: 'active',
        usageTags: [],
        notes: '',
        sourceUrl: '',
      })
      }
    })
  }, [editCard, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.label || !formData.bank || !formData.last4 || !formData.expMonth || !formData.expYear) {
      return
    }

    onSave(formData)
    onClose()
  }

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !formData.usageTags.includes(trimmedTag)) {
      setFormData({ ...formData, usageTags: [...formData.usageTags, trimmedTag] })
    }
    setNewTag('')
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, usageTags: formData.usageTags.filter(t => t !== tag) })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editCard ? 'Edit Card' : 'Add New Card'}
          </DialogTitle>
          <DialogDescription>
            Store card metadata only. Never enter full card numbers or CVV codes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="label">Card Label / Nickname *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Main Visa – Online Shopping"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bank">Bank / Issuer *</Label>
                <Input
                  id="bank"
                  value={formData.bank}
                  onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                  placeholder="e.g., Chase"
                  required
                />
              </div>

              <div>
                <Label htmlFor="network">Card Network *</Label>
                <Select value={formData.network} onValueChange={(value: CardNetwork) => setFormData({ ...formData, network: value })}>
                  <SelectTrigger id="network">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((network) => (
                      <SelectItem key={network} value={network}>
                        {network}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="last4">Last 4 Digits *</Label>
                <Input
                  id="last4"
                  value={formData.last4}
                  onChange={(e) => setFormData({ ...formData, last4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="1234"
                  maxLength={4}
                  className="font-mono"
                  required
                />
              </div>

              <div>
                <Label htmlFor="expMonth">Exp Month *</Label>
                <Input
                  id="expMonth"
                  value={formData.expMonth}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                    if (!val || (parseInt(val) >= 1 && parseInt(val) <= 12)) {
                      setFormData({ ...formData, expMonth: val })
                    }
                  }}
                  placeholder="MM"
                  maxLength={2}
                  className="font-mono"
                  required
                />
              </div>

              <div>
                <Label htmlFor="expYear">Exp Year *</Label>
                <Input
                  id="expYear"
                  value={formData.expYear}
                  onChange={(e) => setFormData({ ...formData, expYear: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="YYYY"
                  maxLength={4}
                  className="font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: CardStatus) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Usage Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(newTag)
                    }
                  }}
                  placeholder="Add custom tag..."
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={() => addTag(newTag)}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {commonTags.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTag(tag)}
                    disabled={formData.usageTags.includes(tag)}
                    className="text-xs capitalize"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
              {formData.usageTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.usageTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="capitalize">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X size={12} weight="bold" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information about this card..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="sourceUrl">Source URL (Optional)</Label>
              <Input
                id="sourceUrl"
                type="url"
                value={formData.sourceUrl}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                placeholder="https://example.com/cards"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editCard ? 'Save Changes' : 'Add Card'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
