import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Baby,
  Calendar,
  PawPrint as CowIcon,
  Eye,
  Pencil,
  Plus,
  QrCode,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Calf, Cow } from "../backend.d";
import {
  useAddCalf,
  useAddCow,
  useDeleteCalf,
  useDeleteCow,
  useGetAllCows,
  useGetCalvesByCow,
  useUpdateCow,
} from "../hooks/useQueries";
import { useAuth } from "../lib/AuthContext";
import { useLang } from "../lib/LanguageContext";
import {
  calcAgeFromBirth,
  decodeBirthDate,
  encodeBirthDate,
  formatTime,
} from "../utils/timeUtils";

interface CowRegistryProps {
  onViewHealth: (id: bigint) => void;
  prakarFilter?: string | null;
  onClearPrakarFilter?: () => void;
  changedBy: string;
}

const getAgpId = (id: number | bigint) => `AGA${String(id).padStart(5, "0")}`;

const DEFAULT_BREEDS = [
  { hi: "जर्सी", en: "Jersey" },
  { hi: "होलस्टीन फ्रिजियन", en: "Holstein Friesian (HF)" },
  { hi: "गिर", en: "Gir" },
  { hi: "साहिवाल", en: "Sahiwal" },
  { hi: "लाल सिंधी", en: "Red Sindhi" },
  { hi: "थारपारकर", en: "Tharparkar" },
  { hi: "राठी", en: "Rathi" },
  { hi: "हरियाणा", en: "Hariana" },
  { hi: "कांकरेज", en: "Kankrej" },
  { hi: "देवनी", en: "Deoni" },
  { hi: "ओंगोल", en: "Ongole" },
  { hi: "कृष्णा वैली", en: "Krishna Valley" },
  { hi: "मेवाती", en: "Mewati" },
  { hi: "निम्बारी", en: "Nimari" },
  { hi: "डांगी", en: "Dangi" },
  { hi: "गावलाओ", en: "Gaolao" },
  { hi: "लाल कंधारी", en: "Red Kandhari" },
  { hi: "पुंगनूर", en: "Punganur" },
  { hi: "वेचुर", en: "Vechur" },
  { hi: "नागौरी", en: "Nagori" },
  { hi: "मालवी", en: "Malvi" },
  { hi: "हल्लीकर", en: "Hallikar" },
  { hi: "अमृतमहल", en: "Amritmahal" },
  { hi: "खिल्लारी", en: "Khillari" },
  { hi: "कंगायम", en: "Kangayam" },
  { hi: "बरगुर", en: "Bargur" },
  { hi: "उम्बलाचेरी", en: "Umblachery" },
  { hi: "केनकथा", en: "Ken katha" },
  { hi: "खेरीगढ़", en: "Kherigarh" },
  { hi: "ब्राउन स्विस (क्रॉस)", en: "Brown Swiss (Cross)" },
];
const CUSTOM_BREEDS_KEY = "customBreeds";

const defaultForm = {
  name: "",
  breed: "",
  birthMonth: "",
  birthYear: "",
  healthStatus: "Healthy",
  prakar: "none",
  description: "",
  tagNumber: "",
  qrCode: "",
};

const defaultCalfForm = {
  birthMonth: "",
  birthYear: "",
  gender: "bachdi",
  tagNumber: "",
  notes: "",
};

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

// Map from prakar chip value to healthStatus stored in backend
const prakarToStatus: Record<string, string> = {
  Lactating: "Lactating",
  Pregnant: "Pregnant",
  Dry: "Dry",
  Bull: "Bull",
  "Calf-F": "Calf-F",
  "Calf-M": "Calf-M",
  Retired: "Retired",
  "Retired-Bull": "Retired-Bull",
};

// Prakar chip display labels
const prakarChips = [
  { value: "Lactating", en: "Lactating", hi: "दूजनी" },
  { value: "Pregnant", en: "Pregnant", hi: "गाभिन" },
  { value: "Dry", en: "Dry", hi: "वसुकी" },
  { value: "Bull", en: "Bull", hi: "नंदी" },
  { value: "Calf-F", en: "Calf-F", hi: "बछड़ी" },
  { value: "Calf-M", en: "Calf-M", hi: "बछड़ा" },
  { value: "Retired", en: "Retired", hi: "निवृत्त गाय" },
  { value: "Retired-Bull", en: "Retired Nandi", hi: "निवृत्त नंदी" },
];

