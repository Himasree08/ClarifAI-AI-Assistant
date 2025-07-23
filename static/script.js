///
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const submitBtn = document.getElementById("submit-btn");
const micBtn = document.getElementById("mic-btn");
const emotionValue = document.getElementById("emotion-value");

function appendMessage(content, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", `${sender}-message`);
  msg.textContent = content;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function streamResponse(query) {
  appendMessage(query, "user");
  const placeholder = document.createElement("div");
  placeholder.classList.add("message", "assistant-message");
  placeholder.textContent = "Thinking...";
  chatBox.appendChild(placeholder);
  chatBox.scrollTop = chatBox.scrollHeight;

  fetch("/ask_stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  })
    .then(response => {
      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      placeholder.textContent = "";
      function readChunk() {
        reader.read().then(({ done, value }) => {
          if (done) return;
          const chunk = decoder.decode(value, { stream: true });
          placeholder.textContent += chunk;
          chatBox.scrollTop = chatBox.scrollHeight;
          readChunk();
        });
      }
      readChunk();
    });
}

submitBtn.addEventListener("click", () => {
  const query = userInput.value.trim();
  if (query) {
    streamResponse(query);
    userInput.value = "";
  }
});

// Voice input using Speech Recognition
micBtn.addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech Recognition not supported in your browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    submitBtn.click();
  };
});

// Poll emotion every 2s
setInterval(() => {
  fetch("/get_emotion")
    .then(res => res.json())
    .then(data => {
      emotionValue.textContent = data.emotion.charAt(0).toUpperCase() + data.emotion.slice(1);
    });
}, 2000);
///