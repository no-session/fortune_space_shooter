export default class ChatBox {
  constructor() {
    this.minimized = true;
    this.pollInterval = null;
    this.messages = [];
    this.createDOM();
    this.startPolling();
  }

  createDOM() {
    // Container
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      width: '300px',
      zIndex: '10000',
      fontFamily: 'monospace',
      fontSize: '13px',
      borderRadius: '6px',
      overflow: 'hidden',
      border: '2px solid #00cccc',
      boxShadow: '0 0 15px rgba(0,204,204,0.3)',
      background: '#0a0a1a'
    });

    // Header
    this.header = document.createElement('div');
    Object.assign(this.header.style, {
      background: '#111133',
      color: '#00ffff',
      padding: '8px 12px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      userSelect: 'none',
      borderBottom: '1px solid #00cccc'
    });
    this.headerTitle = document.createElement('span');
    this.headerTitle.textContent = '\u{1F4AC} Chat with Papa';
    this.headerToggle = document.createElement('span');
    this.headerToggle.textContent = '\u25B2';
    this.headerToggle.style.fontSize = '10px';
    this.header.appendChild(this.headerTitle);
    this.header.appendChild(this.headerToggle);
    this.header.addEventListener('click', () => this.toggle());
    this.container.appendChild(this.header);

    // Body (messages + input)
    this.body = document.createElement('div');
    this.body.style.display = 'none';
    this.container.appendChild(this.body);

    // Message area
    this.messageArea = document.createElement('div');
    Object.assign(this.messageArea.style, {
      height: '180px',
      overflowY: 'auto',
      padding: '8px',
      background: '#050510'
    });
    this.body.appendChild(this.messageArea);

    // Input row
    const inputRow = document.createElement('div');
    Object.assign(inputRow.style, {
      display: 'flex',
      borderTop: '1px solid #333'
    });

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'Type a message...';
    this.input.maxLength = 200;
    Object.assign(this.input.style, {
      flex: '1',
      background: '#0a0a1a',
      color: '#ffffff',
      border: 'none',
      padding: '8px',
      fontFamily: 'monospace',
      fontSize: '13px',
      outline: 'none'
    });
    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && this.input.value.trim()) {
        this.sendMessage(this.input.value.trim());
      }
    });
    // Prevent game from receiving key events
    this.input.addEventListener('keyup', (e) => e.stopPropagation());
    this.input.addEventListener('keypress', (e) => e.stopPropagation());

    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'Send';
    Object.assign(sendBtn.style, {
      background: '#00cccc',
      color: '#000',
      border: 'none',
      padding: '8px 12px',
      fontFamily: 'monospace',
      fontSize: '13px',
      cursor: 'pointer',
      fontWeight: 'bold'
    });
    sendBtn.addEventListener('click', () => {
      if (this.input.value.trim()) {
        this.sendMessage(this.input.value.trim());
      }
    });

    inputRow.appendChild(this.input);
    inputRow.appendChild(sendBtn);
    this.body.appendChild(inputRow);

    document.body.appendChild(this.container);

    // Add welcome message
    this.addMessageToUI('papa', 'Chat is live! Papa will reply when he sees your message \u{1F680}');
  }

  toggle() {
    this.minimized = !this.minimized;
    this.body.style.display = this.minimized ? 'none' : 'block';
    this.headerToggle.textContent = this.minimized ? '\u25B2' : '\u25BC';
    // Clear notification flash
    this.header.style.background = '#111133';
  }

  addMessageToUI(from, text) {
    const msgEl = document.createElement('div');
    Object.assign(msgEl.style, {
      marginBottom: '6px',
      lineHeight: '1.4'
    });

    if (from === 'papa') {
      msgEl.innerHTML = `<span style="color:#ffd700;font-weight:bold">Papa:</span> <span style="color:#ffffff">${this.escapeHtml(text)}</span>`;
    } else {
      msgEl.innerHTML = `<span style="color:#00ffff;font-weight:bold">You:</span> <span style="color:#aaaaaa">${this.escapeHtml(text)}</span>`;
    }

    this.messageArea.appendChild(msgEl);
    this.messageArea.scrollTop = this.messageArea.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async sendMessage(text) {
    this.input.value = '';
    this.addMessageToUI('ridhaan', text);

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', message: text, from: 'ridhaan' })
      });
    } catch {
      // Silent fail
    }
  }

  async poll() {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'poll' })
      });
      const data = await res.json();

      if (data.messages && data.messages.length > 0) {
        data.messages.forEach(msg => {
          this.addMessageToUI(msg.from, msg.text);
        });

        // Flash header if minimized
        if (this.minimized) {
          this.header.style.background = '#664400';
          setTimeout(() => {
            this.header.style.background = '#111133';
            setTimeout(() => {
              this.header.style.background = '#664400';
            }, 300);
          }, 300);
        }
      }
    } catch {
      // Silent fail
    }
  }

  startPolling() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => this.poll(), 3000);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  destroy() {
    this.stopPolling();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
