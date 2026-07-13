package expo.modules.gonogowidget

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Bridge for the DronePal Go/No-Go home screen widget.
 * Persists the latest status in SharedPreferences and refreshes all widget instances.
 */
class GoNoGoWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("GoNoGoWidget")

    Function("update") { status: String, label: String ->
      val context = appContext.reactContext?.applicationContext ?: return@Function
      context
        .getSharedPreferences(GoNoGoWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .putString(GoNoGoWidgetProvider.KEY_STATUS, status)
        .putString(GoNoGoWidgetProvider.KEY_LABEL, label)
        .putLong(GoNoGoWidgetProvider.KEY_UPDATED_AT, System.currentTimeMillis())
        .apply()
      GoNoGoWidgetProvider.requestUpdate(context)
    }
  }
}
