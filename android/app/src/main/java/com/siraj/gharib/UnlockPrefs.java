package com.siraj.gharib;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Réglages et données du « mot au déverrouillage », partagés entre l'interface et le service.
 * L'interface prépare une file de mots ; le service les affiche un à un et note les réponses,
 * que l'interface récupère à sa prochaine ouverture.
 */
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

    static synchronized void setQueue(Context c, String json) {
        get(c).edit().putString("queue", json).putInt("qpos", 0).commit();
    }

    /** Prochain mot de la file, ou null si elle est épuisée. */
    static synchronized JSONObject nextWord(Context c) {
        try {
            JSONArray queue = new JSONArray(get(c).getString("queue", "[]"));
            int pos = get(c).getInt("qpos", 0);
            return pos < queue.length() ? queue.getJSONObject(pos) : null;
        } catch (JSONException e) {
            return null;
        }
    }

    /** Passe au mot suivant ; « status » vaut 1 (à revoir), 2 (maîtrisé) ou 0 (mot passé, rien à noter). */
    static synchronized void advance(Context c, int id, int status) {
        SharedPreferences p = get(c);
        SharedPreferences.Editor e = p.edit().putInt("qpos", p.getInt("qpos", 0) + 1);
        if (status != 0) {
            try {
                JSONArray answers = new JSONArray(p.getString("answers", "[]"));
                answers.put(new JSONObject().put("id", id).put("st", status).put("at", System.currentTimeMillis()));
                e.putString("answers", answers.toString());
            } catch (JSONException ignored) {}
        }
        e.commit();
    }

    static synchronized String takeAnswers(Context c) {
        SharedPreferences p = get(c);
        String answers = p.getString("answers", "[]");
        p.edit().remove("answers").commit();
        return answers;
    }

    private UnlockPrefs() {}
}
