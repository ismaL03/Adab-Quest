package com.siraj.gharib;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.os.PowerManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONException;

/** Pont entre l'interface et le service de déverrouillage. */
@CapacitorPlugin(name = "Unlock")
public class UnlockPlugin extends Plugin {

    @Override
    public void load() {
        deliverPending();
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        deliverPending();
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        deliverPending();
    }

    /** Si le service vient d'ouvrir l'app après un déverrouillage, on demande à l'interface d'afficher un mot. */
    private void deliverPending() {
        Context context = getContext();
        if (!UnlockPrefs.pending(context)) return;
        UnlockPrefs.setPending(context, false);
        // « true » : l'événement est gardé jusqu'à ce que l'interface soit prête (démarrage à froid).
        notifyListeners("unlock", new JSObject(), true);
    }

    private boolean notificationsGranted() {
        return (
            Build.VERSION.SDK_INT < 33 ||
            ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        );
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", UnlockPrefs.enabled(getContext()));
        result.put("overlay", Settings.canDrawOverlays(getContext()));
        result.put("notifications", notificationsGranted());
        PowerManager power = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        result.put("battery", power == null || power.isIgnoringBatteryOptimizations(getContext().getPackageName()));
        call.resolve(result);
    }

    @PluginMethod
    public void setEnabled(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        Integer interval = call.getInt("interval", 0);
        Context context = getContext();
        UnlockPrefs.get(context).edit().putBoolean("enabled", enabled).putInt("interval", interval == null ? 0 : interval).apply();
        try {
            UnlockService.scheduleWatchdog(context, enabled);
            if (enabled) UnlockService.start(context);
            else UnlockService.stop(context);
        } catch (RuntimeException e) {
            call.reject("Impossible de démarrer le service", e);
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void requestOverlay(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
        try {
            getActivity().startActivity(intent);
        } catch (RuntimeException e) {
            getActivity().startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION));
        }
        call.resolve();
    }

    @PluginMethod
    public void requestNotifications(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && !notificationsGranted()) {
            ActivityCompat.requestPermissions(getActivity(), new String[] { Manifest.permission.POST_NOTIFICATIONS }, 7001);
        }
        call.resolve();
    }

    /** Demande à Android de ne pas arrêter le service pour économiser la batterie. */
    @PluginMethod
    public void requestBattery(PluginCall call) {
        Uri app = Uri.parse("package:" + getContext().getPackageName());
        try {
            getActivity().startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, app));
        } catch (RuntimeException e) {
            try {
                getActivity().startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
            } catch (RuntimeException ignored) {}
        }
        call.resolve();
    }

    /** File des prochains mots à afficher au déverrouillage, préparée par l'interface. */
    @PluginMethod
    public void setQueue(PluginCall call) {
        JSArray items = call.getArray("items");
        UnlockPrefs.setQueue(getContext(), items == null ? "[]" : items.toString());
        call.resolve();
    }

    /** Réponses données sur les cartes de déverrouillage depuis la dernière ouverture de l'application. */
    @PluginMethod
    public void takeAnswers(PluginCall call) {
        JSObject result = new JSObject();
        try {
            result.put("answers", new JSArray(UnlockPrefs.takeAnswers(getContext())));
        } catch (JSONException e) {
            result.put("answers", new JSArray());
        }
        call.resolve(result);
    }

    /** Après la réponse, on rend la main : le téléphone revient là où il en était. */
    @PluginMethod
    public void dismiss(PluginCall call) {
        getActivity().moveTaskToBack(true);
        call.resolve();
    }
}
