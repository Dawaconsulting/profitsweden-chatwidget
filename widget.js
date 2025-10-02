class ProFitChatWidget {
  constructor() {
    this.init();
  }

  init() {
    // Skapa knapp
    const button = document.createElement("div");
    button.innerText = "💬 ProFit AI";
    button.style.position = "fixed";
    button.style.bottom = "20px";
    button.style.right = "20px";
    button.style.background = "#2ecc71";
    button.style.color = "#fff";
    button.style.padding = "12px 16px";
    button.style.borderRadius = "20px";
    button.style.cursor = "pointer";
    button.style.fontFamily = "Arial, sans-serif";
    button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    button.style.zIndex = "9999";

    button.onclick = () => this.openChat();

    document.body.appendChild(button);
  }

  openChat() {
    alert("Här ska vi koppla OpenAI API och en snygg chatt – detta är bara en demo 😉");
  }
}

window.onload = () => new ProFitChatWidget();
