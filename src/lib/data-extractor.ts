/**
 * 🚀 Next Level Data Extractor - Auto God Mode
 *
 * Advanced automatic data extraction system with:
 * - Structured data detection (tables, lists, forms, JSON)
 * - Automatic format conversion
 * - Smart categorization
 * - Multi-format export
 * - Real-time batch processing
 * - AI-powered context understanding
 */

export interface ExtractedData {
  id: string
  type: 'table' | 'list' | 'form' | 'json' | 'text' | 'code' | 'mixed'
  rawText: string
  structured?: StructuredData
  metadata: ExtractionMetadata
  confidence: number
  extractedAt: string
}

export interface StructuredData {
  tables?: TableData[]
  lists?: ListData[]
  forms?: FormData[]
  json?: Record<string, unknown>
  code?: CodeBlock[]
}

export interface TableData {
  headers: string[]
  rows: string[][]
  metadata?: {
    rowCount: number
    columnCount: number
    hasHeaders: boolean
  }
}

export interface ListData {
  items: string[]
  type: 'ordered' | 'unordered' | 'bulleted' | 'numbered'
  metadata?: {
    itemCount: number
    depth?: number
  }
}

export interface FormData {
  fields: Array<{
    label: string
    value: string
    type?: 'text' | 'email' | 'phone' | 'date' | 'number' | 'url'
  }>
}

export interface CodeBlock {
  language?: string
  code: string
  metadata?: {
    lineCount: number
    complexity?: 'simple' | 'medium' | 'complex'
  }
}

export interface ExtractionMetadata {
  sourceApp?: string
  timestamp: string
  categories: string[]
  tags: string[]
  entities?: Entity[]
  confidence: number
  processingTime: number
}

export interface Entity {
  type: 'person' | 'organization' | 'location' | 'date' | 'email' | 'phone' | 'url' | 'currency' | 'other'
  value: string
  confidence: number
}

export class DataExtractor {
  private godMode: boolean = false
  private autoDetect: boolean = true
  private batchSize: number = 10
  private processingQueue: string[] = []

  /**
   * Enable/disable God Mode
   */
  setGodMode(enabled: boolean) {
    this.godMode = enabled
    this.autoDetect = enabled
    this.batchSize = enabled ? 50 : 10
  }

  /**
   * Main extraction method - automatically detects and extracts structured data
   */
  async extract(text: string, metadata?: Partial<ExtractionMetadata>): Promise<ExtractedData> {
    const startTime = Date.now()
    const id = this.generateId()

    // Detect data type
    const type = this.autoDetect ? this.detectDataType(text) : 'text'

    // Extract structured data based on type
    const structured = await this.extractStructured(text, type)

    // Smart categorization
    const categories = this.categorize(text, structured)

    // Entity extraction
    const entities = this.extractEntities(text)

    // Auto-tagging
    const tags = this.autoTag(text, structured, entities)

    // Calculate confidence
    const confidence = this.calculateConfidence(text, structured, type)

    const processingTime = Date.now() - startTime

    return {
      id,
      type,
      rawText: text,
      structured,
      metadata: {
        timestamp: new Date().toISOString(),
        categories,
        tags,
        entities,
        confidence,
        processingTime,
        ...metadata
      },
      confidence
    }
  }

  /**
   * Detect the type of data in the text
   */
  private detectDataType(text: string): ExtractedData['type'] {
    // JSON detection
    if (this.isJSON(text)) return 'json'

    // Table detection
    if (this.isTable(text)) return 'table'

    // Code detection
    if (this.isCode(text)) return 'code'

    // List detection
    if (this.isList(text)) return 'list'

    // Form detection
    if (this.isForm(text)) return 'form'

    // Mixed content
    if (this.hasMultipleTypes(text)) return 'mixed'

    return 'text'
  }

  /**
   * Extract structured data based on detected type
   */
  private async extractStructured(
    text: string,
    type: ExtractedData['type']
  ): Promise<StructuredData | undefined> {
    if (!this.godMode && type === 'text') return undefined

    const structured: StructuredData = {}

    switch (type) {
      case 'table':
        structured.tables = this.extractTables(text)
        break
      case 'list':
        structured.lists = this.extractLists(text)
        break
      case 'form':
        structured.forms = this.extractForms(text)
        break
      case 'json':
        structured.json = this.parseJSON(text)
        break
      case 'code':
        structured.code = this.extractCodeBlocks(text)
        break
      case 'mixed':
        structured.tables = this.extractTables(text)
        structured.lists = this.extractLists(text)
        structured.forms = this.extractForms(text)
        structured.code = this.extractCodeBlocks(text)
        break
    }

    return Object.keys(structured).length > 0 ? structured : undefined
  }

