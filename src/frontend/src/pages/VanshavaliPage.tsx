import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Baby, GitBranch, ScanLine, Search, Tag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Cow } from "../backend.d";
import {
  useGetCalvesByCow,
  useGetCowById,
  useGetCowByTag,
} from "../hooks/useQueries";
import { useLang } from "../lib/LanguageContext";
import { useQRScanner } from "../qr-code/useQRScanner";

function formatAgpId(id: bigint): string {
  return `AGA${id.toString().padStart(5, "0")}`;
}

function parseAgpId(input: string): bigint | null {
  const match = input
    .trim()
    .toUpperCase()
    .match(/^AGA(\d+)$/);
  if (match) return BigInt(Number.parseInt(match[1], 10));
  return null;
}

function CalvesList({ cowId }: { cowId: bigint }) {
  const { data: calves, isLoading } = useGetCalvesByCow(cowId);
  const { lang } = useLang();

  if (isLoading) {
    return (
      <p className="text-amber-700 text-sm">
        {lang === "hi" ? "लोड हो रहा है..." : "Loading..."}
      </p>
    );
  }

  if (!calves || calves.length === 0) {
    return (
      <div
        className="text-center py-6 text-amber-600"
        data-ocid="vanshavali.empty_state"
      >
        <Baby className="mx-auto mb-2 opacity-40" size={32} />
        <p className="text-sm">
          {lang === "hi" ? "कोई संतान नहीं मिली" : "No offspring found"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {calves.map((calf, idx) => (
        <div
          key={calf.id.toString()}
          className="bg-amber-50 border border-amber-200 rounded-lg p-3"
          data-ocid={`vanshavali.item.${idx + 1}`}
        >
          <div className="flex flex-wrap gap-2 items-center mb-1">
            <Badge className="bg-pink-100 text-pink-700 border border-pink-200 text-xs">
              {calf.gender === "male"
                ? lang === "hi"
                  ? "बछड़ा"
                  : "Male Calf"
                : lang === "hi"
                  ? "बछड़ी"
                  : "Female Calf"}
            </Badge>
            {calf.tagNumber && (
              <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 text-xs">
                <Tag size={10} className="mr-1" />
                {calf.tagNumber}
              </Badge>
            )}
            <span className="text-xs text-amber-700">
              {lang === "hi" ? "जन्म" : "Born"}: {calf.birthMonth.toString()}/
              {calf.birthYear.toString()}
            </span>
          </div>
          {calf.notes && <p className="text-xs text-gray-600">{calf.notes}</p>}
        </div>
      ))}
    </div>
  );
}

function QRScanSection({ onScanned }: { onScanned: (val: string) => void }) {
  const { lang } = useLang();
  const [active, setActive] = useState(false);
  const lastRef = useRef("");
  const scanner = useQRScanner({ facingMode: "environment" });
  const { videoRef, canvasRef } = scanner;

  useEffect(() => {
    if (scanner.qrResults.length === 0) return;
    const latest = scanner.qrResults[0];
    if (latest.data !== lastRef.current) {
      lastRef.current = latest.data;
      onScanned(latest.data);
      scanner.stopScanning();
      setActive(false);
    }
  }, [scanner.qrResults, onScanned, scanner]);

  function startScan() {
    setActive(true);
    scanner.startScanning();
  }

  function stopScan() {
    scanner.stopScanning();
    setActive(false);
    lastRef.current = "";
  }

  if (!active) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={startScan}
        className="border-green-400 text-green-700 hover:bg-green-50"
      >
        <ScanLine size={16} className="mr-1" />
        {lang === "hi" ? "स्कैन करें" : "Scan Tag"}
      </Button>
    );
  }

  return (
    <div className="border border-green-300 rounded-xl overflow-hidden bg-black relative">
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        autoPlay
        playsInline
        muted
        className="w-full aspect-video object-cover"
      >
        <track kind="captions" />
      </video>
      <canvas
        ref={canvasRef as React.RefObject<HTMLCanvasElement>}
        className="hidden"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="border-2 border-yellow-400 w-48 h-24 rounded-lg opacity-70" />
        <p className="text-white text-xs mt-2 bg-black/60 px-2 py-1 rounded">
          {lang === "hi"
            ? "Tag/QR frame के अंदर रखें"
            : "Place tag/QR inside frame"}
        </p>
      </div>
      <button
        type="button"
        onClick={stopScan}
        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function VanshavaliPage() {
  const { lang } = useLang();
  const [tagInput, setTagInput] = useState("");
  const [searchedCow, setSearchedCow] = useState<Cow | null | undefined>(
    undefined,
  );
  const getCowByTag = useGetCowByTag();
  const getCowById = useGetCowById();

  const isPending = getCowByTag.isPending || getCowById.isPending;

  async function searchCow(val: string) {
    const input = val.trim();
    if (!input) return;
    try {
      const agpId = parseAgpId(input);
      if (agpId !== null) {
        const cow = await getCowById.mutateAsync(agpId);
        setSearchedCow(cow);
      } else {
        const cow = await getCowByTag.mutateAsync(input);
        setSearchedCow(cow);
      }
    } catch {
      setSearchedCow(null);
    }
  }

  async function handleSearch() {
    await searchCow(tagInput);
  }

  function handleScanned(val: string) {
    setTagInput(val);
    searchCow(val);
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="text-green-700" size={24} />
        <h1 className="text-2xl font-bold text-green-800">
          {lang === "hi" ? "वंशावली" : "Vanshavali"}
        </h1>
      </div>
      <p className="text-sm text-amber-700">
        {lang === "hi"
          ? "AGA00001 ID, टैग नंबर, या QR स्कैन करके गाय की संतान की सूची देखें"
          : "Search by AGA ID, tag number, or scan QR to see offspring list"}
      </p>

      {/* QR Scanner */}
      <QRScanSection onScanned={handleScanned} />

      {/* Search */}
      <div className="flex gap-2">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={
            lang === "hi"
              ? "AGA00001 या टैग नंबर दर्ज करें"
              : "Enter AGA00001 or Tag Number"
          }
          className="border-amber-300 focus:ring-green-500"
          data-ocid="vanshavali.search_input"
        />
        <Button
          onClick={handleSearch}
          disabled={isPending}
          className="bg-green-700 hover:bg-green-800 text-white"
          data-ocid="vanshavali.primary_button"
        >
          <Search size={16} className="mr-1" />
          {lang === "hi" ? "खोजें" : "Search"}
        </Button>
      </div>

      {/* Loading */}
      {isPending && (
        <div className="text-center py-4" data-ocid="vanshavali.loading_state">
          <p className="text-amber-700 text-sm">
            {lang === "hi" ? "खोज रहे हैं..." : "Searching..."}
          </p>
        </div>
      )}

      {/* No cow found */}
      {searchedCow === null && !isPending && (
        <div
          className="text-center py-8 text-amber-600"
          data-ocid="vanshavali.error_state"
        >
          <p className="text-sm font-medium">
            {lang === "hi" ? "कोई गाय नहीं मिली" : "No cow found"}
          </p>
          <p className="text-xs mt-1">
            {lang === "hi"
              ? "AGA ID या टैग नंबर जाँचें और फिर कोशिश करें"
              : "Check the AGA ID or tag number and try again"}
          </p>
        </div>
      )}

      {/* Cow found */}
      {searchedCow && (
        <div className="space-y-4">
          {/* Cow details card */}
          <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm">
            <div className="flex flex-wrap gap-2 items-center mb-2">
              <Badge className="bg-green-100 text-green-800 border border-green-200 font-mono text-xs">
                {formatAgpId(searchedCow.id)}
              </Badge>
              {searchedCow.tagNumber && (
                <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 text-xs">
                  <Tag size={10} className="mr-1" />
                  {searchedCow.tagNumber}
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-bold text-green-900 mb-1">
              {searchedCow.name}
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
              {searchedCow.breed && (
                <div>
                  <span className="font-medium text-amber-800">
                    {lang === "hi" ? "नस्ल" : "Breed"}:{" "}
                  </span>
                  {searchedCow.breed}
                </div>
              )}
              <div>
                <span className="font-medium text-amber-800">
                  {lang === "hi" ? "स्वास्थ्य" : "Health"}:{" "}
                </span>
                {searchedCow.healthStatus}
              </div>
            </div>
          </div>

          {/* Calves list */}
          <div>
            <h3 className="text-base font-semibold text-green-800 mb-3 flex items-center gap-2">
              <Baby size={18} />
              {lang === "hi" ? "संतान की सूची" : "Offspring List"}
            </h3>
            <CalvesList cowId={searchedCow.id} />
          </div>
        </div>
      )}
    </div>
  );
}
