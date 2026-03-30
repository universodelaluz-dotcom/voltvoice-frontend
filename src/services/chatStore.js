/**
 * Chat Store — shared state between TikTokLivePanel and Bot
 * TikTokLivePanel writes messages here, Bot reads and executes actions.
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'
const getAuthToken = () => localStorage.getItem('sv-token') || ''

class ChatStore {
  constructor() {
    this.messages = []        // Recent chat messages
    this.maxMessages = 200    // Keep last 200 messages
    this.bannedUsers = new Set()
    this.highlightedUsers = {}
    this.nickOverrides = {}

    // Callbacks registered by TikTokLivePanel to execute UI actions
    this._actionCallbacks = {}
  }

  _normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '')
  }

  _tokenize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9._-\s]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  }

  _scoreReferenceMatch(reference, username, nickname = '') {
    const normalizedRef = this._normalize(reference)
    const normalizedUser = this._normalize(username)
    const normalizedNick = this._normalize(nickname)
    if (!normalizedRef) return 0

    let score = 0
    if (normalizedUser === normalizedRef || normalizedNick === normalizedRef) score += 100
    if (normalizedUser.startsWith(normalizedRef) || normalizedNick.startsWith(normalizedRef)) score += 65
    if (normalizedUser.includes(normalizedRef) || normalizedNick.includes(normalizedRef)) score += 45
    if (normalizedRef.includes(normalizedUser) || normalizedRef.includes(normalizedNick)) score += 35

    const refTokens = this._tokenize(reference)
    const userTokens = this._tokenize(username)
    const nickTokens = this._tokenize(nickname)
    for (const token of refTokens) {
      if (userTokens.includes(token) || nickTokens.includes(token)) {
        score += 20
      }
    }

    return score
  }

  resolveUserReferenceDetailed(reference) {
    const normalizedRef = this._normalize(reference)
    if (!normalizedRef) {
      return { confidence: 'none', match: null, candidates: [] }
    }

    const seen = new Map()
    for (const message of [...this.messages].reverse()) {
      const username = message.user || ''
      const nickname = message.nickname || this.nickOverrides[username] || ''
      if (!username || seen.has(username)) continue

      const score = this._scoreReferenceMatch(reference, username, nickname)
      if (score <= 0) continue

      seen.set(username, {
        username,
        nickname: nickname || username,
        score,
        lastMessageAt: message.timestamp || 0
      })
    }

    const candidates = [...seen.values()].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.lastMessageAt - a.lastMessageAt
    })

    if (!candidates.length) {
      return { confidence: 'none', match: null, candidates: [] }
    }

    const best = candidates[0]
    const second = candidates[1]
    const confidence = best.score >= 90
      ? 'high'
      : best.score >= 55 && (!second || best.score - second.score >= 15)
        ? 'medium'
        : 'low'

    return {
      confidence,
      match: best,
      candidates: candidates.slice(0, 5)
    }
  }

  resolveUserReference(reference) {
    const resolution = this.resolveUserReferenceDetailed(reference)
    if (resolution.match) {
      return {
        username: resolution.match.username,
        nickname: resolution.match.nickname,
        confidence: resolution.confidence,
        candidates: resolution.candidates
      }
    }

    return {
      username: reference,
      nickname: reference,
      confidence: 'none',
      candidates: []
    }
  }

  // === WRITE METHODS (called by TikTokLivePanel) ===

  addMessage(msg) {
    this.messages.push({
      user: msg.user || msg.username || 'unknown',
      nickname: msg.nickname || '',
      text: msg.text || msg.comment || '',
      timestamp: msg.timestamp || Date.now(),
      isModerator: msg.isModerator || false,
      isSubscriber: msg.isSubscriber || false,
      isTopGifter: msg.isTopGifter || false,
      isDonor: msg.isDonor || false,
      isQuestion: msg.isQuestion || false
    })

    // Trim to max
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages)
    }
  }

  syncBannedUsers(bannedSet) {
    this.bannedUsers = new Set(bannedSet)
  }

  syncHighlightedUsers(highlightedObj) {
    this.highlightedUsers = { ...highlightedObj }
  }

  syncNickOverrides(nicksObj) {
    this.nickOverrides = { ...nicksObj }
  }

  registerAction(name, callback) {
    this._actionCallbacks[name] = callback
  }

  // === READ METHODS (called by Bot tools) ===

  getRecentMessages(count = 20) {
    return this.messages.slice(-count)
  }

  searchMessages(keyword, count = 20) {
    const lower = keyword.toLowerCase()
    return this.messages
      .filter(m => m.text.toLowerCase().includes(lower) || m.user.toLowerCase().includes(lower))
      .slice(-count)
  }

  getQuestions(count = 10) {
    return this.messages
      .filter(m => m.isQuestion)
      .slice(-count)
  }

  getActiveUsers(minutes = 5) {
    const since = Date.now() - (minutes * 60 * 1000)
    const users = {}
    this.messages
      .filter(m => m.timestamp >= since)
      .forEach(m => {
        users[m.user] = (users[m.user] || 0) + 1
      })
    return Object.entries(users)
      .sort((a, b) => b[1] - a[1])
      .map(([user, count]) => ({ user, messageCount: count }))
  }

  getUserMessages(username, count = 10) {
    const lower = username.toLowerCase()
    return this.messages
      .filter(m => m.user.toLowerCase().includes(lower))
      .slice(-count)
  }

  getChatStats() {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000
    const recentMsgs = this.messages.filter(m => m.timestamp >= fiveMinAgo)
    const uniqueUsers = new Set(recentMsgs.map(m => m.user))
    return {
      totalMessages: this.messages.length,
      recentMessages: recentMsgs.length,
      activeUsers: uniqueUsers.size,
      bannedCount: this.bannedUsers.size,
      highlightedCount: Object.keys(this.highlightedUsers).length
    }
  }

  getUserActivitySummary(minutes = 5) {
    const since = Date.now() - (minutes * 60 * 1000)
    const summary = new Map()
    for (const message of this.messages.filter((m) => m.timestamp >= since)) {
      const key = message.user
      if (!summary.has(key)) {
        summary.set(key, {
          username: message.user,
          nickname: message.nickname || this.nickOverrides[message.user] || message.user,
          messageCount: 0,
          recentMessages: [],
          positiveScore: 0,
          negativeScore: 0,
          funnyScore: 0
        })
      }

      const item = summary.get(key)
      item.messageCount += 1
      item.recentMessages.push(message.text)

      const text = String(message.text || '').toLowerCase()
      if (/(gracias|hermosa|linda|bonita|amor|jaja|jajaja|jajajja|xd|jeje|genial|buena onda|te amo|apoyo|bella|simpatica|simpatico)/i.test(text)) {
        item.positiveScore += 1
      }
      if (/(odio|callate|pendej|imbecil|menso|mensa|asco|morbo|feo|fea|hueva|vete|largarte|lárgate|esclavizando|pioj)/i.test(text)) {
        item.negativeScore += 1
      }
      if (/(jaja|jajaja|jajajja|xd|jeje|🤣|😂|achis)/i.test(text)) {
        item.funnyScore += 1
      }
    }

    return [...summary.values()].sort((a, b) => b.messageCount - a.messageCount)
  }

  findGroundedChatAnswer(kind, options = {}) {
    const users = this.getUserActivitySummary(options.minutes || 10)
    if (!users.length) {
      return null
    }

    switch (kind) {
      case 'most_active': {
        const top = users[0]
        return {
          text: `La persona mas activa del chat en los ultimos ${options.minutes || 10} minutos es ${top.nickname} con ${top.messageCount} mensajes.`,
          grounded: true
        }
      }
      case 'nicest_user': {
        const ranked = [...users]
          .filter((u) => u.positiveScore > 0)
          .sort((a, b) => (b.positiveScore - a.positiveScore) || (b.messageCount - a.messageCount))
        if (!ranked.length) return null
        const top = ranked[0]
        return {
          text: `Diria que ${top.nickname} se ve de las personas mas buena onda del chat ahorita. Ha dejado ${top.messageCount} mensajes y varios suenan positivos o amigables.`,
          grounded: true
        }
      }
      case 'most_negative_user': {
        const ranked = [...users]
          .filter((u) => u.negativeScore > 0)
          .sort((a, b) => (b.negativeScore - a.negativeScore) || (b.messageCount - a.messageCount))
        if (!ranked.length) return null
        const top = ranked[0]
        return {
          text: `La persona que mas se ve tirando mala vibra ahorita es ${top.nickname}. Lo digo por el tono de varios de sus mensajes recientes.`,
          grounded: true
        }
      }
      case 'funniest_user': {
        const ranked = [...users]
          .filter((u) => u.funnyScore > 0)
          .sort((a, b) => (b.funnyScore - a.funnyScore) || (b.messageCount - a.messageCount))
        if (!ranked.length) return null
        const top = ranked[0]
        return {
          text: `La persona que mas vibra de cotorreo trae ahorita es ${top.nickname}. Se nota por sus mensajes y el tono relajado que ha estado dejando.`,
          grounded: true
        }
      }
      default:
        return null
    }
  }

  // === ACTION METHODS (called by Bot tools, execute via TikTokLivePanel callbacks) ===

  async banUser(username) {
    try {
      const resolved = this.resolveUserReference(username)
      const targetUsername = resolved?.username || username
      const res = await fetch(`${API_URL}/api/bans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: targetUsername, reason: 'Banned by AI assistant' })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      this.bannedUsers.add(targetUsername)

      // Notify UI
      if (this._actionCallbacks.onBan) {
        this._actionCallbacks.onBan(targetUsername)
      }
      return { success: true, message: `Usuario "${resolved?.nickname || targetUsername}" baneado del chat`, username: targetUsername, nickname: resolved?.nickname || targetUsername }
    } catch (err) {
      return { success: false, message: `Error al banear: ${err.message}` }
    }
  }

  async unbanUser(username) {
    try {
      const resolved = this.resolveUserReference(username)
      const targetUsername = resolved?.username || username
      const res = await fetch(`${API_URL}/api/bans/${targetUsername}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      this.bannedUsers.delete(targetUsername)

      if (this._actionCallbacks.onUnban) {
        this._actionCallbacks.onUnban(targetUsername)
      }
      return { success: true, message: `Usuario "${resolved?.nickname || targetUsername}" desbaneado`, username: targetUsername, nickname: resolved?.nickname || targetUsername }
    } catch (err) {
      return { success: false, message: `Error al desbanear: ${err.message}` }
    }
  }

  highlightUser(username, color = '#06b6d4') {
    const resolved = this.resolveUserReference(username)
    const targetUsername = resolved?.username || username
    this.highlightedUsers[targetUsername] = color
    if (this._actionCallbacks.onHighlight) {
      this._actionCallbacks.onHighlight(targetUsername, color)
    }
    return { success: true, message: `Usuario "${resolved?.nickname || targetUsername}" resaltado con color ${color}`, username: targetUsername, nickname: resolved?.nickname || targetUsername }
  }

  removeHighlight(username) {
    const resolved = this.resolveUserReference(username)
    const targetUsername = resolved?.username || username
    delete this.highlightedUsers[targetUsername]
    if (this._actionCallbacks.onRemoveHighlight) {
      this._actionCallbacks.onRemoveHighlight(targetUsername)
    }
    return { success: true, message: `Resaltado de "${resolved?.nickname || targetUsername}" removido`, username: targetUsername, nickname: resolved?.nickname || targetUsername }
  }

  async setNickname(username, nickname) {
    try {
      const resolved = this.resolveUserReference(username)
      const targetUsername = resolved?.username || username
      const res = await fetch(`${API_URL}/api/nicks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: targetUsername, newNickname: nickname })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      this.nickOverrides[targetUsername] = nickname

      if (this._actionCallbacks.onSetNick) {
        this._actionCallbacks.onSetNick(targetUsername, nickname)
      }
      return { success: true, message: `Apodo de "${resolved?.nickname || targetUsername}" cambiado a "${nickname}"`, username: targetUsername, nickname: resolved?.nickname || targetUsername }
    } catch (err) {
      return { success: false, message: `Error al cambiar apodo: ${err.message}` }
    }
  }
}

const chatStore = new ChatStore()
export default chatStore
