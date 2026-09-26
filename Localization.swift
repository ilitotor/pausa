import Foundation

enum AppLang: String, CaseIterable, Identifiable {
    case en
    case ptBR = "pt_BR"
    var id: String { rawValue }
    var label: String { self == .en ? "English" : "Português" }

    static func detectSystem() -> AppLang {
        let code = (Locale.preferredLanguages.first ?? "en").lowercased()
        return code.hasPrefix("pt") ? .ptBR : .en
    }
}

/// Tabela de strings. Use %@ para textos e %d para números com String(format:).
enum Loc {
    static let strings: [String: [AppLang: String]] = [
        // Menu
        "remind_every":   [.en: "Activity block",            .ptBR: "Bloco de atividade"],
        "break_after":    [.en: "Break counts after",        .ptBR: "Pausa válida após"],
        "unit_min":       [.en: "min",                       .ptBR: "min"],
        "today_summary":  [.en: "Today: %@ active · %@ on breaks",
                           .ptBR: "Hoje: %@ ativo · %@ em pausa"],
        "report_btn":     [.en: "📊 View report",            .ptBR: "📊 Ver relatório"],
        "snooze_btn":     [.en: "⏰ Snooze +15 min",          .ptBR: "⏰ Adiar +15 min"],
        "reset_btn":      [.en: "✅ I took my break",         .ptBR: "✅ Já fiz minha pausa"],
        "quit":           [.en: "Quit",                      .ptBR: "Sair"],
        "language":       [.en: "Language",                  .ptBR: "Idioma"],
        "active_time":    [.en: "Active time: %@",           .ptBR: "Tempo ativo: %@"],
        "alert_now":      [.en: "⚠️ Time for a break!",       .ptBR: "⚠️ Hora da pausa!"],
        "next_in":        [.en: "Next reminder in %d min",   .ptBR: "Próximo aviso em %d min"],
        "snoozed_x":      [.en: "Snoozed %d× this cycle",    .ptBR: "Adiado %dx neste ciclo"],
        "last_break":     [.en: "Last break: %@",            .ptBR: "Última pausa: %@"],
        "in_break":       [.en: "⏸ On a break for %@",       .ptBR: "⏸ Em pausa há %@"],
        "break_zeroed":   [.en: "Enjoy! The counter has been reset.",
                           .ptBR: "Aproveite! O contador foi zerado."],

        // Notificações
        "notif_break_title": [.en: "Time for a break! 🚶",   .ptBR: "Hora de uma pausa! 🚶"],
        "notif_break_msg":   [.en: "You've been active for %d min. Stand up, stretch or drink some water — or snooze 15 min.",
                              .ptBR: "Você está ativo há %d min. Levante, alongue ou beba uma água — ou adie por 15 min."],
        "notif_welcome_title": [.en: "Welcome back! 👋",     .ptBR: "Bem-vindo de volta! 👋"],
        "notif_welcome_msg":   [.en: "Your break was %@. Nice work!",
                                .ptBR: "Sua pausa foi de %@. Bom trabalho!"],

        // Confirmação "está sentado?"
        "sitting_title":     [.en: "Are you still there? 🪑", .ptBR: "Você ainda está aí? 🪑"],
        "sitting_body":      [.en: "No activity detected. If you're sitting (e.g. in a meeting), let me know. Otherwise I'll log a break.",
                              .ptBR: "Não detectei atividade. Se você está sentado (ex.: numa reunião), me avise. Caso contrário, vou registrar uma pausa."],
        "sitting_countdown": [.en: "Logging a break in %ds…", .ptBR: "Registrando pausa em %ds…"],
        "sitting_yes":       [.en: "Yes, I'm here",           .ptBR: "Sim, estou aqui"],
        "sitting_no":        [.en: "It's a break",            .ptBR: "É uma pausa"],

        // Janela de relatório
        "report_title":    [.en: "Daily report",             .ptBR: "Relatório do dia"],
        "card_active":     [.en: "Active time",              .ptBR: "Tempo ativo"],
        "card_break":      [.en: "Break time",               .ptBR: "Tempo em pausa"],
        "card_count":      [.en: "Breaks",                   .ptBR: "Pausas"],
        "today_by_hour":   [.en: "Today, by hour",           .ptBR: "Hoje, por hora"],
        "last_days":       [.en: "Last days (active hours)", .ptBR: "Últimos dias (horas ativas)"],
        "report_note":     [.en: "Data is recorded only while the app is running, at ~5s resolution. We keep the last 14 days.",
                            .ptBR: "Os dados são registrados apenas enquanto o app está aberto, com resolução de ~5s. Guardamos os últimos 14 dias."]
    ]

    static func s(_ key: String, _ lang: AppLang) -> String {
        return strings[key]?[lang] ?? strings[key]?[.en] ?? key
    }
}
