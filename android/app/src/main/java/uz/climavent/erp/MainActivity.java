package uz.climavent.erp;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Ilovaning o'z plaginlari (npm paket emas) — super.onCreate'dan oldin
        registerPlugin(PrinterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
