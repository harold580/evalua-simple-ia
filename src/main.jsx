import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("No se encontró el elemento con id 'root'. Verifica tu index.html.");
  }
  
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  // ── SEGURIDAD: Crear elementos DOM seguros con textContent para prevenir XSS ──
  // Nunca inyectar error.message o error.stack como HTML crudo sin sanitizar.
  const container = document.createElement('div');
  container.style.cssText = 'color: white; background: #1e293b; padding: 20px; font-family: sans-serif;';

  const title = document.createElement('h1');
  title.textContent = 'Error al cargar la aplicación';
  container.appendChild(title);

  const message = document.createElement('p');
  message.textContent = error.message;
  container.appendChild(message);

  // Solo mostrar stack trace en desarrollo, nunca en producción
  if (import.meta.env.DEV) {
    const stack = document.createElement('pre');
    stack.style.cssText = 'background: #0f172a; padding: 10px; border-radius: 5px; overflow: auto;';
    stack.textContent = error.stack;
    container.appendChild(stack);
  }

  document.body.replaceChildren(container);
}
