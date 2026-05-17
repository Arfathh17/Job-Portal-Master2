class AFAISessionStore {
  constructor() {
    this.sessions = new Map();
  }

  get(sessionId) {
    return this.sessions.get(sessionId);
  }

  set(sessionId, session) {
    this.sessions.set(sessionId, session);
    return session;
  }

  delete(sessionId) {
    return this.sessions.delete(sessionId);
  }

  entries() {
    return this.sessions.entries();
  }

  [Symbol.iterator]() {
    return this.sessions[Symbol.iterator]();
  }
}

module.exports = new AFAISessionStore();
