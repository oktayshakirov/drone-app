package expo.modules.gonogowidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.graphics.Color
import android.widget.RemoteViews

/**
 * 2x2 home screen widget mirroring the in-app Go/No-Go card:
 * status icon + label on the status-tinted card background.
 * Tapping the widget opens the app.
 */
class GoNoGoWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    appWidgetIds.forEach { updateWidget(context, appWidgetManager, it) }
  }

  companion object {
    const val PREFS_NAME = "gonogo_widget"
    const val KEY_STATUS = "status"
    const val KEY_LABEL = "label"
    const val KEY_IS_PRO = "isPro"
    const val KEY_UPDATED_AT = "updatedAt"

    // Same palette as the in-app card (tailwind.config.js).
    private const val COLOR_GREEN = 0xFF22C55E.toInt()
    private const val COLOR_YELLOW = 0xFFEAB308.toInt()
    private const val COLOR_RED = 0xFFEF4444.toInt()
    private const val COLOR_NEUTRAL = 0xFF94A3B8.toInt()

    /** Refresh every placed widget instance with the latest stored status. */
    fun requestUpdate(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(
        ComponentName(context, GoNoGoWidgetProvider::class.java),
      )
      ids.forEach { updateWidget(context, manager, it) }
    }

    private fun updateWidget(
      context: Context,
      manager: AppWidgetManager,
      widgetId: Int,
    ) {
      val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val status = prefs.getString(KEY_STATUS, null)
      val label = prefs.getString(KEY_LABEL, null)
      val isPro = prefs.getBoolean(KEY_IS_PRO, false)

      val views = RemoteViews(context.packageName, R.layout.widget_go_nogo)

      // The widget is a Pro feature; free users see an upgrade placeholder.
      val (background, icon, color, fallbackLabel) = if (!isPro) {
        WidgetStyle(R.drawable.widget_bg_neutral, R.drawable.ic_widget_drone, COLOR_NEUTRAL, "Upgrade to Pro")
      } else when (status) {
        "green" -> WidgetStyle(R.drawable.widget_bg_green, R.drawable.ic_widget_check, COLOR_GREEN, "Go")
        "yellow" -> WidgetStyle(R.drawable.widget_bg_yellow, R.drawable.ic_widget_warning, COLOR_YELLOW, "Caution")
        "red" -> WidgetStyle(R.drawable.widget_bg_red, R.drawable.ic_widget_close, COLOR_RED, "No Go")
        else -> WidgetStyle(R.drawable.widget_bg_neutral, R.drawable.ic_widget_drone, COLOR_NEUTRAL, "Open app")
      }

      views.setInt(R.id.widget_root, "setBackgroundResource", background)
      views.setImageViewResource(R.id.widget_icon, icon)
      views.setInt(R.id.widget_icon, "setColorFilter", color)
      views.setTextViewText(R.id.widget_label, if (isPro) label ?: fallbackLabel else fallbackLabel)
      views.setTextColor(R.id.widget_label, color)
      // "Upgrade to Pro" is longer than the status labels; shrink it to fit.
      views.setTextViewTextSize(
        R.id.widget_label,
        android.util.TypedValue.COMPLEX_UNIT_SP,
        if (isPro) 18f else 13f,
      )

      // Tap anywhere on the widget opens the app.
      context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { launch ->
        val pendingIntent = PendingIntent.getActivity(
          context,
          0,
          launch,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
      }

      manager.updateAppWidget(widgetId, views)
    }
  }

  private data class WidgetStyle(
    val background: Int,
    val icon: Int,
    val color: Int,
    val fallbackLabel: String,
  )
}
