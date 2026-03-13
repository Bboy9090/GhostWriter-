const toggle = document.getElementById('toggle')
const status = document.getElementById('status')
const statusText = document.getElementById('statusText')
const entriesEmpty = document.getElementById('entriesEmpty')
const entriesList = document.getElementById('entriesList')
const openVault = document.getElementById('openVault')
const clear = document.getElementById('clear')

const STORAGE_KEY = 'ghostwriter-portal-active'
const ENTRIES_KEY = 'ghostwriter-portal-entries'

let isActive = false
let entries = []

async function loadState() {
  const { [STORAGE_KEY]: active } = await chrome.storage.local.get(STORAGE_KEY)
  const { [ENTRIES_KEY]: stored } = await chrome.storage.local.get(ENTRIES_KEY)
  isActive = active ?? false
  entries = stored ?? []
  render()
}

function saveState() {
  chrome.storage.local.set({ [STORAGE_KEY]: isActive })
}

function saveEntries() {
  chrome.storage.local.set({ [ENTRIES_KEY]: entries.slice(-200) })
}

function render() {
  toggle.setAttribute('aria-pressed', String(isActive))
  toggle.querySelector('.toggle-label').textContent = isActive ? 'Stop capture' : 'Start capture'
  status.classList.toggle('active', isActive)
  statusText.textContent = isActive ? 'Capturing...' : 'Inactive'

  if (entries.length === 0) {
    entriesEmpty.classList.remove('hidden')
    entriesList.innerHTML = ''
  } else {
    entriesEmpty.classList.add('hidden')
    entriesList.innerHTML = entries.map((e) => `
      <li>
        <div class="time">${e.time || ''}</div>
        <div class="text">${escapeHtml((e.text || '').slice(0, 200))}${(e.text || '').length > 200 ? '…' : ''}</div>
      </li>
    `).join('')
  }
}

function escapeHtml(s) {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

toggle.addEventListener('click', async () => {
  isActive = !isActive
  saveState()
  render()
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE', active: isActive }).catch(() => {})
  }
})

openVault.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://ghostwriter.vercel.app' })
})

clear.addEventListener('click', () => {
  entries = []
  saveEntries()
  render()
})

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'ENTRY' && msg.text) {
    entries.push({ text: msg.text, time: new Date().toLocaleTimeString() })
    saveEntries()
    render()
  }
})

loadState()
