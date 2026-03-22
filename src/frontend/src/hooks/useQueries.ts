import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Announcement,
  Calf,
  ChangeLog,
  Cow,
  Donation,
  FeedHistory,
  FeedStock,
  HealthRecord,
  User,
} from "../backend.d";
import { useActor } from "./useActor";

// ── Cows ──────────────────────────────────────────────────────────────────────────
export function useGetAllCows() {
  const { actor, isFetching } = useActor();
  return useQuery<Cow[]>({
    queryKey: ["cows"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCows();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useAddCow() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      breed: string;
      age: bigint;
      healthStatus: string;
      description: string;
      tagNumber: string;
      qrCode: string;
      changedBy: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addCow(
        data.name,
        data.breed,
        data.age,
        data.healthStatus,
        data.description,
        data.tagNumber,
        data.qrCode,
        data.changedBy,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cows"] }).catch(() => {});
      qc.invalidateQueries({ queryKey: ["changelogs"] }).catch(() => {});
    },
  });
}

export function useUpdateCow() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      breed: string;
      age: bigint;
      healthStatus: string;
      description: string;
      tagNumber: string;
      qrCode: string;
      changedBy: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateCow(
        data.id,
        data.name,
        data.breed,
        data.age,
        data.healthStatus,
        data.description,
        data.tagNumber,
        data.qrCode,
        data.changedBy,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cows"] }).catch(() => {});
      qc.invalidateQueries({ queryKey: ["changelogs"] }).catch(() => {});
    },
  });
}

export function useDeleteCow() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: bigint; changedBy: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteCow(data.id, data.changedBy);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cows"] }).catch(() => {});
      qc.invalidateQueries({ queryKey: ["health"] }).catch(() => {});
      qc.invalidateQueries({ queryKey: ["changelogs"] }).catch(() => {});
    },
  });
}

// ── Donations ─────────────────────────────────────────────────────────────────────────
export function useGetAllDonations() {
  const { actor, isFetching } = useActor();
  return useQuery<Donation[]>({
    queryKey: ["donations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDonations();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useAddDonation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      donorName: string;
      amount: number;
      message: string;
      purpose: string;
      changedBy: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addDonation(
        data.donorName,
        data.amount,
        data.message,
        data.purpose,
        data.changedBy,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donations"] }).catch(() => {});
      qc.invalidateQueries({ queryKey: ["changelogs"] }).catch(() => {});
    },
  });
}

// ── Health Records ─────────────────────────────────────────────────────────────────────────
export function useGetHealthRecordsByCow(cowId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<HealthRecord[]>({
    queryKey: ["health", cowId?.toString()],
    queryFn: async () => {
      if (!actor || cowId === null) return [];
      return actor.getHealthRecordsByCow(cowId);
    },
    enabled: !!actor && !isFetching && cowId !== null,
    refetchInterval: 30000,
  });
}

export function useGetAllHealthRecords() {
  const { actor, isFetching } = useActor();
  return useQuery<HealthRecord[]>({
    queryKey: ["health", "all"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const cows = await actor.getAllCows();
        const results = await Promise.all(
          cows.map((c) =>
            actor.getHealthRecordsByCow(c.id).catch(() => [] as HealthRecord[]),
          ),
        );
        return results.flat();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useAddHealthRecord() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      cowId: bigint;
      notes: string;
      status: string;
      vetName: string;
      changedBy: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addHealthRecord(
        data.cowId,
        data.notes,
        data.status,
        data.vetName,
        data.changedBy,
      );
    },
    onSuccess: () => {
      // Use catch to prevent invalidation errors from propagating to mutateAsync
      qc.invalidateQueries({ queryKey: ["health"] }).catch(() => {});
      qc.invalidateQueries({ queryKey: ["changelogs"] }).catch(() => {});
    },
    onError: () => {
      // Still try to refresh data even on error, silently
      qc.invalidateQueries({ queryKey: ["health"] }).catch(() => {});
    },
  });
}

// ── Announcements ─────────────────────────────────────────────────────────────────────────
export function useGetActiveAnnouncements() {
  const { actor, isFetching } = useActor();
  return useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveAnnouncements();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useAddAnnouncement() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      titleHindi: string;
      content: string;
      contentHindi: string;
      isActive: boolean;
      changedBy: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addAnnouncement(
        data.title,
        data.titleHindi,
        data.content,
        data.contentHindi,
        data.isActive,
        data.changedBy,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] }).catch(() => {});
      qc.invalidateQueries({ queryKey: ["changelogs"] }).catch(() => {});
    },
  });
}

