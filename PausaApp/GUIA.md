# Pausa — guia do pacote

Quatro entregas nesta pasta:

| Pasta / arquivo | O que é |
|---|---|
| `PausaApp/` | App nativo do macOS (barra de menu). Compila sem Xcode. |
| `PausaExt/` | Extensão do Chrome (código-fonte, "Load unpacked"). |
| `PausaExt.zip` | A mesma extensão empacotada **para subir na Web Store** (manifest na raiz). |
| `PausaStore/` | Imagens promocionais, política de privacidade e textos da listagem. |
| `PausaSite/docs/` | Site (landing page) bilíngue para o GitHub Pages. |

---

## Novidades desta versão

- **Tempo livre + stepper** no app e na extensão: digite qualquer valor (ex.: 32 min de atividade / 18 de pausa) ou ajuste de 1 em 1. Mude para 38/11 quando quiser.
- **Bilíngue (PT-BR / EN)** no app, na extensão e no site, com troca de idioma na hora.
- No app do Mac, as configurações e o idioma agora são **persistidos** entre reinícios.

---

## Publicar a extensão na Chrome Web Store

1. Crie a conta de desenvolvedor em https://chrome.google.com/webstore/devconsole (taxa única de US$5, cobre até 20 extensões).
2. "Add new item" → suba o **`PausaExt.zip`**.
3. Preencha a listagem usando `PausaStore/STORE_LISTING.md` (nome, descrições curtas/longas em PT e EN, categoria, single purpose).
4. Envie as imagens de `PausaStore/`:
   - Ícone: `icon_128.png` (128×128)
   - Pelo menos 1 screenshot: `screenshot_1280x800.png` (1280×800)
   - Small promo tile: `promo_440x280.png` (440×280)
   - (Opcional) Marquee: `marquee_1400x560.png` (1400×560)
5. Cole a **política de privacidade**: publique `PausaStore/PRIVACY.md` numa URL (o próprio GitHub Pages serve — veja `privacy.html`) e informe o link. Preencha as justificativas de permissão (também em `STORE_LISTING.md`).
6. Se quiser distribuir de forma privada primeiro, escolha visibilidade **"Unlisted"**.
7. Enviar para revisão. A análise costuma levar de alguns dias a semanas.

> A extensão não pede permissões de host, não coleta dados e não usa código remoto — isso simplifica bastante a revisão.

## Publicar o site no GitHub Pages

1. Crie um repositório no GitHub (ex.: `pausa`) e faça push com a pasta `PausaSite/docs/` dentro dele.
2. No repositório: **Settings → Pages**.
3. Em "Build and deployment", "Source" = **Deploy from a branch**; escolha a branch (ex.: `main`) e a pasta **`/docs`**. Salve.
4. Em ~1 min o site fica em `https://SEU-USUARIO.github.io/pausa/`.
5. A política de privacidade fica em `.../pausa/privacy.html` — use essa URL na Web Store.

### Antes de publicar o site
- Os botões "Baixar extensão" e "Baixar app do Mac" em `index.html` estão com `href="#"`. Troque pelos links reais (ex.: a página da extensão na Web Store e um link de release do `.zip`/`Pausa.app` no GitHub).

---

## Notas técnicas

- **App do Mac:** não consegui compilar Swift aqui (ambiente Linux, sem SDK da Apple). Verifiquei consistência de símbolos e balanceamento, mas rode `./build.sh` e me avise se o compilador reclamar de algo — ajusto na hora.
- **Extensão:** JSON e JS validados (`node --check`), mas não executada ao vivo. Se algo falhar, o log do "service worker" em `chrome://extensions` mostra o erro.
