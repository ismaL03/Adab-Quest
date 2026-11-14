package com.siraj.gharib;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UnlockPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
