package com.raizen.lifehub;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity for LIFEHUB Android Application
 *
 * Extends BridgeActivity to run the LIFEHUB web application in a WebView.
 * Handles Android back button appropriately.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onBackPressed() {
        // Let the web app handle back navigation first via JavaScript.
        // This allows modals and mobile navigation to close.
        this.bridge.eval(
            "window.lifehubHandleBackButton && window.lifehubHandleBackButton()",
            (value) -> {
                if (value == null || !value.toString().equals("handled")) {
                    super.onBackPressed();
                }
            }
        );
    }
}