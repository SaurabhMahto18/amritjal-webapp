
import { useEffect, useState } from "react";
import {
  Download,
  X,
  Share,
  PlusSquare,
  Smartphone
} from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isStandalone) return;

    const ios =
      /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    setIsIOS(ios);

    const dismissed = sessionStorage.getItem(
      "amrit-jal-install-dismissed"
    );

    if (dismissed) return;

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();

      setDeferredPrompt(event);
      setVisible(true);
    }

    function handleAppInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
      sessionStorage.removeItem("amrit-jal-install-dismissed");
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    // iOS Safari does not support beforeinstallprompt.
    if (ios) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );
    };
  }, []);

  async function handleInstall() {
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }

    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();

      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setVisible(false);
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error("PWA installation failed:", error);
    }
  }

  function handleDismiss() {
    setVisible(false);

    sessionStorage.setItem(
      "amrit-jal-install-dismissed",
      "true"
    );
  }

  if (!visible) return null;

  return (
    <>
      {/* INSTALL BANNER */}

      <div className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:bottom-6">

        <div className="flex items-start gap-3">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-700 text-white">
            <Smartphone size={24} />
          </div>

          <div className="min-w-0 flex-1">

            <h3 className="font-bold text-slate-900">
              Install Amrit Jal
            </h3>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Add Amrit Jal to your home screen for quick access
              and an app-like experience.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">

              <button
                type="button"
                onClick={handleInstall}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-800"
              >
                <Download size={16} />

                {isIOS ? "Add to Home Screen" : "Download App"}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
              >
                Not now
              </button>

            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close install banner"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X size={19} />
          </button>

        </div>
      </div>

      {/* IOS INSTRUCTIONS */}

      {showIOSHelp && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/50 p-4 sm:items-center">

          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">

            <div className="flex items-center justify-between gap-3">

              <h3 className="text-lg font-bold text-slate-900">
                Add Amrit Jal to Home Screen
              </h3>

              <button
                type="button"
                onClick={() => setShowIOSHelp(false)}
                aria-label="Close instructions"
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            <p className="mt-4 text-sm text-slate-600">
              Follow these steps in Safari:
            </p>

            <div className="mt-5 space-y-5">

              <div className="flex items-center gap-3">
                <Share
                  size={22}
                  className="shrink-0 text-cyan-700"
                />

                <p className="text-sm text-slate-700">
                  1. Tap the Share button.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <PlusSquare
                  size={22}
                  className="shrink-0 text-cyan-700"
                />

                <p className="text-sm text-slate-700">
                  2. Select Add to Home Screen.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Download
                  size={22}
                  className="shrink-0 text-cyan-700"
                />

                <p className="text-sm text-slate-700">
                  3. Tap Add to finish.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() => setShowIOSHelp(false)}
              className="mt-6 w-full rounded-xl bg-cyan-700 p-3 font-bold text-white transition hover:bg-cyan-800"
            >
              Got it
            </button>

          </div>
        </div>
      )}
    </>
  );
}
