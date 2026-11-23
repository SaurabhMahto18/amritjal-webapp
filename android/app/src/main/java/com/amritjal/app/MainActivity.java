
package com.amritjal.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.amritjal.app.printer.TcpPrinterPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TcpPrinterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
