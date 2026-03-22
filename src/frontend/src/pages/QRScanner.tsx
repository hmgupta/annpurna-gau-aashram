import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Camera,
  CameraOff,
  PawPrint as CowIcon,
  FlipHorizontal,
  QrCode,
  RotateCcw,
  ScanLine,
  Search,
  Tag,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Cow } from "../backend.d";
import { useGetCowByTag } from "../hooks/useQueries";
import { useLang } from "../lib/LanguageContext";
import { useQRScanner } from "../qr-code/useQRScanner";
import { calcAgeFromBirth, decodeBirthDate } from "../utils/timeUtils";

const MONTH_NAMES_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_NAMES_HI = [
  "जनवरी",
  "फरवरी",
  "मार्च",
  "अप्रैल",
  "मई",
  "जून",
  "जुलाई",
  "अगस्त",
  "सितंबर",
  "अक्टूबर",
  "नवंबर",
  "दिसंबर",
];

const prakarColors: Record<string, { badge: string }> = {
  Lactating: { badge: "bg-amber-100 text-amber-800" },
  Pregnant: { badge: "bg-rose-100 text-rose-800" },
  Dry: { badge: "bg-lime-100 text-lime-800" },
  Bull: { badge: "bg-sky-100 text-sky-800" },
  "Calf-F": { badge: "bg-yellow-100 text-yellow-800" },
  "Calf-M": { badge: "bg-blue-100 text-blue-800" },
  Retired: { badge: "bg-pink-100 text-pink-800" },
  "Retired-Bull": { badge: "bg-purple-100 text-purple-800" },
  Healthy: { badge: "bg-green-100 text-green-800" },
  Sick: { badge: "bg-red-100 text-red-800" },
  Recovering: { badge: "bg-teal-100 text-teal-800" },
};

function getPrakarLabel(status: string, lang: "en" | "hi"): string {
  const labels: Record<string, { en: string; hi: string }> = {
    Lactating: { en: "Lactating", hi: "दूजनी" },
    Pregnant: { en: "Pregnant", hi: "गाभिन" },
    Dry: { en: "Dry", hi: "वसुकी" },
    Bull: { en: "Bull", hi: "नंदी" },
    "Calf-F": { en: "Calf-F", hi: "बछड़ी" },
    "Calf-M": { en: "Calf-M", hi: "बछड़ा" },
    Retired: { en: "Retired Gay", hi: "निवृत्त गाय" },
    "Retired-Bull": { en: "Retired Nandi", hi: "निवृत्त नंदी" },
    Healthy: { en: "Healthy", hi: "स्वस्थ" },
    Sick: { en: "Sick", hi: "बीमार" },
    Recovering: { en: "Recovering", hi: "स्वस्थ हो रही है" },
  };
  return labels[status]?.[lang] ?? status;
}

