import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MilkRecord {
    id: bigint;
    morning: number;
    evening: number;
    changedBy: string;
    cowName: string;
    date: string;
    cowId: bigint;
    addedDate: Time;
}
export interface Donation {
    id: bigint;
    date: Time;
    donorName: string;
    message: string;
    amount: number;
    purpose: string;
}
export type Time = bigint;
export interface User {
    id: bigint;
    pin: string;
    name: string;
    role: string;
}
export interface FeedHistory {
    id: bigint;
    action: string;
    date: Time;
    feedType: string;
    recordedBy: string;
    notes: string;
    quantity: number;
}
export interface Cow {
    id: bigint;
    age: bigint;
    name: string;
    description: string;
    healthStatus: string;
    addedDate: Time;
    breed: string;
    tagNumber: string;
    qrCode: string;
}
export interface Calf {
    id: bigint;
    birthYear: bigint;
    cowId: bigint;
    gender: string;
    notes: string;
    birthMonth: bigint;
    addedDate: Time;
    tagNumber: string;
}
export interface HealthRecord {
    id: bigint;
    status: string;
    date: Time;
    cowId: bigint;
    vetName: string;
    notes: string;
}
export interface FeedStock {
    id: bigint;
    lastUpdated: Time;
    feedType: string;
    updatedBy: string;
    totalStock: number;
    dailyPerCow: number;
}
export interface ChangeLog {
    id: bigint;
    entity: string;
    userName: string;
    action: string;
    timestamp: Time;
    details: string;
    entityName: string;
}
export interface GaushaalaProfile {
    descriptionHindi: string;
    nameHindi: string;
    logoBase64: string;
    name: string;
    description: string;
    address: string;
    phone: string;
}
export interface Announcement {
    id: bigint;
    contentHindi: string;
    title: string;
    content: string;
    titleHindi: string;
    date: Time;
    isActive: boolean;
}
export interface backendInterface {
    addAnnouncement(title: string, titleHindi: string, content: string, contentHindi: string, isActive: boolean, changedBy: string): Promise<bigint>;
    addCalf(cowId: bigint, birthMonth: bigint, birthYear: bigint, gender: string, tagNumber: string, notes: string, changedBy: string): Promise<bigint>;
    addChangeLog(userName: string, action: string, entity: string, entityName: string, details: string): Promise<void>;
    addCow(name: string, breed: string, age: bigint, healthStatus: string, description: string, tagNumber: string, qrCode: string, changedBy: string): Promise<bigint>;
    addDonation(donorName: string, amount: number, message: string, purpose: string, changedBy: string): Promise<bigint>;
    addFeedStockQuantity(feedType: string, quantity: number, notes: string, recordedBy: string): Promise<void>;
    addHealthRecord(cowId: bigint, notes: string, status: string, vetName: string, changedBy: string): Promise<bigint>;
    addMilkRecord(cowId: bigint, cowName: string, date: string, morning: number, evening: number, changedBy: string): Promise<bigint>;
    changeUserPin(id: bigint, newPin: string, changedBy: string): Promise<void>;
    createUser(name: string, role: string, pin: string): Promise<bigint>;
    deleteCalf(id: bigint, changedBy: string): Promise<void>;
    deleteCow(id: bigint, changedBy: string): Promise<void>;
    deleteMilkRecord(id: bigint, changedBy: string): Promise<void>;
    deleteUser(id: bigint): Promise<void>;
    ensureDefaultAdmin(): Promise<void>;
    getActiveAnnouncements(): Promise<Array<Announcement>>;
    getAllChangeLogs(): Promise<Array<ChangeLog>>;
    getAllCows(): Promise<Array<Cow>>;
    getAllDonations(): Promise<Array<Donation>>;
    getAllMilkRecords(): Promise<Array<MilkRecord>>;
    getAllUsers(): Promise<Array<User>>;
    getAnnouncement(id: bigint): Promise<Announcement>;
    getCalvesByCow(cowId: bigint): Promise<Array<Calf>>;
    getCow(id: bigint): Promise<Cow>;
    getCowByTag(tag: string): Promise<Cow | null>;
    getDonation(id: bigint): Promise<Donation>;
    getFeedHistory(): Promise<Array<FeedHistory>>;
    getFeedStocks(): Promise<Array<FeedStock>>;
    getHealthRecord(id: bigint): Promise<HealthRecord>;
    getHealthRecordsByCow(cowId: bigint): Promise<Array<HealthRecord>>;
    getMilkRecordsByDate(date: string): Promise<Array<MilkRecord>>;
    getOnlineUsers(): Promise<Array<bigint>>;
    getProfile(): Promise<GaushaalaProfile>;
    getTodayMilkRecords(): Promise<Array<MilkRecord>>;
    getUserByPin(pin: string): Promise<User | null>;
    getUsersByPin(pin: string): Promise<Array<User>>;
    recordFeedConsumption(feedType: string, quantity: number, notes: string, recordedBy: string): Promise<void>;
    sendHeartbeat(userId: bigint): Promise<void>;
    updateCow(id: bigint, name: string, breed: string, age: bigint, healthStatus: string, description: string, tagNumber: string, qrCode: string, changedBy: string): Promise<void>;
    updateFeedStock(feedType: string, totalStock: number, dailyPerCow: number, updatedBy: string): Promise<void>;
    updateProfile(name: string, nameHindi: string, description: string, descriptionHindi: string, phone: string, address: string, logoBase64: string, changedBy: string): Promise<void>;
}
