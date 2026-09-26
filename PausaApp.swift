import SwiftUI
import AppKit

@main
struct PausaApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var monitor = ActivityMonitor()

    var body: some Scene {
        MenuBarExtra {
            MenuContent(monitor: monitor, stats: monitor.stats)
        } label: {
            MenuBarLabel(monitor: monitor)
        }
        .menuBarExtraStyle(.window)
    }
}

/// Garante que o app comece como "accessory" (só barra de menu, sem Dock).
final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
    }
}

/// Ícone da barra: sentado (trabalhando) → andando (hora da pausa) → em pé (em pausa).
struct MenuBarLabel: View {
    @ObservedObject var monitor: ActivityMonitor

    var body: some View {
        if monitor.isOnBreak {
            HStack(spacing: 3) {
                Image(systemName: "figure.stand")
                Text(monitor.menuBarIdleText)
            }
        } else if monitor.alreadyNotified {
            Image(systemName: "figure.walk.circle.fill")
        } else {
            Image(systemName: Self.seatedSymbol)
        }
    }

    /// "figure.seated.side" existe a partir do macOS 14; no 13 cai para "chair.lounge".
    static let seatedSymbol: String = {
        let preferred = "figure.seated.side"
        if NSImage(systemSymbolName: preferred, accessibilityDescription: nil) != nil {
            return preferred
        }
        return "chair.lounge"
    }()
}

struct MenuContent: View {
    @ObservedObject var monitor: ActivityMonitor
    @ObservedObject var stats: StatsStore

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Pausa").font(.headline)

            if monitor.isOnBreak {
                VStack(alignment: .leading, spacing: 4) {
                    Text(String(format: monitor.tr("in_break"),
                                ActivityMonitor.format(monitor.currentIdleSeconds)))
                        .foregroundStyle(.teal)
                    Text(monitor.tr("break_zeroed"))
                        .font(.caption).foregroundStyle(.secondary)
                }
            } else {
                VStack(alignment: .leading, spacing: 4) {
                    Text(String(format: monitor.tr("active_time"), monitor.formattedActiveTime))
                        .font(.system(.body, design: .monospaced))

                    ProgressView(value: monitor.progress)
                        .tint(monitor.alreadyNotified ? .orange : .accentColor)

                    if monitor.alreadyNotified {
                        Text(monitor.tr("alert_now"))
                            .font(.caption).foregroundStyle(.orange)
                    } else {
                        Text(String(format: monitor.tr("next_in"), monitor.minutesUntilAlert))
                            .font(.caption).foregroundStyle(.secondary)
                    }

                    if monitor.snoozeCount > 0 {
                        Text(String(format: monitor.tr("snoozed_x"), monitor.snoozeCount))
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                    if let last = monitor.lastBreakSeconds {
                        Text(String(format: monitor.tr("last_break"), ActivityMonitor.format(last)))
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }

            Divider()

            Text(String(format: monitor.tr("today_summary"),
                        StatsStore.formatHM(stats.todayActiveSeconds),
                        StatsStore.formatHM(stats.todayBreakSeconds)))
                .font(.caption).foregroundStyle(.secondary)

            // Bloco de atividade — campo livre + stepper
            HStack {
                Text(monitor.tr("remind_every"))
                Spacer()
                TextField("", value: Binding(
                    get: { monitor.workLimitMinutes },
                    set: { monitor.workLimitMinutes = $0 }), format: .number)
                    .frame(width: 42)
                    .multilineTextAlignment(.trailing)
                    .textFieldStyle(.roundedBorder)
                Stepper("", value: Binding(
                    get: { monitor.workLimitMinutes },
                    set: { monitor.workLimitMinutes = $0 }), in: 1...240)
                    .labelsHidden()
                Text(monitor.tr("unit_min")).foregroundStyle(.secondary)
            }
            .font(.caption)

            // Pausa válida após — campo livre + stepper
            HStack {
                Text(monitor.tr("break_after"))
                Spacer()
                TextField("", value: Binding(
                    get: { monitor.breakDurationMinutes },
                    set: { monitor.breakDurationMinutes = $0 }), format: .number)
                    .frame(width: 42)
                    .multilineTextAlignment(.trailing)
                    .textFieldStyle(.roundedBorder)
                Stepper("", value: Binding(
                    get: { monitor.breakDurationMinutes },
                    set: { monitor.breakDurationMinutes = $0 }), in: 1...120)
                    .labelsHidden()
                Text(monitor.tr("unit_min")).foregroundStyle(.secondary)
            }
            .font(.caption)

            Picker(monitor.tr("language"), selection: $monitor.lang) {
                ForEach(AppLang.allCases) { l in
                    Text(l.label).tag(l)
                }
            }
            .pickerStyle(.menu)
            .font(.caption)

            Divider()

            Button(monitor.tr("report_btn")) { monitor.showReport() }
            Button(monitor.tr("snooze_btn")) { monitor.snooze() }
            Button(monitor.tr("reset_btn")) { monitor.reset() }
            Button(monitor.tr("quit")) { NSApplication.shared.terminate(nil) }
        }
        .padding(14)
        .frame(width: 280)
    }
}
