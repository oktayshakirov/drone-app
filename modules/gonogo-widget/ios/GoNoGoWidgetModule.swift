import ExpoModulesCore
import WidgetKit

/**
 * Bridge for the DronePal Go/No-Go home screen widget.
 * Stores the latest status in the shared App Group so the widget
 * extension can read it, then asks WidgetKit to refresh.
 */
public class GoNoGoWidgetModule: Module {
  private static let appGroupId = "group.com.shadev.drone-pal"
  private static let statusKey = "goNoGoWidgetData"

  public func definition() -> ModuleDefinition {
    Name("GoNoGoWidget")

    Function("update") { (status: String, label: String, isPro: Bool) in
      let payload: [String: Any] = [
        "status": status,
        "label": label,
        "isPro": isPro,
        "updatedAt": Date().timeIntervalSince1970,
      ]
      let defaults = UserDefaults(suiteName: Self.appGroupId)
      defaults?.set(payload, forKey: Self.statusKey)
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}
