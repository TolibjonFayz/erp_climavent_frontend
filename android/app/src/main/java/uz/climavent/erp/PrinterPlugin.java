package uz.climavent.erp;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * HTML hujjatni Android chop etish oynasida ochadi (printer yoki "PDF sifatida saqlash").
 * WebView ichida window.print() ishlamaydi, shuning uchun hujjat alohida WebView'da
 * chiziladi va PrintManager'ga beriladi.
 */
@CapacitorPlugin(name = "Printer")
public class PrinterPlugin extends Plugin {

    // Chop etish tugaguncha WebView yig'ishtirilib ketmasin
    private WebView printView;

    @PluginMethod
    public void print(PluginCall call) {
        String html = call.getString("html");
        String name = call.getString("name", "Hujjat");
        if (html == null || html.isEmpty()) {
            call.reject("html bo'sh");
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                WebView view = new WebView(getContext());
                view.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView v, String url) {
                        PrintManager manager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                        PrintDocumentAdapter adapter = v.createPrintDocumentAdapter(name);
                        PrintAttributes attrs = new PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                            .build();
                        manager.print(name, adapter, attrs);
                        call.resolve();
                    }
                });
                view.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
                printView = view;
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        });
    }
}
