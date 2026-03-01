const themeSelector = document.getElementById('theme-selector');
const customControls = document.getElementById('custom-controls');
const colorBg = document.getElementById('color-bg');
const colorAccent = document.getElementById('color-accent');
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const fileInput = document.getElementById('file-input');
const sendBtn = document.getElementById('send-btn');
const logoImg = document.querySelector('.logo-img');

const MAX_SIZE = 10 * 1024 * 1024;

const logos = {
    'oscuro': '/static/img/img1.jpeg',
    'claro': '/static/img/img2.jpeg',
    'personalizado': '/static/img/img1.jpeg'
};

themeSelector.onchange = (e) => {
    const tema = e.target.value;
    document.documentElement.setAttribute('data-theme', tema);
    customControls.style.display = tema === 'personalizado' ? 'flex' : 'none';
    
    if (logos[tema]) {
        logoImg.style.opacity = '0';
        setTimeout(() => {
            logoImg.src = logos[tema];
            logoImg.style.opacity = '1';
        }, 200);
    }
};

function updateCustomColors() {
    if(themeSelector.value === 'personalizado') {
        document.documentElement.style.setProperty('--bg', colorBg.value);
        document.documentElement.style.setProperty('--accent', colorAccent.value);
    }
}
colorBg.oninput = updateCustomColors;
colorAccent.oninput = updateCustomColors;

async function enviar() {
    const texto = userInput.value.trim();
    const archivo = fileInput.files[0];
    if(!texto && !archivo) return;

    if (archivo && archivo.size > MAX_SIZE) {
        alert("Máximo 10MB");
        return;
    }

    const welcome = document.getElementById('welcome-message');
    if (welcome) {
        welcome.style.opacity = '0';
        setTimeout(() => welcome.remove(), 300);
    }

    const visual = texto || `📁 Archivo: ${archivo.name}`;
    chatBox.innerHTML += `<div class="message user">${visual}</div>`;

    const formData = new FormData();
    formData.append('mensaje', texto);
    if(archivo) formData.append('file', archivo);

    userInput.value = "";
    fileInput.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch('/chat', { method: 'POST', body: formData });
        const data = await res.json();

        const htmlBody = marked.parse(data.respuesta);
        chatBox.innerHTML += `
            <div class="message bot">
                <div class="content">${htmlBody}</div>
                <div class="metadata">Tokens: ${data.tokens.in}/${data.tokens.out}</div>
            </div>`;
        
        Prism.highlightAll();
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) {
        chatBox.innerHTML += `<div class="message bot" style="color:red;">Error de conexión</div>`;
    }
}

sendBtn.onclick = enviar;
userInput.onkeypress = (e) => { if (e.key === 'Enter') enviar(); };
