package com.siraj.gharib;

import android.app.KeyguardManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;
import android.provider.Settings;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

/**
 * Service permanent : Android ne prévient du déverrouillage que les applications en cours d'exécution.
 * À chaque déverrouillage, il ramène l'application au premier plan avec un mot à apprendre ou à réviser.
 */
public class UnlockService extends Service {

    private static final String CHANNEL = "unlock";
    private static final int NOTIFICATION_ID = 1;
    private long lastShown = 0;

    private final BroadcastReceiver receiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (Intent.ACTION_USER_PRESENT.equals(action)) {
                showWord();
            } else if (Intent.ACTION_SCREEN_ON.equals(action)) {
                // Téléphone sans écran de verrouillage : l'allumage de l'écran vaut déverrouillage.
                KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
                if (km != null && !km.isKeyguardLocked()) showWord();
            }
        }
    };

    static void start(Context context) {
        ContextCompat.startForegroundService(context, new Intent(context, UnlockService.class));
    }

    static void stop(Context context) {
        context.stopService(new Intent(context, UnlockService.class));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_USER_PRESENT);
        filter.addAction(Intent.ACTION_SCREEN_ON);
        ContextCompat.registerReceiver(this, receiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        int type = Build.VERSION.SDK_INT >= 34 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE : 0;
        try {
            ServiceCompat.startForeground(this, NOTIFICATION_ID, buildNotification(), type);
        } catch (RuntimeException e) {
            // Android a refusé le démarrage en arrière-plan : on réessaiera à la prochaine ouverture de l'app.
            stopSelf();
            return START_NOT_STICKY;
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        unregisterReceiver(receiver);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void showWord() {
        if (!UnlockPrefs.enabled(this) || !Settings.canDrawOverlays(this)) return;
        long now = SystemClock.elapsedRealtime();
        long gap = UnlockPrefs.interval(this) * 60_000L;
        // 2 s d'écart minimum : ACTION_SCREEN_ON et ACTION_USER_PRESENT peuvent arriver coup sur coup.
        if (lastShown != 0 && now - lastShown < Math.max(gap, 2_000L)) return;
        lastShown = now;
        UnlockPrefs.setPending(this, true);
        Intent open = new Intent(this, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NO_ANIMATION);
        try {
            startActivity(open);
        } catch (RuntimeException e) {
            UnlockPrefs.setPending(this, false);
        }
    }

    private Notification buildNotification() {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm != null) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, "Mot au déverrouillage", NotificationManager.IMPORTANCE_MIN);
            channel.setShowBadge(false);
            nm.createNotificationChannel(channel);
        }
        PendingIntent open = PendingIntent.getActivity(
            this,
            0,
            new Intent(this, MainActivity.class),
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
        return new NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_lamp)
            .setContentTitle("As-Siraj")
            .setContentText("Un mot vous attend à chaque déverrouillage.")
            .setContentIntent(open)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build();
    }
}
