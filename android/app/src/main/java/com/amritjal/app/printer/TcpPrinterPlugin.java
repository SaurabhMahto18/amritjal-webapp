
package com.amritjal.app.printer;

import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "TcpPrinter")
public class TcpPrinterPlugin extends Plugin {

    private final ExecutorService executor =
            Executors.newSingleThreadExecutor();

    @PluginMethod
    public void send(PluginCall call) {
        String host = call.getString("host");
        Integer port = call.getInt("port", 9100);
        String data = call.getString("data");

        if (host == null || host.trim().isEmpty()) {
            call.reject("Printer IP is required.");
            return;
        }

        if (port == null || port < 1 || port > 65535) {
            call.reject("Invalid printer port.");
            return;
        }

        if (data == null || data.isEmpty()) {
            call.reject("Print data is empty.");
            return;
        }

        executor.execute(() -> {
            try {
                byte[] bytes = Base64.decode(data, Base64.DEFAULT);

                if (bytes.length == 0 || bytes.length > 1024 * 1024) {
                    call.reject("Invalid or oversized print data.");
                    return;
                }

                try (Socket socket = new Socket()) {
                    socket.connect(
                            new InetSocketAddress(host.trim(), port),
                            5000
                    );

                    OutputStream output = socket.getOutputStream();
                    output.write(bytes);
                    output.flush();

                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("host", host);
                    result.put("port", port);
                    result.put("bytesSent", bytes.length);

                    call.resolve(result);
                }

            } catch (Exception e) {
                call.reject("Printer error: " + e.getMessage(), e);
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        executor.shutdown();
        super.handleOnDestroy();
    }
}
