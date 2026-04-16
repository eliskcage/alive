package shop.shortfactory.alive;

import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import androidx.annotation.Nullable;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;
import androidx.browser.trusted.TrustedWebActivityIntent;

/**
 * ALIVE — Trusted Web Activity launcher.
 *
 * Launches https://www.shortfactory.shop/alive/ as a fullscreen TWA.
 * Chrome verifies the Digital Asset Links, then renders the PWA
 * without any browser chrome — looks and feels like a native app.
 *
 * Falls back to a Custom Tab if TWA verification hasn't completed yet.
 */
public class LauncherActivity extends android.app.Activity {

    private static final Uri LAUNCH_URI =
            Uri.parse("https://www.shortfactory.shop/alive/?source=app");

    private static final String CHROME_PACKAGE = "com.android.chrome";

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Try TWA first (fullscreen, no browser bar)
        try {
            TrustedWebActivityIntentBuilder builder =
                    new TrustedWebActivityIntentBuilder(LAUNCH_URI);

            // Splash screen colour
            builder.setNavigationBarColor(0xFF050508);
            builder.setToolbarColor(0xFF050508);

            TrustedWebActivityIntent twaIntent = builder.build(
                    new CustomTabsIntent.Builder().build().intent
            );
            twaIntent.getIntent().setPackage(CHROME_PACKAGE);
            startActivity(twaIntent.getIntent());

        } catch (Exception e) {
            // Fallback: launch as a Custom Tab (shows thin URL bar)
            CustomTabsIntent customTab = new CustomTabsIntent.Builder()
                    .setToolbarColor(0xFF050508)
                    .setNavigationBarColor(0xFF050508)
                    .build();
            customTab.intent.setPackage(getChromePackage());
            customTab.launchUrl(this, LAUNCH_URI);
        }

        finish();
    }

    /**
     * Find an installed Chrome variant.
     */
    private String getChromePackage() {
        String[] candidates = {
                "com.android.chrome",
                "com.chrome.beta",
                "com.chrome.dev",
                "com.chrome.canary"
        };
        PackageManager pm = getPackageManager();
        for (String pkg : candidates) {
            try {
                pm.getPackageInfo(pkg, 0);
                return pkg;
            } catch (PackageManager.NameNotFoundException ignored) {}
        }
        return "com.android.chrome"; // default
    }
}
