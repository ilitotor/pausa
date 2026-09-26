# Chrome Web Store — textos prontos para colar

## Nome / Name
- **PT:** Pausa — Lembrete de pausas
- **EN:** Pausa — Break reminder

## Descrição curta (≤132 caracteres)
- **EN:** Reminds you to take breaks based on real system activity. Custom activity/break blocks, sitting check and daily report.
- **PT:** Lembra você de fazer pausas com base na atividade real do sistema. Blocos personalizáveis, verificação de presença e relatório.

## Descrição completa

### English
Pausa helps you work in focused blocks and rest on time — the healthy way to spend a long day at the computer.

It watches your real activity using the system's idle state (mouse and keyboard across your whole computer, not just the browser), so it knows when you're actually working and when you've stepped away.

Features:
• Custom activity and break blocks — type any value (e.g. 32 min of work, 18 min of break) or use the +/− steppers.
• A break alert that's hard to miss: a full-screen break tab (or a plain notification, your choice).
• "Are you still there?" check — if you go idle but are actually sitting (a meeting, reading), tell it you're present and it won't count a break.
• Snooze +15 min whenever you need a little longer.
• Daily report with charts: active vs. break time by hour, plus a multi-day history.
• English and Portuguese.

Privacy first: no accounts, no servers, no tracking, no ads. Everything stays on your device.

Note: because it runs in the browser, Pausa monitors while Chrome is open.

### Português
A Pausa ajuda você a trabalhar em blocos focados e descansar na hora certa — o jeito saudável de passar um longo dia no computador.

Ela acompanha sua atividade real usando o estado de ociosidade do sistema (mouse e teclado do computador inteiro, não só do navegador), então sabe quando você está de fato trabalhando e quando se afastou.

Recursos:
• Blocos de atividade e pausa personalizáveis — digite qualquer valor (ex.: 32 min de trabalho, 18 min de pausa) ou use os botões +/−.
• Um aviso de pausa difícil de ignorar: uma aba de pausa em tela cheia (ou só uma notificação, você escolhe).
• Verificação "você ainda está aí?" — se você ficar parado mas estiver presente (reunião, leitura), avise e a pausa não é contada.
• Adie +15 min sempre que precisar de mais um pouco.
• Relatório diário com gráficos: tempo ativo x pausa por hora, e histórico de vários dias.
• Português e inglês.

Privacidade em primeiro lugar: sem contas, sem servidores, sem rastreamento, sem anúncios. Tudo fica no seu dispositivo.

Observação: por rodar no navegador, a Pausa monitora enquanto o Chrome está aberto.

## Categoria sugerida
Productivity / Produtividade

## Justificativa de permissões (para o formulário de revisão)

- **idle:** Detect whether the user is active or away (no mouse/keyboard) to distinguish work time from breaks. Only the idle state is read; no input content is accessed.
- **alarms:** Run a periodic background check to accumulate activity time reliably under Manifest V3.
- **notifications:** Display break reminders, the "still there?" confirmation, and the welcome-back message.
- **storage:** Persist user settings and local daily statistics on the device.
- **Host permissions:** None requested. The extension does not access website content.
- **Remote code:** None. All code is bundled in the package.
- **Data usage disclosure:** The extension does not collect or transmit any user data. All data stays local (chrome.storage.local).

## Single purpose (campo "Single purpose")
Remind the user to take breaks based on their computer activity, and show simple statistics about their activity and breaks.
