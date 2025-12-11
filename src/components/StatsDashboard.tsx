import { useMemo } from 'react'
import { Card as CardType, UsageEntry } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { 
  ChartBarHorizontal, 
  TrendUp, 
  CreditCard, 
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  ChartLine
} from '@phosphor-icons/react'

interface StatsDashboardProps {
  cards: CardType[]
  usage: UsageEntry[]
}

interface CardSpending {
  cardId: string
  card: CardType
  total: number
  count: number
  avgTransaction: number
}

interface CategorySpending {
  category: string
  total: number
  count: number
  percentage: number
}

interface TimeSeriesPoint {
  date: string
  amount: number
}

export function StatsDashboard({ cards, usage }: StatsDashboardProps) {
  const stats = useMemo(() => {
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const thirtyDaysAgo = now - 30 * oneDay
    const sixtyDaysAgo = now - 60 * oneDay

    const currentPeriodUsage = usage.filter(u => u.date >= thirtyDaysAgo)
    const previousPeriodUsage = usage.filter(u => u.date >= sixtyDaysAgo && u.date < thirtyDaysAgo)

    const currentTotal = currentPeriodUsage.reduce((sum, u) => sum + u.amount, 0)
    const previousTotal = previousPeriodUsage.reduce((sum, u) => sum + u.amount, 0)
    const percentageChange = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal) * 100 
      : 0

    const cardSpendingMap = new Map<string, CardSpending>()
    currentPeriodUsage.forEach(u => {
      const card = cards.find(c => c.id === u.cardId)
      if (!card) return

      if (!cardSpendingMap.has(u.cardId)) {
        cardSpendingMap.set(u.cardId, {
          cardId: u.cardId,
          card,
          total: 0,
          count: 0,
          avgTransaction: 0
        })
      }

      const spending = cardSpendingMap.get(u.cardId)!
      spending.total += u.amount
      spending.count += 1
    })

    cardSpendingMap.forEach(spending => {
      spending.avgTransaction = spending.total / spending.count
    })

    const cardSpending = Array.from(cardSpendingMap.values())
      .sort((a, b) => b.total - a.total)

    const categoryMap = new Map<string, CategorySpending>()
    currentPeriodUsage.forEach(u => {
      if (!categoryMap.has(u.category)) {
        categoryMap.set(u.category, {
          category: u.category,
          total: 0,
          count: 0,
          percentage: 0
        })
      }

      const cat = categoryMap.get(u.category)!
      cat.total += u.amount
      cat.count += 1
    })

    categoryMap.forEach(cat => {
      cat.percentage = currentTotal > 0 ? (cat.total / currentTotal) * 100 : 0
    })

    const categorySpending = Array.from(categoryMap.values())
      .sort((a, b) => b.total - a.total)

    const dailySpending = new Map<string, number>()
    currentPeriodUsage.forEach(u => {
      const date = new Date(u.date).toISOString().split('T')[0]
      dailySpending.set(date, (dailySpending.get(date) || 0) + u.amount)
    })

    const timeSeries: TimeSeriesPoint[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * oneDay)
      const dateStr = date.toISOString().split('T')[0]
      timeSeries.push({
        date: dateStr,
        amount: dailySpending.get(dateStr) || 0
      })
    }

    return {
      currentTotal,
      previousTotal,
      percentageChange,
      transactionCount: currentPeriodUsage.length,
      avgTransactionSize: currentPeriodUsage.length > 0 ? currentTotal / currentPeriodUsage.length : 0,
      cardSpending,
      categorySpending,
      timeSeries,
      mostUsedCard: cardSpending[0],
      topCategory: categorySpending[0]
    }
  }, [cards, usage])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getTrendIcon = () => {
    if (stats.percentageChange > 0) return <ArrowUp size={16} weight="bold" />
    if (stats.percentageChange < 0) return <ArrowDown size={16} weight="bold" />
    return <Minus size={16} weight="bold" />
  }

  const getTrendColor = () => {
    if (stats.percentageChange > 0) return 'text-destructive'
    if (stats.percentageChange < 0) return 'text-success'
    return 'text-muted-foreground'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spending (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.currentTotal)}</div>
            <div className={`flex items-center gap-1 text-sm mt-2 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="font-semibold">{Math.abs(stats.percentageChange).toFixed(1)}%</span>
              <span className="text-muted-foreground">vs last 30d</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.transactionCount}</div>
            <div className="text-sm text-muted-foreground mt-2">
              Last 30 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.avgTransactionSize)}</div>
            <div className="text-sm text-muted-foreground mt-2">
              Per transaction
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Most Used Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold truncate">
              {stats.mostUsedCard ? `•••• ${stats.mostUsedCard.card.last4}` : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground mt-2 truncate">
              {stats.mostUsedCard ? stats.mostUsedCard.card.label : 'No usage data'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cards">
            <CreditCard size={18} className="mr-2" />
            By Card
          </TabsTrigger>
          <TabsTrigger value="categories">
            <ChartBarHorizontal size={18} className="mr-2" />
            By Category
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <ChartLine size={18} className="mr-2" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={24} weight="duotone" />
                Spending by Card (Last 30 Days)
              </CardTitle>
              <CardDescription>
                Compare usage across your active payment cards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.cardSpending.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No spending data available for the last 30 days
                </div>
              ) : (
                stats.cardSpending.map((spending) => {
                  const percentage = stats.currentTotal > 0 
                    ? (spending.total / stats.currentTotal) * 100 
                    : 0

                  return (
                    <div key={spending.cardId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {spending.card.label}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {spending.card.bank} •••• {spending.card.last4}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold">{formatCurrency(spending.total)}</div>
                          <div className="text-xs text-muted-foreground">
                            {spending.count} transactions
                          </div>
                        </div>
                      </div>
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-accent rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{percentage.toFixed(1)}% of total</span>
                        <span>Avg: {formatCurrency(spending.avgTransaction)}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartBarHorizontal size={24} weight="duotone" />
                Spending by Category (Last 30 Days)
              </CardTitle>
              <CardDescription>
                See where your money is going
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.categorySpending.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No spending data available for the last 30 days
                </div>
              ) : (
                stats.categorySpending.map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{cat.category}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(cat.total)}</div>
                        <div className="text-xs text-muted-foreground">
                          {cat.count} transactions
                        </div>
                      </div>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-secondary rounded-full transition-all"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cat.percentage.toFixed(1)}% of total spending
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={24} weight="duotone" />
                Daily Spending Trend (Last 30 Days)
              </CardTitle>
              <CardDescription>
                Track your spending patterns over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="h-64 flex items-end justify-between gap-1">
                  {stats.timeSeries.map((point, idx) => {
                    const maxAmount = Math.max(...stats.timeSeries.map(p => p.amount), 1)
                    const heightPercent = (point.amount / maxAmount) * 100

                    return (
                      <div 
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-1 group relative"
                      >
                        <div className="absolute -top-8 hidden group-hover:block bg-popover border border-border rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                          <div className="font-semibold">{formatCurrency(point.amount)}</div>
                          <div className="text-muted-foreground">
                            {new Date(point.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        <div 
                          className="w-full bg-accent/80 hover:bg-accent rounded-t transition-all cursor-pointer"
                          style={{ 
                            height: `${heightPercent}%`,
                            minHeight: point.amount > 0 ? '4px' : '0px'
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {new Date(stats.timeSeries[0]?.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span>
                    {new Date(stats.timeSeries[stats.timeSeries.length - 1]?.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendUp size={24} weight="duotone" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.mostUsedCard && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
              <div className="p-2 rounded-lg bg-accent/10">
                <CreditCard size={20} className="text-accent" weight="duotone" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">Most Active Card</div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-mono">•••• {stats.mostUsedCard.card.last4}</span> was used{' '}
                  <span className="font-semibold text-foreground">{stats.mostUsedCard.count} times</span> totaling{' '}
                  <span className="font-semibold text-foreground">{formatCurrency(stats.mostUsedCard.total)}</span>
                </div>
              </div>
            </div>
          )}

          {stats.topCategory && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/5 border border-secondary/20">
              <div className="p-2 rounded-lg bg-secondary/10">
                <ChartBarHorizontal size={20} className="text-secondary" weight="duotone" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">Top Spending Category</div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{stats.topCategory.category}</span> accounts for{' '}
                  <span className="font-semibold text-foreground">{stats.topCategory.percentage.toFixed(1)}%</span> of your spending with{' '}
                  <span className="font-semibold text-foreground">{formatCurrency(stats.topCategory.total)}</span> total
                </div>
              </div>
            </div>
          )}

          {stats.percentageChange !== 0 && (
            <div className={`flex items-start gap-3 p-3 rounded-lg border ${
              stats.percentageChange > 0 
                ? 'bg-destructive/5 border-destructive/20' 
                : 'bg-success/5 border-success/20'
            }`}>
              <div className={`p-2 rounded-lg ${
                stats.percentageChange > 0 
                  ? 'bg-destructive/10' 
                  : 'bg-success/10'
              }`}>
                <TrendUp 
                  size={20} 
                  className={stats.percentageChange > 0 ? 'text-destructive' : 'text-success'} 
                  weight="duotone" 
                />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">Spending Trend</div>
                <div className="text-sm text-muted-foreground">
                  Your spending is{' '}
                  <span className={`font-semibold ${
                    stats.percentageChange > 0 ? 'text-destructive' : 'text-success'
                  }`}>
                    {stats.percentageChange > 0 ? 'up' : 'down'} {Math.abs(stats.percentageChange).toFixed(1)}%
                  </span>{' '}
                  compared to the previous 30 days
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
