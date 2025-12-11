import { useState, useEffect } from 'react'
import { UsageEntry, Card as CardType } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface UsageFormProps {
  open: boolean
  onClose: () => void
  onSave: (usage: UsageEntry) => void
  cards: CardType[]
  editUsage?: UsageEntry | null
}

const categories = [
  'Dining',
  'Groceries',
  'Shopping',
  'Travel',
  'Entertainment',
  'Bills',
  'Gas',
  'Healthcare',
  'Other'
]

export function UsageForm({ open, onClose, onSave, cards, editUsage }: UsageFormProps) {
  const [formData, setFormData] = useState<UsageEntry>({
    id: '',
    cardId: '',
    amount: 0,
    merchant: '',
    category: 'Other',
    date: Date.now(),
    notes: ''
  })

  const [amountInput, setAmountInput] = useState('')
  const [dateInput, setDateInput] = useState('')

  useEffect(() => {
    if (editUsage) {
      setFormData(editUsage)
      setAmountInput(editUsage.amount.toString())
      setDateInput(new Date(editUsage.date).toISOString().split('T')[0])
    } else {
      const now = new Date()
      setFormData({
        id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        cardId: cards.find(c => c.status === 'active')?.id || '',
        amount: 0,
        merchant: '',
        category: 'Other',
        date: Date.now(),
        notes: ''
      })
      setAmountInput('')
      setDateInput(now.toISOString().split('T')[0])
    }
  }, [editUsage, cards, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.cardId || !formData.merchant || amountInput === '') {
      return
    }

    const amount = parseFloat(amountInput)
    if (isNaN(amount) || amount <= 0) {
      return
    }

    const dateObj = new Date(dateInput)
    if (isNaN(dateObj.getTime())) {
      return
    }

    onSave({
      ...formData,
      amount,
      date: dateObj.getTime()
    })

    onClose()
  }

  const activeCards = cards.filter(c => c.status === 'active')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editUsage ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          <DialogDescription>
            Record a card transaction for spending insights
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="card">Card *</Label>
            <Select
              value={formData.cardId}
              onValueChange={(value) => setFormData({ ...formData, cardId: value })}
              required
            >
              <SelectTrigger id="card">
                <SelectValue placeholder="Select card" />
              </SelectTrigger>
              <SelectContent>
                {activeCards.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No active cards</div>
                ) : (
                  activeCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.label} (•••• {card.last4})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant *</Label>
            <Input
              id="merchant"
              placeholder="e.g. Amazon, Starbucks, Delta Airlines"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editUsage ? 'Update' : 'Add'} Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
