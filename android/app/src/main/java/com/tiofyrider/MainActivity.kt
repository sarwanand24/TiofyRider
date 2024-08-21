package com.tiofyrider

import android.os.Bundle
import android.os.Build
import android.net.Uri
import android.content.ContentResolver
import android.media.AudioAttributes
import android.app.NotificationChannel
import androidx.core.app.NotificationCompat
import android.app.NotificationManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */

   override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val notificationChannel = NotificationChannel("order_channel", "TiofyRider", NotificationManager.IMPORTANCE_HIGH)
      notificationChannel.setShowBadge(true)
      notificationChannel.description = ""
      val att = AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_NOTIFICATION)
              .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
              .build()
      notificationChannel.setSound(Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + packageName + "/raw/order_tone"), att)
      notificationChannel.enableVibration(true)
      notificationChannel.vibrationPattern = longArrayOf(400, 400)
      notificationChannel.lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
      val manager = getSystemService(NotificationManager::class.java)
      manager.createNotificationChannel(notificationChannel)
    }
  }

  override fun getMainComponentName(): String = "TiofyRider"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