  /**
   * Extract tables from text
   */
  private extractTables(text: string): TableData[] {
    const tables: TableData[] = []
    const lines = text.split('\n').filter(line => line.trim())

    // Detect table patterns
    const tablePatterns = [
      /^[\s]*\|.*\|[\s]*$/, // Markdown table
      /^[\s]*\+.*\+[\s]*$/, // ASCII table
      /[\t]+/, // Tab-separated
    ]

    let currentTable: string[] = []
    let headers: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const isTableRow = tablePatterns.some(pattern => pattern.test(line))

      if (isTableRow) {
        // Parse markdown table
        if (line.includes('|')) {
          const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell)
          if (cells.length > 0) {
            if (i === 0 || headers.length === 0) {
              headers = cells
            } else {
              currentTable.push(cells.join('|'))
            }
          }
        }
        // Parse tab-separated
        else if (line.includes('\t')) {
          const cells = line.split('\t').map(cell => cell.trim())
          if (cells.length > 0) {
            if (i === 0 || headers.length === 0) {
              headers = cells
            } else {
              currentTable.push(cells.join('\t'))
            }
          }
        }
      } else {
        // End of table, save it
        if (currentTable.length > 0 && headers.length > 0) {
          const rows = currentTable.map(row => {
            if (row.includes('|')) return row.split('|').map(cell => cell.trim())
            if (row.includes('\t')) return row.split('\t')
            return [row]
          })

          tables.push({
            headers,
            rows,
            metadata: {
              rowCount: rows.length,
              columnCount: headers.length,
              hasHeaders: true
            }
          })

          currentTable = []
          headers = []
        }
      }
    }

    // Save last table if exists
    if (currentTable.length > 0 && headers.length > 0) {
      const rows = currentTable.map(row => {
        if (row.includes('|')) return row.split('|').map(cell => cell.trim())
        if (row.includes('\t')) return row.split('\t')
        return [row]
      })

      tables.push({
        headers,
        rows,
        metadata: {
          rowCount: rows.length,
          columnCount: headers.length,
          hasHeaders: true
        }
      })
    }

    return tables
  }

  /**
   * Extract lists from text
   */
  private extractLists(text: string): ListData[] {
    const lists: ListData[] = []
    const lines = text.split('\n')

    let currentList: string[] = []
    let listType: ListData['type'] = 'unordered'

    for (const line of lines) {
      const trimmed = line.trim()

      // Ordered list (1., 2., etc.)
      if (/^\d+[.)]\s+/.test(trimmed)) {
        if (currentList.length > 0 && listType !== 'ordered') {
          lists.push({
            items: [...currentList],
            type: listType,
            metadata: { itemCount: currentList.length }
          })
          currentList = []
        }
        listType = 'ordered'
        currentList.push(trimmed.replace(/^\d+[.)]\s+/, ''))
      }
      // Bulleted list (-, *, •)
      else if (/^[-*•]\s+/.test(trimmed)) {
        if (currentList.length > 0 && listType !== 'bulleted') {
          lists.push({
            items: [...currentList],
            type: listType,
            metadata: { itemCount: currentList.length }
          })
          currentList = []
        }
        listType = 'bulleted'
        currentList.push(trimmed.replace(/^[-*•]\s+/, ''))
      }
      // Continue current list item (indented)
      else if (currentList.length > 0 && /^\s{2,}/.test(trimmed)) {
        const lastIndex = currentList.length - 1
        currentList[lastIndex] += ' ' + trimmed.trim()
      }
      // End of list
      else if (currentList.length > 0) {
        lists.push({
          items: [...currentList],
          type: listType,
          metadata: { itemCount: currentList.length }
        })
        currentList = []
      }
    }

    // Save last list
    if (currentList.length > 0) {
      lists.push({
        items: currentList,
        type: listType,
        metadata: { itemCount: currentList.length }
      })
    }

    return lists
  }

  /**
   * Extract form data from text
   */
  private extractForms(text: string): FormData[] {
    const forms: FormData[] = []
    const lines = text.split('\n')

    const fieldPatterns = [
      /^([^:]+):\s*(.+)$/, // Label: Value
      /^([^=]+)=\s*(.+)$/, // Label=Value
      /^([A-Z][^:]+):\s*(.+)$/i, // Capitalized label: value
    ]

    const fields: FormData['fields'] = []

    for (const line of lines) {
      for (const pattern of fieldPatterns) {
        const match = line.match(pattern)
        if (match) {
          const label = match[1].trim()
          const value = match[2].trim()
          const type = this.detectFieldType(label, value)

          fields.push({ label, value, type })
          break
        }
      }
    }

    if (fields.length > 0) {
      forms.push({ fields })
    }

    return forms
  }

  /**
   * Extract code blocks
   */
  private extractCodeBlocks(text: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = []

    // Markdown code blocks
    const markdownPattern = /```(\w+)?\n([\s\S]*?)```/g
    let match
    while ((match = markdownPattern.exec(text)) !== null) {
      codeBlocks.push({
        language: match[1] || 'unknown',
        code: match[2],
        metadata: {
          lineCount: match[2].split('\n').length,
          complexity: this.assessComplexity(match[2])
        }
      })
    }

    // Inline code patterns
    if (codeBlocks.length === 0) {
      const codePattern = /`([^`]+)`/g
      while ((match = codePattern.exec(text)) !== null) {
        codeBlocks.push({
          language: 'inline',
          code: match[1],
          metadata: {
            lineCount: 1,
            complexity: 'simple'
          }
        })
      }
    }

    return codeBlocks
  }

  /**
   * Smart categorization
   */
  private categorize(text: string, structured?: StructuredData): string[] {
    const categories: string[] = []

    // Content-based categories
    if (structured?.tables && structured.tables.length > 0) {
      categories.push('data-table')
    }
    if (structured?.lists && structured.lists.length > 0) {
      categories.push('list')
    }
    if (structured?.forms && structured.forms.length > 0) {
      categories.push('form-data')
    }
    if (structured?.code && structured.code.length > 0) {
      categories.push('code')
    }
    if (structured?.json) {
      categories.push('json-data')
    }

    // Semantic categories
    const lowerText = text.toLowerCase()

    if (this.containsEmail(lowerText)) categories.push('contact')
    if (this.containsPhone(lowerText)) categories.push('contact')
    if (this.containsURL(lowerText)) categories.push('web-resource')
    if (this.containsDate(lowerText)) categories.push('temporal')
    if (this.containsCurrency(lowerText)) categories.push('financial')
    if (this.containsCode(lowerText)) categories.push('technical')

    return [...new Set(categories)]
  }

  /**
   * Extract entities (emails, phones, dates, etc.)
   */
  private extractEntities(text: string): Entity[] {
    const entities: Entity[] = []

    // Email
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    let match
    while ((match = emailPattern.exec(text)) !== null) {
      entities.push({
        type: 'email',
        value: match[0],
        confidence: 0.95
      })
    }

    // Phone
    const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
    while ((match = phonePattern.exec(text)) !== null) {
      entities.push({
        type: 'phone',
        value: match[0],
        confidence: 0.85
      })
    }

    // URL
    const urlPattern = /https?:\/\/[^\s]+/g
    while ((match = urlPattern.exec(text)) !== null) {
      entities.push({
        type: 'url',
        value: match[0],
        confidence: 0.9
      })
    }

    // Date
    const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g
    while ((match = datePattern.exec(text)) !== null) {
      entities.push({
        type: 'date',
        value: match[0],
        confidence: 0.8
      })
    }

    // Currency
    const currencyPattern = /\$[\d,]+(\.\d{2})?/g
    while ((match = currencyPattern.exec(text)) !== null) {
      entities.push({
        type: 'currency',
        value: match[0],
        confidence: 0.9
      })
    }

    return entities
  }

  /**
   * Auto-tagging based on content
   */
  private autoTag(
    text: string,
    structured?: StructuredData,
    entities?: Entity[]
  ): string[] {
    const tags: string[] = []

    // Structure-based tags
    if (structured?.tables) tags.push('table')
    if (structured?.lists) tags.push('list')
    if (structured?.forms) tags.push('form')
    if (structured?.code) tags.push('code')
    if (structured?.json) tags.push('json')

    // Entity-based tags
    if (entities) {
      entities.forEach(entity => {
        if (!tags.includes(entity.type)) {
          tags.push(entity.type)
        }
      })
    }

    // Content-based tags
    const lowerText = text.toLowerCase()
    const keywords = {
      'invoice': ['invoice', 'bill', 'receipt'],
      'contact': ['email', 'phone', 'address'],
      'technical': ['code', 'api', 'function', 'class'],
      'financial': ['price', 'cost', 'payment', 'total'],
      'date': ['date', 'time', 'schedule', 'deadline']
    }

    Object.entries(keywords).forEach(([tag, words]) => {
      if (words.some(word => lowerText.includes(word))) {
        tags.push(tag)
      }
    })

    return [...new Set(tags)]
  }

  /**
   * Calculate extraction confidence
   */
  private calculateConfidence(
    text: string,
    structured?: StructuredData,
    type: ExtractedData['type']
  ): number {
    let confidence = 0.5

    // Base confidence on structure detection
    if (structured) {
      if (structured.tables && structured.tables.length > 0) confidence += 0.2
      if (structured.lists && structured.lists.length > 0) confidence += 0.15
      if (structured.forms && structured.forms.length > 0) confidence += 0.15
      if (structured.code && structured.code.length > 0) confidence += 0.1
      if (structured.json) confidence += 0.2
    }

    // Confidence based on type
    if (type !== 'text') confidence += 0.1

    // Text quality
    if (text.length > 50) confidence += 0.1
    if (text.length > 200) confidence += 0.05

    return Math.min(confidence, 1.0)
  }

  // Helper methods
  private isJSON(text: string): boolean {
    try {
      JSON.parse(text.trim())
      return true
    } catch {
      return false
    }
  }

  private parseJSON(text: string): Record<string, unknown> | undefined {
    try {
      return JSON.parse(text.trim()) as Record<string, unknown>
    } catch {
      return undefined
    }
  }

  private isTable(text: string): boolean {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return false

    const tableIndicators = [
      lines.some(line => line.includes('|') && line.split('|').length >= 3),
      lines.some(line => line.includes('\t') && line.split('\t').length >= 2),
      lines.some(line => /^[\s]*\+.*\+[\s]*$/.test(line))
    ]

    return tableIndicators.some(indicator => indicator)
  }

  private isList(text: string): boolean {
    const listPatterns = [
      /^\d+[\.\)]\s+/,
      /^[-*•]\s+/,
      /^[\s]*[•◦▪▫]\s+/
    ]

    const lines = text.split('\n')
    const listLines = lines.filter(line =>
      listPatterns.some(pattern => pattern.test(line.trim()))
    )

    return listLines.length >= 2 || (listLines.length === 1 && lines.length <= 3)
  }

  private isForm(text: string): boolean {
    const fieldPatterns = [
      /^[^:]+:\s*.+$/,
      /^[^=]+=\s*.+$/
    ]

    const lines = text.split('\n')
    const formLines = lines.filter(line =>
      fieldPatterns.some(pattern => pattern.test(line.trim()))
    )

    return formLines.length >= 2
  }

  private isCode(text: string): boolean {
    return /```[\s\S]*```/.test(text) || /`[^`]+`/.test(text) ||
           /function\s+\w+/.test(text) || /class\s+\w+/.test(text) ||
           /import\s+/.test(text) || /const\s+\w+\s*=/.test(text)
  }

  private hasMultipleTypes(text: string): boolean {
    const types = [
      this.isTable(text),
      this.isList(text),
      this.isForm(text),
      this.isCode(text),
      this.isJSON(text)
    ]

    return types.filter(Boolean).length >= 2
  }

  private detectFieldType(label: string, value: string): FormData['fields'][0]['type'] {
    const lowerLabel = label.toLowerCase()
    if (lowerLabel.includes('email') || /^[^\s]+@[^\s]+\.[^\s]+$/.test(value)) {
      return 'email'
    }
    if (lowerLabel.includes('phone') || /[\d\-()\s]{10,}/.test(value)) {
      return 'phone'
    }
    if (lowerLabel.includes('date') || /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(value)) {
      return 'date'
    }
    if (lowerLabel.includes('url') || /^https?:\/\//.test(value)) {
      return 'url'
    }
    if (/^\d+(\.\d+)?$/.test(value)) {
      return 'number'
    }

    return 'text'
  }

  private assessComplexity(code: string): CodeBlock['metadata']['complexity'] {
    const lines = code.split('\n').length
    const hasFunctions = /function|def|fn\s+\w+/.test(code)
    const hasClasses = /class\s+\w+/.test(code)
    const hasLoops = /for\s*\(|while\s*\(|forEach/.test(code)
    // const hasConditionals = /if\s*\(|switch\s*\(/.test(code)

    if (lines > 100 || (hasClasses && hasFunctions && hasLoops)) {
      return 'complex'
    }
    if (lines > 20 || hasFunctions || hasLoops) {
      return 'medium'
    }
    return 'simple'
  }

  private containsEmail(text: string): boolean {
    return /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)
  }

  private containsPhone(text: string): boolean {
    return /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)
  }

  private containsURL(text: string): boolean {
    return /https?:\/\/[^\s]+/.test(text)
  }

  private containsDate(text: string): boolean {
    return /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(text)
  }

  private containsCurrency(text: string): boolean {
    return /\$[\d,]+(\.\d{2})?/.test(text)
  }

  private containsCode(text: string): boolean {
    return /function|class|import|const\s+\w+\s*=|def\s+\w+/.test(text)
  }

  private generateId(): string {
    return `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Export extracted data to various formats
   */
  exportToFormat(data: ExtractedData, format: 'csv' | 'json' | 'markdown' | 'xml'): string {
    switch (format) {
      case 'csv':
        return this.exportToCSV(data)
      case 'json':
        return this.exportToJSON(data)
      case 'markdown':
        return this.exportToMarkdown(data)
      case 'xml':
        return this.exportToXML(data)
      default:
        return data.rawText
    }
  }

  private exportToCSV(data: ExtractedData): string {
    if (data.structured?.tables && data.structured.tables.length > 0) {
      const table = data.structured.tables[0]
      const rows = [table.headers.join(',')]
      table.rows.forEach(row => {
        rows.push(row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      })
      return rows.join('\n')
    }
    return data.rawText
  }

  private exportToJSON(data: ExtractedData): string {
    return JSON.stringify(data, null, 2)
  }

  private exportToMarkdown(data: ExtractedData): string {
    let md = `# Extracted Data\n\n`

    if (data.structured?.tables) {
      data.structured.tables.forEach(table => {
        md += `\n## Table\n\n`
        md += `| ${table.headers.join(' | ')} |\n`
        md += `| ${table.headers.map(() => '---').join(' | ')} |\n`
        table.rows.forEach(row => {
          md += `| ${row.join(' | ')} |\n`
        })
      })
    }

    if (data.structured?.lists) {
      data.structured.lists.forEach((list, idx) => {
        md += `\n## List ${idx + 1}\n\n`
        list.items.forEach(item => {
          md += `- ${item}\n`
        })
      })
    }

    if (data.structured?.forms) {
      data.structured.forms.forEach((form, idx) => {
        md += `\n## Form ${idx + 1}\n\n`
        form.fields.forEach(field => {
          md += `**${field.label}**: ${field.value}\n`
        })
      })
    }

    return md
  }

  private exportToXML(data: ExtractedData): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<extractedData>\n`
    xml += `  <type>${data.type}</type>\n`
    xml += `  <rawText><![CDATA[${data.rawText}]]></rawText>\n`

    if (data.structured?.tables) {
      xml += `  <tables>\n`
      data.structured.tables.forEach(table => {
        xml += `    <table>\n`
        xml += `      <headers>${table.headers.join(',')}</headers>\n`
        xml += `      <rows>\n`
        table.rows.forEach(row => {
          xml += `        <row>${row.join(',')}</row>\n`
        })
        xml += `      </rows>\n`
        xml += `    </table>\n`
      })
      xml += `  </tables>\n`
    }

    xml += `</extractedData>`
    return xml
  }

  /**
   * Batch process multiple texts
   */
  async batchExtract(texts: string[]): Promise<ExtractedData[]> {
    const results: ExtractedData[] = []

    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize)
      const batchResults = await Promise.all(
        batch.map(text => this.extract(text))
      )
      results.push(...batchResults)
    }

    return results
  }
}

// Export singleton instance
export const dataExtractor = new DataExtractor()