// Color map per prakar for card accents
const prakarColors: Record<
  string,
  { bg: string; badge: string; border: string; badgeText: string }
> = {
  Lactating: {
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-800",
    border: "border-l-amber-400",
    badgeText: "दूजनी",
  },
  Pregnant: {
    bg: "bg-rose-50",
    badge: "bg-rose-100 text-rose-800",
    border: "border-l-rose-400",
    badgeText: "गाभिन",
  },
  Dry: {
    bg: "bg-lime-50",
    badge: "bg-lime-100 text-lime-800",
    border: "border-l-lime-400",
    badgeText: "वसुकी",
  },
  Bull: {
    bg: "bg-sky-50",
    badge: "bg-sky-100 text-sky-800",
    border: "border-l-sky-400",
    badgeText: "नंदी",
  },
  "Calf-F": {
    bg: "bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-800",
    border: "border-l-yellow-400",
    badgeText: "बछड़ी",
  },
  "Calf-M": {
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-800",
    border: "border-l-blue-400",
    badgeText: "बछड़ा",
  },
  Retired: {
    bg: "bg-pink-50",
    badge: "bg-pink-100 text-pink-800",
    border: "border-l-pink-400",
    badgeText: "निवृत्त गाय",
  },
  "Retired-Bull": {
    bg: "bg-purple-50",
    badge: "bg-purple-100 text-purple-800",
    border: "border-l-purple-400",
    badgeText: "निवृत्त नंदी",
  },
  Healthy: {
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-800",
    border: "border-l-green-400",
    badgeText: "स्वस्थ",
  },
  Sick: {
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-800",
    border: "border-l-red-400",
    badgeText: "बीमार",
  },
  Recovering: {
    bg: "bg-teal-50",
    badge: "bg-teal-100 text-teal-800",
    border: "border-l-teal-400",
    badgeText: "स्वस्थ हो रही है",
  },
};

function getPrakarColors(status: string) {
  return (
    prakarColors[status] ?? {
      bg: "bg-muted/40",
      badge: "bg-muted text-muted-foreground",
      border: "border-l-muted",
      badgeText: status,
    }
  );
}

function getPrakarLabel(status: string, lang: "en" | "hi") {
  const chip = prakarChips.find((c) => c.value === status);
  if (chip) return lang === "hi" ? chip.hi : chip.en;
  // health statuses
  if (status === "Healthy") return lang === "hi" ? "स्वस्थ" : "Healthy";
  if (status === "Sick") return lang === "hi" ? "बीमार" : "Sick";
  if (status === "Recovering")
    return lang === "hi" ? "स्वस्थ हो रही है" : "Recovering";
  return status;
}

