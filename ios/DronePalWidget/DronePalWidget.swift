import WidgetKit
import SwiftUI

// MARK: - Shared data

private let appGroupId = "group.com.shadev.drone-pal"
private let statusKey = "goNoGoWidgetData"

struct GoNoGoEntry: TimelineEntry {
  let date: Date
  /// "green" | "yellow" | "red"; nil until the app has written a status.
  let status: String?
  let label: String?
  /// Widget content is a Pro feature; free users get an upgrade placeholder.
  let isPro: Bool
}

private func readStoredEntry() -> GoNoGoEntry {
  let stored = UserDefaults(suiteName: appGroupId)?.dictionary(forKey: statusKey)
  return GoNoGoEntry(
    date: Date(),
    status: stored?["status"] as? String,
    label: stored?["label"] as? String,
    isPro: stored?["isPro"] as? Bool ?? false
  )
}

// MARK: - Provider

struct GoNoGoProvider: TimelineProvider {
  func placeholder(in context: Context) -> GoNoGoEntry {
    GoNoGoEntry(date: Date(), status: "green", label: "Go", isPro: true)
  }

  func getSnapshot(in context: Context, completion: @escaping (GoNoGoEntry) -> Void) {
    completion(context.isPreview ? placeholder(in: context) : readStoredEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<GoNoGoEntry>) -> Void) {
    // The app pushes updates via WidgetCenter.reloadAllTimelines(); no self-refresh.
    completion(Timeline(entries: [readStoredEntry()], policy: .never))
  }
}

// MARK: - View (mirrors the in-app GoNoGoCard)

// Same palette as tailwind.config.js.
private let cardColor = Color(red: 0x14 / 255, green: 0x14 / 255, blue: 0x14 / 255)
private let borderColor = Color(red: 0x26 / 255, green: 0x26 / 255, blue: 0x26 / 255)
private let safeGreen = Color(red: 0x22 / 255, green: 0xC5 / 255, blue: 0x5E / 255)
private let cautionYellow = Color(red: 0xEA / 255, green: 0xB3 / 255, blue: 0x08 / 255)
private let dangerRed = Color(red: 0xEF / 255, green: 0x44 / 255, blue: 0x44 / 255)
private let neutralSlate = Color(red: 0x94 / 255, green: 0xA3 / 255, blue: 0xB8 / 255)

struct GoNoGoWidgetView: View {
  let entry: GoNoGoEntry

  private var statusColor: Color {
    switch entry.status {
    case "green": return safeGreen
    case "yellow": return cautionYellow
    case "red": return dangerRed
    default: return neutralSlate
    }
  }

  private var iconName: String {
    switch entry.status {
    case "green": return "checkmark.circle.fill"
    case "yellow": return "exclamationmark.triangle.fill"
    case "red": return "xmark.circle.fill"
    default: return "paperplane.circle.fill"
    }
  }

  private var label: String {
    if let label = entry.label, !label.isEmpty { return label }
    switch entry.status {
    case "green": return "Go"
    case "yellow": return "Caution"
    case "red": return "No Go"
    default: return "Open app"
    }
  }

  private var background: some View {
    ZStack {
      cardColor
      statusColor.opacity(0.2)
    }
  }

  var body: some View {
    if entry.isPro {
      statusBody
    } else {
      lockedBody
    }
  }

  private var statusBody: some View {
    VStack(spacing: 4) {
      Image(systemName: iconName)
        .font(.system(size: 38))
        .foregroundColor(statusColor)
      Text(label)
        .font(.system(size: 18, weight: .bold))
        .foregroundColor(statusColor)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .modifier(WidgetBackgroundModifier(background: background))
  }

  /// Placeholder for free users: the widget is a Pro feature.
  private var lockedBody: some View {
    VStack(spacing: 6) {
      Image(systemName: "lock.fill")
        .font(.system(size: 28))
        .foregroundColor(neutralSlate)
      Text("Pro feature")
        .font(.system(size: 14, weight: .bold))
        .foregroundColor(.white)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
      Text("Upgrade to Pro in DronePal")
        .font(.system(size: 11))
        .foregroundColor(neutralSlate)
        .multilineTextAlignment(.center)
        .lineLimit(2)
        .minimumScaleFactor(0.8)
    }
    .padding(8)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .modifier(WidgetBackgroundModifier(background: ZStack { cardColor }))
  }
}

/// iOS 17 requires containerBackground(for: .widget); older versions use a plain background.
private struct WidgetBackgroundModifier<Background: View>: ViewModifier {
  let background: Background

  func body(content: Content) -> some View {
    if #available(iOS 17.0, *) {
      content.containerBackground(for: .widget) { background }
    } else {
      content.background(background)
    }
  }
}

// MARK: - Widget

struct GoNoGoWidget: Widget {
  let kind: String = "GoNoGoWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: GoNoGoProvider()) { entry in
      GoNoGoWidgetView(entry: entry)
    }
    .configurationDisplayName("Go / No-Go")
    .description("Current flight conditions at a glance.")
    .supportedFamilies([.systemSmall])
  }
}

@main
struct DronePalWidgetBundle: WidgetBundle {
  var body: some Widget {
    GoNoGoWidget()
  }
}
