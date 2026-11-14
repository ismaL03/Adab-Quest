package com.siraj.gharib;

import android.content.Context;
import android.content.SharedPreferences;

/** Réglages du « mot au déverrouillage », partagés entre l'app, le service et le démarrage du téléphone. */
final class UnlockPrefs {

    private static final String FILE = "unlock";

    static SharedPreferences get(Context c) {
        return c.getApplicationContext().getSharedPreferences(FILE, Context.MODE_PRIVATE);
    }

    static boolean enabled(Context c) {
        return get(c).getBoolean("enabled", false);
    }

    /** Délai minimal entre deux mots, en minutes (0 = à chaque déverrouillage). */
    static int interval(Context c) {
        return get(c).getInt("interval", 0);
    }

    static boolean pending(Context c) {
        return get(c).getBoolean("pending", false);
    }

    static void setPending(Context c, boolean value) {
        get(c).edit().putBoolean("pending", value).apply();
    }

    private UnlockPrefs() {}
}
