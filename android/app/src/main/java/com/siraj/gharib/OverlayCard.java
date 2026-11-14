package com.siraj.gharib;

import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import org.json.JSONObject;

/**
 * Carte affichée par-dessus l'écran juste après le déverrouillage : un mot, son sens, deux boutons.
 * Elle est dessinée directement par le service (autorisation « Superposition aux autres applis »),
 * sans ouvrir l'application : dès la réponse, le téléphone est exactement là où il en était.
 */
final class OverlayCard {

    private static View current;

    private final Context context;
    private final WindowManager wm;
    private final float density;
    private final boolean dark;
    private final int id;
    private FrameLayout root;

    /** Affiche le prochain mot de la file. Renvoie false s'il n'y a rien à afficher. */
    static boolean show(Context context) {
        if (current != null) return true;
        JSONObject word = UnlockPrefs.nextWord(context);
        if (word == null) return false;
        try {
            new OverlayCard(context, word);
            return true;
        } catch (RuntimeException e) {
            current = null;
            return false;
        }
    }

    private OverlayCard(Context context, JSONObject word) {
        this.context = context;
        this.wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        this.density = context.getResources().getDisplayMetrics().density;
        int night = context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        this.dark = night == Configuration.UI_MODE_NIGHT_YES;
        this.id = word.optInt("id");
        build(word);
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.OPAQUE
        );
        wm.addView(root, params);
        current = root;
    }

    private int dp(int value) {
        return Math.round(value * density);
    }

    private int color(int light, int night) {
        return dark ? night : light;
    }

    private TextView text(String value, int sizeSp, int color) {
        TextView t = new TextView(context);
        t.setText(value);
        t.setTextSize(sizeSp);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER);
        return t;
    }

    private GradientDrawable shape(int fill, int radiusDp, int stroke) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(fill);
        d.setCornerRadius(dp(radiusDp));
        if (stroke != 0) d.setStroke(dp(1), stroke);
        return d;
    }

    private TextView button(String label, int fill, int textColor) {
        TextView b = text(label, 16, textColor);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setBackground(shape(fill, 14, 0));
        b.setPadding(dp(10), dp(16), dp(10), dp(16));
        return b;
    }

    private LinearLayout.LayoutParams row(int topDp) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        lp.topMargin = dp(topDp);
        return lp;
    }

    private void build(JSONObject word) {
        final int bg = color(0xFFF6F1E4, 0xFF101614);
        final int panel = color(0xFFFFFDF6, 0xFF18211E);
        final int ink = color(0xFF1F2A26, 0xFFECE7D8);
        final int muted = color(0xFF6D756F, 0xFF96A09A);
        final int line = color(0xFFE4DCC6, 0xFF2A3531);
        final int green = color(0xFF0F5C4A, 0xFF3FAE90);
        final int greenSoft = color(0xFFDCEBE4, 0xFF1C3A32);
        final int gold = color(0xFFB88A2A, 0xFFD9B45A);
        final int goldSoft = color(0xFFF5E8C8, 0xFF3A3220);
        final int onGreen = color(0xFFFFFFFF, 0xFF06231C);
        final boolean review = "review".equals(word.optString("kind"));

        root = new FrameLayout(context) {
            @Override
            public boolean dispatchKeyEvent(KeyEvent event) {
                if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
                    if (event.getAction() == KeyEvent.ACTION_UP) close(0);
                    return true;
                }
                return super.dispatchKeyEvent(event);
            }
        };
        root.setBackgroundColor(bg);
        root.setPadding(dp(18), dp(52), dp(18), dp(44));

        LinearLayout column = new LinearLayout(context);
        column.setOrientation(LinearLayout.VERTICAL);
        root.addView(column, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        // En-tête : titre discret + « Passer ».
        LinearLayout header = new LinearLayout(context);
        header.setGravity(Gravity.CENTER_VERTICAL);
        TextView title = text("As-Siraj · mot du déverrouillage", 14, muted);
        title.setGravity(Gravity.START);
        header.addView(title, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        TextView skip = text("Passer", 15, green);
        skip.setPadding(dp(14), dp(10), dp(4), dp(10));
        skip.setOnClickListener(v -> close(0));
        header.addView(skip);
        column.addView(header);

        // Carte.
        LinearLayout card = new LinearLayout(context);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER);
        card.setBackground(shape(panel, 22, line));
        card.setPadding(dp(18), dp(22), dp(18), dp(26));
        LinearLayout.LayoutParams cardLp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1);
        cardLp.topMargin = dp(10);
        column.addView(card, cardLp);

        TextView chip = text(review ? "Révision" : "Nouveau mot", 12, review ? gold : green);
        chip.setTypeface(Typeface.DEFAULT_BOLD);
        chip.setBackground(shape(review ? goldSoft : greenSoft, 99, 0));
        chip.setPadding(dp(12), dp(4), dp(12), dp(4));
        card.addView(chip, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        card.addView(text(word.optString("ar"), 20, ink), row(14));
        card.addView(text(word.optString("fr"), 13, muted), row(2));

        TextView w = text("﴿" + word.optString("w") + "﴾", 38, green);
        w.setTypeface(Typeface.DEFAULT_BOLD);
        card.addView(w, row(18));

        View sep = new View(context);
        sep.setBackgroundColor(gold);
        LinearLayout.LayoutParams sepLp = new LinearLayout.LayoutParams(dp(56), dp(2));
        sepLp.topMargin = dp(12);
        sepLp.bottomMargin = dp(14);
        card.addView(sep, sepLp);

        final TextView meaning = text(word.optString("m"), 24, ink);
        meaning.setLineSpacing(dp(6), 1f);
        final TextView hint = text("Touchez pour voir le sens", 15, muted);
        card.addView(meaning);
        card.addView(hint);

        // Boutons de réponse.
        final LinearLayout answers = new LinearLayout(context);
        TextView again = button("À revoir", goldSoft, gold);
        again.setOnClickListener(v -> close(1));
        TextView ok = button("Maîtrisé", green, onGreen);
        ok.setOnClickListener(v -> close(2));
        LinearLayout.LayoutParams half = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1);
        half.setMarginEnd(dp(10));
        answers.addView(again, half);
        answers.addView(ok, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        column.addView(answers, row(14));

        final TextView reveal = button("Voir le sens", green, onGreen);
        column.addView(reveal, row(14));

        // Révision : le sens reste caché jusqu'à ce qu'on touche la carte.
        final Runnable show = () -> {
            meaning.setVisibility(View.VISIBLE);
            hint.setVisibility(View.GONE);
            answers.setVisibility(View.VISIBLE);
            reveal.setVisibility(View.GONE);
        };
        if (review) {
            meaning.setVisibility(View.GONE);
            answers.setVisibility(View.GONE);
            card.setOnClickListener(v -> show.run());
            reveal.setOnClickListener(v -> show.run());
        } else {
            show.run();
        }

        TextView open = text("Ouvrir l'application", 14, green);
        open.setPadding(dp(10), dp(14), dp(10), dp(4));
        open.setOnClickListener(v -> {
            close(0);
            Intent intent = new Intent(context, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            try {
                context.startActivity(intent);
            } catch (RuntimeException ignored) {}
        });
        column.addView(open, row(0));
    }

    private void close(int status) {
        if (current != root) return;
        current = null;
        UnlockPrefs.advance(context, id, status);
        try {
            wm.removeView(root);
        } catch (RuntimeException ignored) {}
    }
}
