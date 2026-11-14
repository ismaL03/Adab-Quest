package com.siraj.gharib;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Relance le service après un redémarrage du téléphone ou une mise à jour de l'application. */
public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!UnlockPrefs.enabled(context)) return;
        try {
            UnlockService.start(context);
        } catch (RuntimeException ignored) {
            // Sera relancé à la prochaine ouverture de l'application.
        }
    }
}
