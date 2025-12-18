import { Card as CardType } from '@/lib/types'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { PencilSimple, Trash, Link, CreditCard, CheckCircle, Snowflake, XCircle, Copy, Check } from '@phosphor-icons/react'
import { useState } from 'react'
import { toast } from 'sonner'

interface CardItemProps {
  card: CardType
  onEdit: (card: CardType) => void
  onDelete: (id: string) => void
}

const networkColors: Record<CardType['network'], string> = {
  Visa: 'bg-blue-500',
  Mastercard: 'bg-orange-500',
  Amex: 'bg-green-500',
  Discover: 'bg-purple-500',
  Other: 'bg-gray-500',
}

const statusConfig: Record<CardType['status'], { icon: typeof CheckCircle; color: string; label: string }> = {
  active: { icon: CheckCircle, color: 'bg-success/10 text-success border-success/20', label: 'Active' },
  frozen: { icon: Snowflake, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Frozen' },
  closed: { icon: XCircle, color: 'bg-muted text-muted-foreground border-muted', label: 'Closed' },
}

export function CardItem({ card, onEdit, onDelete }: CardItemProps) {
  const [copied, setCopied] = useState(false)

  const isExpired = () => {
    const now = new Date()
    const expiry = new Date(parseInt(card.expYear), parseInt(card.expMonth) - 1)
    return now > expiry
  }

  const handleCopyCardNumber = async () => {
    try {
      await navigator.clipboard.writeText(card.last4)
      setCopied(true)
      toast.success('Card number copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy card number')
    }
  }

  const StatusIcon = statusConfig[card.status].icon

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 ${card.status === 'closed' ? 'opacity-60' : ''}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${networkColors[card.network]}`} />
      
      <CardContent className="p-5 pl-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight mb-1 truncate">
              {card.label}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard size={16} weight="duotone" />
              <span className="font-medium">{card.bank}</span>
              <span>•</span>
              <span>{card.network}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(card)}
              className="h-8 w-8"
            >
              <PencilSimple size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(card.id)}
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash size={18} />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">Card Number</div>
              <div 
                className="font-mono text-lg font-medium tracking-wider flex items-center gap-2 cursor-pointer hover:text-primary transition-colors group"
                onClick={handleCopyCardNumber}
                title="Click to copy last 4 digits"
              >
                <span>•••• {card.last4}</span>
                {copied ? (
                  <Check size={16} weight="bold" className="text-success" />
                ) : (
                  <Copy size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">Expires</div>
              <div className={`font-mono font-medium ${isExpired() ? 'text-destructive' : ''}`}>
                {card.expMonth}/{card.expYear}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${statusConfig[card.status].color} border`}>
              <StatusIcon size={14} weight="fill" className="mr-1" />
              {statusConfig[card.status].label}
            </Badge>
            {card.usageTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="capitalize">
                {tag}
              </Badge>
            ))}
          </div>

          {card.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {card.notes}
            </p>
          )}

          {card.sourceUrl && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => window.open(card.sourceUrl, '_blank')}
            >
              <Link size={14} className="mr-1" />
              Open Source Page
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
