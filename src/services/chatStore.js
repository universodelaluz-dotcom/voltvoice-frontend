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

  // === WRITE METHODS (called by TikTokLivePanel) ===

  addMessage(msg) {
    this.messages.push({
      user: msg.user || msg.username || 'unknown',
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

  // === ACTION METHODS (called by Bot tools, execute via TikTokLivePanel callbacks) ===

  async banUser(username) {
    try {
      const res = await fetch(`${API_URL}/api/bans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, reason: 'Banned by AI assistant' })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      this.bannedUsers.add(username)

      // Notify UI
      if (this._actionCallbacks.onBan) {
        this._actionCallbacks.onBan(username)
      }
      return { success: true, message: `Usuario "${username}" baneado del chat` }
    } catch (err) {
      return { success: false, message: `Error al banear: ${err.message}` }
    }
  }

  async unbanUser(username) {
    try {
      const res = await fetch(`${API_URL}/api/bans/${username}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      this.bannedUsers.delete(username)

      if (this._actionCallbacks.onUnban) {
        this._actionCallbacks.onUnban(username)
      }
      return { success: true, message: `Usuario "${username}" desbaneado` }
    } catch (err) {
      return { success: false, message: `Error al desbanear: ${err.message}` }
    }
  }

  highlightUser(username, color = '#06b6d4') {
    this.highlightedUsers[username] = color
    if (this._actionCallbacks.onHighlight) {
      this._actionCallbacks.onHighlight(username, color)
    }
    return { success: true, message: `Usuario "${username}" resaltado con color ${color}` }
  }

  removeHighlight(username) {
    delete this.highlightedUsers[username]
    if (this._actionCallbacks.onRemoveHighlight) {
      this._actionCallbacks.onRemoveHighlight(username)
    }
    return { success: true, message: `Resaltado de "${username}" removido` }
  }

  async setNickname(username, nickname) {
    try {
      const res = await fetch(`${API_URL}/api/nicks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, newNickname: nickname })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      this.nickOverrides[username] = nickname

      if (this._actionCallbacks.onSetNick) {
        this._actionCallbacks.onSetNick(username, nickname)
      }
      return { success: true, message: `Apodo de "${username}" cambiado a "${nickname}"` }
    } catch (err) {
      return { success: false, message: `Error al cambiar apodo: ${err.message}` }
    }
  }
}

const chatStore = new ChatStore()
export default chatStore