// ── Calves ──────────────────────────────────────────────────────────────────────────
export function useGetCalvesByCow(cowId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Calf[]>({
    queryKey: ["calves", cowId?.toString()],
    queryFn: async () => {
      if (!actor || cowId === null) return [];
      return actor.getCalvesByCow(cowId);
    },
    enabled: !!actor && !isFetching && cowId !== null,
    refetchInterval: 30000,
  });
}

export function useAddCalf() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      cowId: bigint;
      birthMonth: bigint;
      birthYear: bigint;
      gender: string;
      tagNumber: string;
      notes: string;
      changedBy: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addCalf(
        data.cowId,
        data.birthMonth,
        data.birthYear,
        data.gender,
        data.tagNumber,
        data.notes,
        data.changedBy,
      );
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["calves", variables.cowId.toString()],
      }).catch(() => {});
      qc.invalidateQueries({ queryKey: ["changelogs"] }).catch(() => {});
    },
  });
}

export function useDeleteCalf() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: bigint; changedBy: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteCalf(data.id, data.changedBy);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calves"] }).catch(() => {});
      qc.invalidateQueries({ queryKey: ["changelogs"] }).catch(() => {});
    },
  });
}

export function useGetCowByTag() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (tag: string): Promise<Cow | null> => {
      if (!actor) throw new Error("No actor");
      return actor.getCowByTag(tag);
    },
  });
}

export function useGetCowById() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (id: bigint): Promise<Cow | null> => {
      if (!actor) throw new Error("No actor");
      try {
        return await actor.getCow(id);
      } catch {
        return null;
      }
    },
  });
}
// ── Users ─────────────────────────────────────────────────────────────────────────
export function useGetAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60000,
  });
}

export function useGetOnlineUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint[]>({
    queryKey: ["onlineUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getOnlineUsers() as Promise<bigint[]>;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useCreateUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; role: string; pin: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.createUser(data.name, data.role, data.pin);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["users"] }).catch(() => {}),
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteUser(id);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["users"] }).catch(() => {}),
  });
}

export function useChangeUserPin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      newPin: string;
      changedBy: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).changeUserPin(data.id, data.newPin, data.changedBy);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["users"] }).catch(() => {}),
  });
}

// ── Change Logs ────────────────────────────────────────────────────────────────────────
export function useGetAllChangeLogs() {
  const { actor, isFetching } = useActor();
  return useQuery<ChangeLog[]>({
    queryKey: ["changelogs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllChangeLogs();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

// ── Feed Management ────────────────────────────────────────────────────────────────────────
export function useGetFeedStocks() {
  const { actor, isFetching } = useActor();
  return useQuery<FeedStock[]>({
    queryKey: ["feedStocks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFeedStocks();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useGetFeedHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<FeedHistory[]>({
    queryKey: ["feedHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFeedHistory();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useAddFeedStock() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      feedType: string;
      quantity: number;
      notes: string;
      recordedBy: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addFeedStockQuantity(
        data.feedType,
        data.quantity,
        data.notes,
        data.recordedBy,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedStocks"] }).catch(() => {});
      qc.invalidateQueries({ queryKey: ["feedHistory"] }).catch(() => {});
    },
  });
}

export function useRecordFeedConsumption() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      feedType: string;
      quantity: number;
      notes: string;
      recordedBy: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.recordFeedConsumption(
        data.feedType,
        data.quantity,
        data.notes,
        data.recordedBy,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedStocks"] }).catch(() => {});
      qc.invalidateQueries({ queryKey: ["feedHistory"] }).catch(() => {});
    },
  });
}

export function useUpdateFeedStock() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      feedType: string;
      totalStock: number;
      dailyPerCow: number;
      updatedBy: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateFeedStock(
        data.feedType,
        data.totalStock,
        data.dailyPerCow,
        data.updatedBy,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedStocks"] }).catch(() => {});
      qc.invalidateQueries({ queryKey: ["feedHistory"] }).catch(() => {});
    },
  });
}