function CowResultCard({ cow, lang }: { cow: Cow; lang: "en" | "hi" }) {
  const decoded = decodeBirthDate(cow.age);
  const birthLabel = decoded
    ? `${lang === "hi" ? MONTH_NAMES_HI[decoded.month - 1] : MONTH_NAMES_EN[decoded.month - 1]} ${decoded.year}`
    : null;
  const colors = prakarColors[cow.healthStatus] ?? {
    badge: "bg-muted text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
      data-ocid="scanner.cow.card"
    >
      <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <CowIcon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground text-lg">{cow.name}</h3>
            {cow.tagNumber && (
              <Badge
                variant="outline"
                className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300 gap-1"
              >
                <Tag className="h-3 w-3" />
                {cow.tagNumber}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-semibold",
                colors.badge,
              )}
            >
              {getPrakarLabel(cow.healthStatus, lang)}
            </span>
            {cow.breed && (
              <span className="text-xs text-muted-foreground">{cow.breed}</span>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3 text-sm">
        {birthLabel && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              {lang === "hi" ? "जन्म" : "Born"}
            </p>
            <p className="font-medium text-foreground">{birthLabel}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">
            {lang === "hi" ? "उम्र" : "Age"}
          </p>
          <p className="font-medium text-foreground">
            {calcAgeFromBirth(cow.age).display(lang)}
          </p>
        </div>
        {cow.qrCode && (
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground mb-0.5">
              {lang === "hi" ? "QR/Barcode ID" : "QR/Barcode ID"}
            </p>
            <p className="font-mono text-xs text-foreground/80 truncate">
              {cow.qrCode}
            </p>
          </div>
        )}
        {cow.description && (
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground mb-0.5">
              {lang === "hi" ? "विवरण" : "Description"}
            </p>
            <p className="text-sm text-foreground/80 line-clamp-2">
              {cow.description}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function QRScanner() {
  const { t, lang } = useLang();
  const getCowByTag = useGetCowByTag();
  const [foundCow, setFoundCow] = useState<Cow | null | undefined>(undefined);
  const [manualInput, setManualInput] = useState("");
  const [lastScanned, setLastScanned] = useState<string>("");
  const isMobile =
    typeof window !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const scanner = useQRScanner({
    facingMode: "environment",
  });

  const { videoRef, canvasRef } = scanner;

  const lastResultRef = useRef<string>("");
  useEffect(() => {
    if (scanner.qrResults.length === 0) return;
    const latest = scanner.qrResults[0];
    if (latest.data !== lastResultRef.current) {
      lastResultRef.current = latest.data;
      setLastScanned(latest.data);
      setManualInput(latest.data);
      getCowByTag.mutate(latest.data, {
        onSuccess: (cow) => setFoundCow(cow),
        onError: () => setFoundCow(null),
      });
    }
  }, [scanner.qrResults, getCowByTag]);

  async function handleManualSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setLastScanned(manualInput.trim());
    getCowByTag.mutate(manualInput.trim(), {
      onSuccess: (cow) => setFoundCow(cow),
      onError: () => setFoundCow(null),
    });
  }

  function handleStop() {
    scanner.stopScanning();
    setFoundCow(undefined);
    lastResultRef.current = "";
  }

  function handleScanAgain() {
    setFoundCow(undefined);
    setLastScanned("");
    setManualInput("");
    lastResultRef.current = "";
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <ScanLine className="h-6 w-6 text-primary" />
          {t("scannerTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {lang === "hi"
            ? "गाय का QR/Barcode स्कैन करके उसकी जानकारी देखें"
            : "Scan a cow's QR or barcode to view its details"}
        </p>
      </div>

      {/* Camera Preview */}
      <div className="relative bg-black rounded-2xl overflow-hidden aspect-video mb-4 shadow-lg border border-border">
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          autoPlay
          playsInline
          muted
          className={cn(
            "w-full h-full object-cover",
            !scanner.isActive && "opacity-0",
          )}
        />
        <canvas
          ref={canvasRef as React.RefObject<HTMLCanvasElement>}
          className="hidden"
        />

        {/* Scanning overlay — larger frame */}
        {scanner.isActive && scanner.isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-4">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 border-2 border-primary/70 rounded-xl" />
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_2px_rgba(var(--primary),0.5)]"
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              />
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-6 h-6 border-primary border-2 border-r-0 border-b-0 rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-6 h-6 border-primary border-2 border-l-0 border-b-0 rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-primary border-2 border-r-0 border-t-0 rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-primary border-2 border-l-0 border-t-0 rounded-br-sm" />
            </div>
            {/* Instruction hint below frame */}
            <p className="text-white/80 text-xs text-center px-4 bg-black/40 rounded-lg py-1.5">
              {lang === "hi"
                ? "Tag या QR Code frame के अंदर रखो"
                : "Place tag or QR code inside the frame"}
            </p>
          </div>
        )}

        {/* Idle placeholder */}
        {!scanner.isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <Camera className="h-12 w-12 text-white/40" />
            <p className="text-white/60 text-sm text-center px-4">
              {lang === "hi"
                ? "स्कैनिंग शुरू करने के लिए नीचे दबाएं"
                : "Press Start Scanning below"}
            </p>
          </div>
        )}

        {/* Error overlay */}
        {scanner.error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-4">
            <CameraOff className="h-10 w-10 text-red-400" />
            <p className="text-red-300 text-sm text-center">
              {scanner.error.type === "permission"
                ? lang === "hi"
                  ? "कैमरा अनुमति नहीं मिली। Browser settings में अनुमति दें।"
                  : "Camera permission denied. Please allow camera access."
                : scanner.error.type === "not-found"
                  ? lang === "hi"
                    ? "कोई कैमरा नहीं मिला"
                    : "No camera found"
                  : lang === "hi"
                    ? `कैमरा त्रुटि: ${scanner.error.message}`
                    : `Camera error: ${scanner.error.message}`}
            </p>
          </div>
        )}
      </div>

      {/* Scanner Controls */}
      <div className="flex gap-2 mb-6" data-ocid="scanner.controls.panel">
        {!scanner.isScanning ? (
          <Button
            className="flex-1 gap-2"
            onClick={() => scanner.startScanning()}
            disabled={scanner.isLoading || !scanner.isReady}
            data-ocid="scanner.start.button"
          >
            <QrCode className="h-4 w-4" />
            {scanner.isLoading
              ? lang === "hi"
                ? "लोड हो रहा है..."
                : "Loading..."
              : t("startScanning")}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="flex-1 gap-2 border-destructive text-destructive hover:bg-destructive/10"
            onClick={handleStop}
            data-ocid="scanner.stop.button"
          >
            <X className="h-4 w-4" />
            {t("stopScanning")}
          </Button>
        )}
        {isMobile && scanner.isActive && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => scanner.switchCamera()}
            disabled={scanner.isLoading}
            title={t("switchCamera")}
            data-ocid="scanner.switch_camera.button"
          >
            <FlipHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Last Scanned indicator */}
      <AnimatePresence>
        {lastScanned && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mb-4 flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg border border-border"
          >
            <QrCode className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate font-mono text-xs">{lastScanned}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Search */}
      <form onSubmit={handleManualSearch} className="flex gap-2 mb-6">
        <Input
          data-ocid="scanner.manual.search_input"
          placeholder={t("manualSearch")}
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          variant="outline"
          size="icon"
          disabled={getCowByTag.isPending || !manualInput.trim()}
          data-ocid="scanner.manual.search_button"
        >
          {getCowByTag.isPending ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              <Search className="h-4 w-4" />
            </motion.div>
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Results */}
      <AnimatePresence mode="wait">
        {getCowByTag.isPending && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-ocid="scanner.result.loading_state"
            className="flex items-center justify-center gap-2 py-8 text-muted-foreground"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              <QrCode className="h-5 w-5" />
            </motion.div>
            <span className="text-sm">
              {lang === "hi" ? "खोज रहे हैं..." : "Searching..."}
            </span>
          </motion.div>
        )}
        {!getCowByTag.isPending &&
          foundCow !== undefined &&
          (foundCow ? (
            <motion.div
              key="found"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-semibold text-green-700">
                    {t("cowFound")}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScanAgain}
                  data-ocid="scanner.start.button"
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {lang === "hi" ? "दोबारा स्कैन करो" : "Scan Again"}
                </Button>
              </div>
              <CowResultCard cow={foundCow} lang={lang} />
            </motion.div>
          ) : (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              data-ocid="scanner.result.error_state"
              className="flex flex-col items-center gap-3 py-8"
            >
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-red-400" />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {t("cowNotFound")}
              </p>
              {lastScanned && (
                <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                  "{lastScanned}"
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleScanAgain}
                data-ocid="scanner.start.button"
                className="gap-1.5 text-xs mt-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {lang === "hi" ? "दोबारा स्कैन करो" : "Scan Again"}
              </Button>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}