export default function CowRegistry({
  onViewHealth,
  prakarFilter,
  onClearPrakarFilter,
  changedBy,
}: CowRegistryProps) {
  const { t, lang } = useLang();
  const { canEdit } = useAuth();
  const { data: cows = [], isLoading } = useGetAllCows();
  const addCow = useAddCow();
  const updateCow = useUpdateCow();
  const deleteCow = useDeleteCow();
  const addCalf = useAddCalf();
  const deleteCalf = useDeleteCalf();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCow, setEditCow] = useState<Cow | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [customBreeds, setCustomBreeds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_BREEDS_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [customBreedInput, setCustomBreedInput] = useState("");
  const [activePrakar, setActivePrakar] = useState<string | null>(
    prakarFilter ?? null,
  );
  // Calves dialog state
  const [calvesCow, setCalvesCow] = useState<Cow | null>(null);
  const [calfForm, setCalfForm] = useState(defaultCalfForm);
  const { data: calves = [], isLoading: calvesLoading } = useGetCalvesByCow(
    calvesCow?.id ?? null,
  );

  // Sync external prakar filter prop → local state
  useEffect(() => {
    if (prakarFilter !== undefined) {
      setActivePrakar(prakarFilter);
    }
  }, [prakarFilter]);

  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear; y >= 1990; y--) {
    yearOptions.push(y);
  }

  // Filter by search + active prakar
  const filtered = cows.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.breed.toLowerCase().includes(search.toLowerCase());
    const matchPrakar = activePrakar
      ? c.healthStatus === prakarToStatus[activePrakar]
      : true;
    return matchSearch && matchPrakar;
  });

  // Which prakar chips have at least 1 cow
  const activePrakarChips = prakarChips.filter((chip) =>
    cows.some((c) => c.healthStatus === chip.value),
  );

  function openAdd() {
    setEditCow(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  const prakarValues = [
    "Lactating",
    "Pregnant",
    "Dry",
    "Bull",
    "Calf-F",
    "Calf-M",
    "Retired",
    "Retired-Bull",
  ];

  function openEdit(cow: Cow) {
    setEditCow(cow);
    const decoded = decodeBirthDate(cow.age);
    const isPrakar = prakarValues.includes(cow.healthStatus);
    setForm({
      name: cow.name,
      breed: cow.breed,
      birthMonth: decoded ? decoded.month.toString() : "1",
      birthYear: decoded
        ? decoded.year.toString()
        : cow.age.toString().slice(0, 4) || currentYear.toString(),
      healthStatus: isPrakar ? "Healthy" : cow.healthStatus,
      prakar: isPrakar ? cow.healthStatus : "none",
      description: cow.description,
      tagNumber: cow.tagNumber ?? "",
      qrCode: cow.qrCode ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(
        lang === "hi" ? "गाय का नाम दर्ज करें" : "Please enter cow name",
      );
      return;
    }
    if (!form.healthStatus || form.healthStatus === "") {
      toast.error(
        lang === "hi" ? "स्वास्थ्य स्थिति चुनें" : "Please select health status",
      );
      return;
    }
    if (form.prakar === "none" || !form.prakar) {
      toast.error(
        lang === "hi" ? "गाय का प्रकार चुनें" : "Please select cow type (Prakar)",
      );
      return;
    }
    const age = encodeBirthDate(
      Number.parseInt(form.birthYear) || currentYear,
      Number.parseInt(form.birthMonth) || 1,
    );
    const prakarVal = form.prakar === "none" ? "" : form.prakar;
    const finalStatus = prakarVal || form.healthStatus;
    let finalBreed = form.breed;
    if (form.breed === "any") {
      const trimmed = customBreedInput.trim();
      if (!trimmed) {
        toast.error(
          lang === "hi" ? "कृपया नस्ल दर्ज करें" : "Please enter breed name",
        );
        return;
      }
      const updated = [...customBreeds, trimmed];
      setCustomBreeds(updated);
      localStorage.setItem(CUSTOM_BREEDS_KEY, JSON.stringify(updated));
      setCustomBreedInput("");
      finalBreed = trimmed;
    }
    try {
      if (editCow) {
        await updateCow.mutateAsync({
          id: editCow.id,
          name: form.name,
          breed: finalBreed,
          age,
          healthStatus: finalStatus,
          description: form.description,
          tagNumber: form.tagNumber,
          qrCode: form.qrCode,
          changedBy,
        });
        toast.success(t("cowUpdated"));
      } else {
        await addCow.mutateAsync({
          name: form.name,
          breed: finalBreed,
          age,
          healthStatus: finalStatus,
          description: form.description,
          tagNumber: form.tagNumber,
          qrCode: form.qrCode,
          changedBy,
        });
        toast.success(t("cowAdded"));
      }
      setDialogOpen(false);
    } catch {
      toast.error(t("error"));
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    try {
      await deleteCow.mutateAsync({ id: deleteId, changedBy });
      toast.success(t("cowDeleted"));
      setDeleteId(null);
    } catch {
      toast.error(t("error"));
    }
  }

  async function handleAddCalf(e: React.FormEvent) {
    e.preventDefault();
    if (!calvesCow) return;
    if (!calfForm.birthMonth || !calfForm.birthYear) {
      toast.error(
        lang === "hi" ? "जन्म महीना और वर्ष भरें" : "Enter birth month and year",
      );
      return;
    }
    // Validate: calf's birth year cannot be before mother's approximate birth year
    const calfBirthYear = Number.parseInt(calfForm.birthYear);
    const calfBirthMonth = Number.parseInt(calfForm.birthMonth);
    if (calvesCow.age && Number(calvesCow.age) > 0) {
      const motherApproxBirthYear = currentYear - Number(calvesCow.age);
      if (
        calfBirthYear < motherApproxBirthYear ||
        (calfBirthYear === motherApproxBirthYear && calfBirthMonth < 1)
      ) {
        toast.error(
          lang === "hi"
            ? `बच्चे की उम्र माँ से ज़्यादा नहीं हो सकती (माँ लगभग ${motherApproxBirthYear} में पैदा हुई)`
            : `Calf's birth year cannot be before mother's birth year (mother born ~${motherApproxBirthYear})`,
        );
        return;
      }
    }
    try {
      await addCalf.mutateAsync({
        cowId: calvesCow.id,
        birthMonth: BigInt(calfForm.birthMonth),
        birthYear: BigInt(calfForm.birthYear),
        gender: calfForm.gender,
        tagNumber: calfForm.tagNumber,
        notes: calfForm.notes,
        changedBy,
      });
      toast.success(t("calfAdded"));
      setCalfForm(defaultCalfForm);
    } catch {
      toast.error(t("error"));
    }
  }

  async function handleDeleteCalf(id: bigint) {
    try {
      await deleteCalf.mutateAsync({ id, changedBy });
      toast.success(t("calfDeleted"));
    } catch {
      toast.error(t("error"));
    }
  }

  const isPending = addCow.isPending || updateCow.isPending;

  // Swasthya Stithi - sirf 3 options
  const healthStatusOptions = [
    { value: "Healthy", en: "Healthy", hi: "स्वस्थ" },
    { value: "Recovering", en: "Recovering", hi: "स्वस्थ हो रही है" },
    { value: "Sick", en: "Sick", hi: "बीमार" },
  ];

  // Prakar (Type) dropdown
  const prakarOptions = [
    { value: "Lactating", en: "Lactating (दूजनी)", hi: "दूजनी" },
    { value: "Pregnant", en: "Pregnant (गाभिन)", hi: "गाभिन" },
    { value: "Dry", en: "Dry (वसुकी)", hi: "वसुकी" },
    { value: "Bull", en: "Bull (नंदी)", hi: "नंदी" },
    { value: "Calf-F", en: "Calf-F (बछड़ी)", hi: "बछड़ी" },
    { value: "Calf-M", en: "Calf-M (बछड़ा)", hi: "बछड़ा" },
    { value: "Retired", en: "Retired Gay (निवृत्त गाय)", hi: "निवृत्त गाय" },
    { value: "Retired-Bull", en: "Retired Nandi (निवृत्त नंदी)", hi: "निवृत्त नंदी" },
  ];

  function handlePrakarChipClick(value: string | null) {
    setActivePrakar(value);
    if (value === null && onClearPrakarFilter) {
      onClearPrakarFilter();
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <CowIcon className="h-6 w-6 text-primary" />
            {t("cowRegistry")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "hi"
              ? `कुल ${cows.length} गाय`
              : `${cows.length} cows registered`}
          </p>
        </div>
        {canEdit && (
          <Button
            data-ocid="cow.add_button"
            onClick={openAdd}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            {t("addCow")}
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-ocid="cow.search_input"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Prakar Filter Chips */}
      {!isLoading && (
        <div className="flex flex-wrap gap-2 mb-5" data-ocid="cow.filter.panel">
          <button
            type="button"
            data-ocid="cow.filter.tab"
            onClick={() => handlePrakarChipClick(null)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
              activePrakar === null
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/60 text-muted-foreground border-border hover:bg-muted",
            )}
          >
            {lang === "hi" ? "सभी" : "All"}
          </button>
          {activePrakarChips.map((chip) => (
            <button
              key={chip.value}
              type="button"
              data-ocid="cow.filter.tab"
              onClick={() =>
                handlePrakarChipClick(
                  chip.value === activePrakar ? null : chip.value,
                )
              }
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                activePrakar === chip.value
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/60 text-muted-foreground border-border hover:bg-muted",
              )}
            >
              {lang === "hi" ? chip.hi : chip.en}
            </button>
          ))}
        </div>
      )}

      {/* Table / Cards */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="cow.loading_state">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-ocid="cow.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <CowIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t("noCows")}</p>
          <Button onClick={openAdd} variant="outline" className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            {t("addCow")}
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div
            data-ocid="cow.table"
            className="hidden md:block bg-card rounded-2xl border border-border shadow-card overflow-hidden"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    {t("cowName")}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    {t("breed")}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    {t("age")}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    {lang === "hi" ? "प्रकार" : "Type"}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    {t("addedDate")}
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cow, idx) => {
                  const colors = getPrakarColors(cow.healthStatus);
                  return (
                    <motion.tr
                      key={cow.id.toString()}
                      data-ocid={`cow.item.${idx + 1}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                              colors.bg,
                            )}
                          >
                            <span className="text-xs font-bold">
                              {cow.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-foreground">
                                {cow.name}
                              </p>
                              {cow.tagNumber && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-4 bg-yellow-50 text-yellow-700 border-yellow-300 gap-0.5"
                                >
                                  <Tag className="h-2.5 w-2.5" />
                                  {cow.tagNumber}
                                </Badge>
                              )}
                              {true && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-4 bg-green-50 text-green-700 border-green-300"
                                >
                                  {getAgpId(cow.id)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {cow.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {cow.breed}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {calcAgeFromBirth(cow.age).display(lang)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium",
                            colors.badge,
                          )}
                        >
                          {getPrakarLabel(cow.healthStatus, lang)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatTime(cow.addedDate, lang)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                            onClick={() => onViewHealth(cow.id)}
                            title={t("viewHealth")}
                            data-ocid={`cow.secondary_button.${idx + 1}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-pink-500"
                            onClick={() => {
                              setCalvesCow(cow);
                              setCalfForm(defaultCalfForm);
                            }}
                            title={t("viewCalves")}
                            data-ocid={`cow.calves_button.${idx + 1}`}
                          >
                            <Baby className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                            onClick={() => openEdit(cow)}
                            data-ocid={`cow.edit_button.${idx + 1}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(cow.id)}
                            data-ocid={`cow.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards — reference image-2 style */}
          <div className="md:hidden space-y-3">
            {filtered.map((cow, idx) => {
              const colors = getPrakarColors(cow.healthStatus);
              const birthDecoded = decodeBirthDate(cow.age);
              const birthLabel = birthDecoded
                ? `${MONTH_NAMES_HI[birthDecoded.month - 1]} ${birthDecoded.year}`
                : null;
              return (
                <motion.div
                  key={cow.id.toString()}
                  data-ocid={`cow.item.${idx + 1}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "border border-border rounded-xl shadow-sm overflow-hidden",
                    "border-l-4",
                    colors.border,
                  )}
                >
                  {/* Card top: avatar + name + badges + actions */}
                  <div
                    className={cn(
                      "flex items-start gap-3 p-3.5 pb-2",
                      colors.bg,
                    )}
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-white/80 border border-white shadow-sm flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-foreground/70">
                        {cow.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Name + badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-foreground text-base leading-tight">
                          {cow.name}
                        </p>
                        {/* Edit + Delete icons */}
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => openEdit(cow)}
                            data-ocid={`cow.edit_button.${idx + 1}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-white/60 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(cow.id)}
                            data-ocid={`cow.delete_button.${idx + 1}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-white/60 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Badges row */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {cow.tagNumber ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5 bg-yellow-50 text-yellow-700 border-yellow-300 gap-1"
                          >
                            <Tag className="h-2.5 w-2.5" />
                            TAG: {cow.tagNumber}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5 bg-yellow-50 text-yellow-700 border-yellow-300 gap-1"
                          >
                            <Tag className="h-2.5 w-2.5" />#{cow.id.toString()}
                          </Badge>
                        )}
                        {true && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5 bg-green-50 text-green-700 border-green-300"
                          >
                            {getAgpId(cow.id)}
                          </Badge>
                        )}
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                            colors.badge,
                          )}
                        >
                          {getPrakarLabel(cow.healthStatus, lang)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card body: details */}
                  <div className="bg-white px-3.5 py-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {birthLabel && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="font-medium text-foreground/70">
                          {lang === "hi" ? "जन्म:" : "Born:"}
                        </span>
                        <span>{birthLabel}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CowIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="font-medium text-foreground/70">
                        {lang === "hi" ? "उम्र:" : "Age:"}
                      </span>
                      <span>{calcAgeFromBirth(cow.age).display(lang)}</span>
                    </div>
                    {cow.breed && (
                      <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                        <span className="font-medium text-foreground/70">
                          {lang === "hi" ? "नस्ल:" : "Breed:"}
                        </span>
                        <span>{cow.breed}</span>
                      </div>
                    )}
                    {cow.description && (
                      <div className="col-span-2 text-muted-foreground line-clamp-1">
                        {cow.description}
                      </div>
                    )}
                  </div>

                  {/* Card footer: view health + calves buttons */}
                  <div className="bg-muted/20 border-t border-border/50 px-3.5 py-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-7 flex-1"
                      onClick={() => onViewHealth(cow.id)}
                      data-ocid={`cow.secondary_button.${idx + 1}`}
                    >
                      <Eye className="h-3 w-3" />
                      {t("viewHealth")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-7 flex-1 border-pink-200 text-pink-700 hover:bg-pink-50"
                      onClick={() => {
                        setCalvesCow(cow);
                        setCalfForm(defaultCalfForm);
                      }}
                      data-ocid={`cow.calves_button.${idx + 1}`}
                    >
                      <Baby className="h-3 w-3" />
                      {t("viewCalves")}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editCow ? t("editCow") : t("addCow")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("cowName")} *</Label>
              <Input
                data-ocid="cow.form.input"
                required
                placeholder={t("cowName")}
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("breed")} *</Label>
              <Select
                value={
                  DEFAULT_BREEDS.some(
                    (b) => (lang === "hi" ? b.hi : b.en) === form.breed,
                  ) || customBreeds.includes(form.breed)
                    ? form.breed
                    : form.breed
                      ? "any"
                      : undefined
                }
                onValueChange={(v) => {
                  if (v === "any") {
                    setForm((p) => ({ ...p, breed: "any" }));
                    setCustomBreedInput("");
                  } else {
                    setForm((p) => ({ ...p, breed: v }));
                    setCustomBreedInput("");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={lang === "hi" ? "नस्ल चुनें" : "Select breed"}
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[280px] overflow-y-auto">
                  {DEFAULT_BREEDS.map((b) => {
                    const label = lang === "hi" ? b.hi : b.en;
                    return (
                      <SelectItem key={b.en} value={label}>
                        {label}
                      </SelectItem>
                    );
                  })}
                  {customBreeds.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                  <SelectItem value="any">
                    {lang === "hi" ? "अन्य (दर्ज करें)" : "Other (enter)"}
                  </SelectItem>
                </SelectContent>
              </Select>
              {(form.breed === "any" ||
                (!DEFAULT_BREEDS.some(
                  (b) => (lang === "hi" ? b.hi : b.en) === form.breed,
                ) &&
                  !customBreeds.includes(form.breed) &&
                  form.breed !== "")) && (
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder={
                      lang === "hi" ? "नई नस्ल का नाम लिखें" : "Enter breed name"
                    }
                    value={customBreedInput}
                    onChange={(e) => setCustomBreedInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customBreedInput.trim()) {
                        e.preventDefault();
                        const nb = customBreedInput.trim();
                        const updated = [...customBreeds, nb];
                        setCustomBreeds(updated);
                        localStorage.setItem(
                          CUSTOM_BREEDS_KEY,
                          JSON.stringify(updated),
                        );
                        setForm((p) => ({ ...p, breed: nb }));
                        setCustomBreedInput("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const nb = customBreedInput.trim();
                      if (!nb) return;
                      const updated = [...customBreeds, nb];
                      setCustomBreeds(updated);
                      localStorage.setItem(
                        CUSTOM_BREEDS_KEY,
                        JSON.stringify(updated),
                      );
                      setForm((p) => ({ ...p, breed: nb }));
                      setCustomBreedInput("");
                    }}
                  >
                    {lang === "hi" ? "जोड़ें" : "Add"}
                  </Button>
                </div>
              )}
            </div>
            {/* Birth Month + Birth Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("birthMonth")}</Label>
                <Select
                  value={form.birthMonth}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, birthMonth: v }))
                  }
                >
                  <SelectTrigger data-ocid="cow.form.birthmonth.select">
                    <SelectValue
                      placeholder={lang === "hi" ? "महीना" : "Month"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES_EN.map((name, i) => (
                      <SelectItem key={name} value={(i + 1).toString()}>
                        {i + 1} - {lang === "hi" ? MONTH_NAMES_HI[i] : name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("birthYear")}</Label>
                <Select
                  value={form.birthYear}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, birthYear: v }))
                  }
                >
                  <SelectTrigger data-ocid="cow.form.birthyear.select">
                    <SelectValue placeholder={lang === "hi" ? "वर्ष" : "Year"} />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("healthStatus")}</Label>
                <Select
                  value={form.healthStatus}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, healthStatus: v }))
                  }
                >
                  <SelectTrigger data-ocid="cow.form.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {healthStatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {lang === "hi" ? opt.hi : opt.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{lang === "hi" ? "प्रकार" : "Type"}</Label>
                <Select
                  value={form.prakar}
                  onValueChange={(v) => setForm((p) => ({ ...p, prakar: v }))}
                >
                  <SelectTrigger data-ocid="cow.form.prakar.select">
                    <SelectValue
                      placeholder={lang === "hi" ? "प्रकार चुनें" : "Select type"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {lang === "hi" ? "— कोई नहीं —" : "— None —"}
                    </SelectItem>
                    {prakarOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {lang === "hi" ? opt.hi : opt.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Tag Number + QR Code */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("tagNumber")}
                </Label>
                <Input
                  data-ocid="cow.form.tag_input"
                  placeholder={lang === "hi" ? "टैग नंबर / Tag No." : "Tag No."}
                  value={form.tagNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tagNumber: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("qrCode")}
                </Label>
                <Input
                  data-ocid="cow.form.qr_input"
                  placeholder={
                    lang === "hi" ? "QR/Barcode ID" : "QR/Barcode ID"
                  }
                  value={form.qrCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, qrCode: e.target.value }))
                  }
                />
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {lang === "hi"
                    ? "पहली बार स्कैन से या manually भरें"
                    : "Enter manually or scan QR"}
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("description")}</Label>
              <Textarea
                placeholder={t("description")}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="cow.form.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                data-ocid="cow.form.submit_button"
                disabled={isPending}
              >
                {isPending ? t("saving") : editCow ? t("save") : t("addCow")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {t("confirmDelete")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmMsg")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="cow.form.cancel_button">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="cow.delete_button.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCow.isPending ? t("saving") : t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Calves Dialog */}
      <Dialog
        open={calvesCow !== null}
        onOpenChange={(o) => {
          if (!o) setCalvesCow(null);
        }}
      >
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="cow.calves.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Baby className="h-5 w-5 text-pink-500" />
              {calvesCow
                ? lang === "hi"
                  ? `${calvesCow.name} के बच्चे`
                  : `${calvesCow.name}'s Calves`
                : t("calves")}
            </DialogTitle>
          </DialogHeader>

          {/* Add Calf Form */}
          <form
            onSubmit={handleAddCalf}
            className="space-y-3 border border-border rounded-xl p-4 bg-muted/20"
          >
            <p className="text-sm font-semibold text-foreground">
              {t("addCalf")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("birthMonth")}</Label>
                <Select
                  value={calfForm.birthMonth}
                  onValueChange={(v) =>
                    setCalfForm((p) => ({ ...p, birthMonth: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="calf.form.birthmonth.select"
                    className="h-8 text-xs"
                  >
                    <SelectValue
                      placeholder={lang === "hi" ? "महीना" : "Month"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES_EN.map((name, i) => (
                      <SelectItem key={name} value={(i + 1).toString()}>
                        {i + 1} - {lang === "hi" ? MONTH_NAMES_HI[i] : name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("birthYear")}</Label>
                <Select
                  value={calfForm.birthYear}
                  onValueChange={(v) =>
                    setCalfForm((p) => ({ ...p, birthYear: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="calf.form.birthyear.select"
                    className="h-8 text-xs"
                  >
                    <SelectValue placeholder={lang === "hi" ? "वर्ष" : "Year"} />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("gender")}</Label>
                <Select
                  value={calfForm.gender}
                  onValueChange={(v) =>
                    setCalfForm((p) => ({ ...p, gender: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="calf.form.gender.select"
                    className="h-8 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bachdi">
                      {lang === "hi" ? "बछड़ी (मादा)" : "Bachdi (Female)"}
                    </SelectItem>
                    <SelectItem value="bachda">
                      {lang === "hi" ? "बछड़ा (नर)" : "Bachda (Male)"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {t("tagNumber")}
                </Label>
                <Input
                  data-ocid="calf.form.tag_input"
                  className="h-8 text-xs"
                  placeholder={lang === "hi" ? "टैग (वैकल्पिक)" : "Tag (optional)"}
                  value={calfForm.tagNumber}
                  onChange={(e) =>
                    setCalfForm((p) => ({ ...p, tagNumber: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("notes")}</Label>
              <Input
                data-ocid="calf.form.notes_input"
                className="h-8 text-xs"
                placeholder={
                  lang === "hi" ? "नोट्स (वैकल्पिक)" : "Notes (optional)"
                }
                value={calfForm.notes}
                onChange={(e) =>
                  setCalfForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
            <Button
              type="submit"
              size="sm"
              data-ocid="calf.form.submit_button"
              disabled={addCalf.isPending}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              {addCalf.isPending ? t("saving") : t("addCalf")}
            </Button>
          </form>

          {/* Calves List */}
          <div className="mt-2 space-y-2">
            {calvesLoading ? (
              <div data-ocid="calf.loading_state" className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : calves.length === 0 ? (
              <div
                data-ocid="calf.empty_state"
                className="text-center py-8 text-muted-foreground"
              >
                <Baby className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t("noCalves")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {calves.map((calf: Calf, idx: number) => {
                  const monthIdx = Number(calf.birthMonth) - 1;
                  const monthName =
                    lang === "hi"
                      ? (MONTH_NAMES_HI[monthIdx] ?? String(calf.birthMonth))
                      : (MONTH_NAMES_EN[monthIdx] ?? String(calf.birthMonth));
                  const isBachda = calf.gender === "bachda";
                  return (
                    <motion.div
                      key={calf.id.toString()}
                      data-ocid={`calf.item.${idx + 1}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                            isBachda
                              ? "bg-blue-100 text-blue-700"
                              : "bg-pink-100 text-pink-700",
                          )}
                        >
                          <Baby className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-semibold",
                                isBachda
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-pink-100 text-pink-700",
                              )}
                            >
                              {isBachda
                                ? lang === "hi"
                                  ? "बछड़ा"
                                  : "Bachda"
                                : lang === "hi"
                                  ? "बछड़ी"
                                  : "Bachdi"}
                            </span>
                            {calf.tagNumber && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 bg-yellow-50 text-yellow-700 border-yellow-300 gap-0.5"
                              >
                                <Tag className="h-2.5 w-2.5" />
                                {calf.tagNumber}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {lang === "hi" ? "जन्म:" : "Born:"} {monthName}{" "}
                            {String(calf.birthYear)}
                            {calf.notes ? ` • ${calf.notes}` : ""}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteCalf(calf.id)}
                        data-ocid={`calf.delete_button.${idx + 1}`}
                        disabled={deleteCalf.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              data-ocid="cow.calves.close_button"
              onClick={() => setCalvesCow(null)}
            >
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
