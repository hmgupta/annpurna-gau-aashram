import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";



actor {
  type Cow = {
    id : Nat;
    name : Text;
    breed : Text;
    age : Nat;
    healthStatus : Text;
    description : Text;
    addedDate : Time.Time;
    tagNumber : Text;
    qrCode : Text;
  };

  type Calf = {
    id : Nat;
    cowId : Nat;
    birthMonth : Nat;
    birthYear : Nat;
    gender : Text;
    tagNumber : Text;
    notes : Text;
    addedDate : Time.Time;
  };

  type Donation = {
    id : Nat;
    donorName : Text;
    amount : Float;
    date : Time.Time;
    message : Text;
    purpose : Text;
  };

  type HealthRecord = {
    id : Nat;
    cowId : Nat;
    date : Time.Time;
    notes : Text;
    status : Text;
    vetName : Text;
  };

  type Announcement = {
    id : Nat;
    title : Text;
    titleHindi : Text;
    content : Text;
    contentHindi : Text;
    date : Time.Time;
    isActive : Bool;
  };

  type User = {
    id : Nat;
    name : Text;
    role : Text;
    pin : Text;
  };

  type ChangeLog = {
    id : Nat;
    userName : Text;
    action : Text;
    entity : Text;
    entityName : Text;
    details : Text;
    timestamp : Time.Time;
  };

  type MilkRecord = {
    id : Nat;
    cowId : Nat;
    cowName : Text;
    date : Text;
    morning : Float;
    evening : Float;
    addedDate : Time.Time;
    changedBy : Text;
  };

  type GaushaalaProfile = {
    name : Text;
    nameHindi : Text;
    description : Text;
    descriptionHindi : Text;
    phone : Text;
    address : Text;
    logoBase64 : Text;
  };

  type FeedStock = {
    id : Nat;
    feedType : Text;
    totalStock : Float;
    dailyPerCow : Float;
    lastUpdated : Time.Time;
    updatedBy : Text;
  };

  type FeedHistory = {
    id : Nat;
    feedType : Text;
    action : Text;
    quantity : Float;
    notes : Text;
    date : Time.Time;
    recordedBy : Text;
  };

  let MAX_USERS : Nat = 50;

  let cows = Map.empty<Nat, Cow>();
  let calves = Map.empty<Nat, Calf>();
  let donations = Map.empty<Nat, Donation>();
  let healthRecords = Map.empty<Nat, HealthRecord>();
  let announcements = Map.empty<Nat, Announcement>();
  let users = Map.empty<Nat, User>();
  let changeLogs = Map.empty<Nat, ChangeLog>();
  let milkRecords = Map.empty<Nat, MilkRecord>();
  let userHeartbeats = Map.empty<Nat, Time.Time>();
  let feedStocks = Map.empty<Nat, FeedStock>();
  let feedHistories = Map.empty<Nat, FeedHistory>();

  stable var cowIdCounter = 1;
  stable var calfIdCounter = 1;
  stable var donationIdCounter = 1;
  stable var healthRecordIdCounter = 1;
  stable var announcementIdCounter = 1;
  stable var userIdCounter = 2;
  stable var changeLogIdCounter = 1;
  stable var milkRecordIdCounter = 1;
  stable var feedStockIdCounter = 3;
  stable var feedHistoryIdCounter = 1;

  stable var gaushaalaProfile : GaushaalaProfile = {
    name = "Annpurna Gau Aashram";
    nameHindi = "अन्नपूर्णा गौ आश्रम";
    description = "A shelter dedicated to the care and protection of animals.";
    descriptionHindi = "जानवरों की देखभाल और सुरक्षा के लिए समर्पित एक गौशाला।";
    phone = "";
    address = "";
    logoBase64 = "";
  };

  stable var defaultAdminCreated = false;
  stable var stableCows : [(Nat, Cow)] = [];
  stable var stableCalves : [(Nat, Calf)] = [];
  stable var stableDonations : [(Nat, Donation)] = [];
  stable var stableHealthRecords : [(Nat, HealthRecord)] = [];
  stable var stableAnnouncements : [(Nat, Announcement)] = [];
  stable var stableUsers : [(Nat, User)] = [];
  stable var stableChangeLogs : [(Nat, ChangeLog)] = [];
  stable var stableMilkRecords : [(Nat, MilkRecord)] = [];
  stable var stableFeedStocks : [(Nat, FeedStock)] = [];
  stable var stableFeedHistories : [(Nat, FeedHistory)] = [];

  // Fresh install seed -- guard with containsKey to prevent trap on re-init
  do {
    if (not users.containsKey(1)) {
      let defaultAdmin : User = {
        id = 1;
        name = "Admin";
        role = "admin";
        pin = "000000";
      };
      users.add(1, defaultAdmin);
    };

    if (not feedStocks.containsKey(1)) {
      let wetFeed : FeedStock = {
        id = 1;
        feedType = "wet";
        totalStock = 0.0;
        dailyPerCow = 0.0;
        lastUpdated = Time.now();
        updatedBy = "system";
      };
      feedStocks.add(1, wetFeed);
    };

    if (not feedStocks.containsKey(2)) {
      let dryFeed : FeedStock = {
        id = 2;
        feedType = "dry";
        totalStock = 0.0;
        dailyPerCow = 0.0;
        lastUpdated = Time.now();
        updatedBy = "system";
      };
      feedStocks.add(2, dryFeed);
    };
  };

  system func preupgrade() {
    stableCows := cows.entries().toArray();
    stableCalves := calves.entries().toArray();
    stableDonations := donations.entries().toArray();
    stableHealthRecords := healthRecords.entries().toArray();
    stableAnnouncements := announcements.entries().toArray();
    stableUsers := users.entries().toArray();
    stableChangeLogs := changeLogs.entries().toArray();
    stableMilkRecords := milkRecords.entries().toArray();
    stableFeedStocks := feedStocks.entries().toArray();
    stableFeedHistories := feedHistories.entries().toArray();
  };

  system func postupgrade() {
    for ((k, v) in stableCows.vals()) { cows.add(k, v); };
    for ((k, v) in stableCalves.vals()) { calves.add(k, v); };
    for ((k, v) in stableDonations.vals()) { donations.add(k, v); };
    for ((k, v) in stableHealthRecords.vals()) { healthRecords.add(k, v); };
    for ((k, v) in stableAnnouncements.vals()) { announcements.add(k, v); };
    for ((k, v) in stableUsers.vals()) { users.add(k, v); };
    for ((k, v) in stableChangeLogs.vals()) { changeLogs.add(k, v); };
    for ((k, v) in stableMilkRecords.vals()) { milkRecords.add(k, v); };
    for ((k, v) in stableFeedStocks.vals()) { feedStocks.add(k, v); };
    for ((k, v) in stableFeedHistories.vals()) { feedHistories.add(k, v); };

    stableCows := [];
    stableCalves := [];
    stableDonations := [];
    stableHealthRecords := [];
    stableAnnouncements := [];
    stableUsers := [];
    stableChangeLogs := [];
    stableMilkRecords := [];
    stableFeedStocks := [];
    stableFeedHistories := [];

    // Ensure at least one admin exists after upgrade
    let adminExists = users.values().find(func(u : User) : Bool {
      u.role == "admin";
    });
    switch (adminExists) {
      case (null) {
        if (not users.containsKey(1)) {
          users.add(1, { id = 1; name = "Admin"; role = "admin"; pin = "000000" });
        };
        if (userIdCounter < 2) { userIdCounter := 2; };
      };
      case (?_) {};
    };

    // Seed feed stocks if missing
    if (not feedStocks.containsKey(1)) {
      feedStocks.add(1, { id = 1; feedType = "wet"; totalStock = 0.0; dailyPerCow = 0.0; lastUpdated = Time.now(); updatedBy = "system" });
    };
    if (not feedStocks.containsKey(2)) {
      feedStocks.add(2, { id = 2; feedType = "dry"; totalStock = 0.0; dailyPerCow = 0.0; lastUpdated = Time.now(); updatedBy = "system" });
    };
  };

  func compareByDate(a : MilkRecord, b : MilkRecord) : Order.Order {
    Int.compare(a.addedDate, b.addedDate);
  };

  func compareFeedHistoryByDate(a : FeedHistory, b : FeedHistory) : Order.Order {
    Int.compare(a.date, b.date);
  };

  func recordLog(
    userName : Text,
    action : Text,
    entity : Text,
    entityName : Text,
    details : Text,
  ) {
    let id = changeLogIdCounter;
    changeLogIdCounter += 1;
    let log : ChangeLog = {
      id;
      userName;
      action;
      entity;
      entityName;
      details;
      timestamp = Time.now();
    };
    changeLogs.add(id, log);
  };

  public shared ({ caller }) func sendHeartbeat(userId : Nat) : async () {
    userHeartbeats.add(userId, Time.now());
  };

  public query ({ caller }) func getOnlineUsers() : async [Nat] {
    let threeMinutes : Int = 180_000_000_000;
    let now = Time.now();
    let iter = userHeartbeats.entries();
    iter
      .filter(func((uid, ts) : (Nat, Time.Time)) : Bool {
        (now - ts) < threeMinutes;
      })
      .map(func((uid, _) : (Nat, Time.Time)) : Nat { uid })
      .toArray();
  };

  public query ({ caller }) func getProfile() : async GaushaalaProfile {
    gaushaalaProfile;
  };

  public shared ({ caller }) func updateProfile(
    name : Text,
    nameHindi : Text,
    description : Text,
    descriptionHindi : Text,
    phone : Text,
    address : Text,
    logoBase64 : Text,
    changedBy : Text,
  ) : async () {
    gaushaalaProfile := {
      name;
      nameHindi;
      description;
      descriptionHindi;
      phone;
      address;
      logoBase64;
    };
    recordLog(changedBy, "edit", "profile", name, "Updated gaushala profile");
  };

  public shared ({ caller }) func createUser(name : Text, role : Text, pin : Text) : async Nat {
    let currentCount = users.size();
    if (currentCount >= MAX_USERS) {
      Runtime.trap("User limit reached: maximum " # MAX_USERS.toText() # " users allowed");
    };
    let id = userIdCounter;
    userIdCounter += 1;
    let user : User = {
      id;
      name;
      role;
      pin;
    };
    users.add(id, user);
    id;
  };

  public shared ({ caller }) func deleteUser(id : Nat) : async () {
    if (not users.containsKey(id)) {
      Runtime.trap("User not found");
    };
    users.remove(id);
    userHeartbeats.remove(id);
  };

  public shared ({ caller }) func changeUserPin(id : Nat, newPin : Text, changedBy : Text) : async () {
    switch (users.get(id)) {
      case (null) { Runtime.trap("User not found") };
      case (?existingUser) {
        let updatedUser : User = {
          id = existingUser.id;
          name = existingUser.name;
          role = existingUser.role;
          pin = newPin;
        };
        users.remove(id);
        users.add(id, updatedUser);
        recordLog(
          changedBy,
          "edit",
          "user",
          existingUser.name,
          "PIN changed for user: " # existingUser.name,
        );
      };
    };
  };

  public query ({ caller }) func getAllUsers() : async [User] {
    users.values().toArray();
  };

  public query ({ caller }) func getUserByPin(pin : Text) : async ?User {
    let iter = users.values();
    iter.find(func(user) { user.pin == pin });
  };

  public query ({ caller }) func getUsersByPin(pin : Text) : async [User] {
    let iter = users.values();
    iter.filter(func(user) { user.pin == pin }).toArray();
  };

  public shared ({ caller }) func ensureDefaultAdmin() : async () {
    let adminExists = users.values().find(func(u : User) : Bool {
      u.role == "admin";
    });
    switch (adminExists) {
      case (null) {
        if (not users.containsKey(1)) {
          let defaultAdmin : User = {
            id = 1;
            name = "Admin";
            role = "admin";
            pin = "000000";
          };
          users.add(1, defaultAdmin);
        };
        if (userIdCounter < 2) { userIdCounter := 2; };
      };
      case (?_) {};
    };
  };

  public shared ({ caller }) func addChangeLog(
    userName : Text,
    action : Text,
    entity : Text,
    entityName : Text,
    details : Text,
  ) : async () {
    recordLog(userName, action, entity, entityName, details);
  };

  public query ({ caller }) func getAllChangeLogs() : async [ChangeLog] {
    changeLogs.values().toArray();
  };

  public shared ({ caller }) func addCow(
    name : Text,
    breed : Text,
    age : Nat,
    healthStatus : Text,
    description : Text,
    tagNumber : Text,
    qrCode : Text,
    changedBy : Text,
  ) : async Nat {
    let id = cowIdCounter;
    cowIdCounter += 1;
    let cow : Cow = {
      id;
      name;
      breed;
      age;
      healthStatus;
      description;
      addedDate = Time.now();
      tagNumber;
      qrCode;
    };
    cows.add(id, cow);
    recordLog(changedBy, "add", "cow", name, "Added cow: " # name);
    id;
  };

  public query ({ caller }) func getCow(id : Nat) : async Cow {
    switch (cows.get(id)) {
      case (null) { Runtime.trap("Cow with id " # id.toText() # " not found") };
      case (?cow) { cow };
    };
  };

  public query ({ caller }) func getAllCows() : async [Cow] {
    cows.values().toArray();
  };

  public shared ({ caller }) func updateCow(
    id : Nat,
    name : Text,
    breed : Text,
    age : Nat,
    healthStatus : Text,
    description : Text,
    tagNumber : Text,
    qrCode : Text,
    changedBy : Text,
  ) : async () {
    switch (cows.get(id)) {
      case (null) { Runtime.trap("Cow with id " # id.toText() # " not found") };
      case (?existingCow) {
        let updatedCow : Cow = {
          id;
          name;
          breed;
          age;
          healthStatus;
          description;
          addedDate = existingCow.addedDate;
          tagNumber;
          qrCode;
        };
        cows.remove(id);
        cows.add(id, updatedCow);
        recordLog(changedBy, "edit", "cow", name, "Updated cow: " # name);
      };
    };
  };

  public shared ({ caller }) func deleteCow(id : Nat, changedBy : Text) : async () {
    if (not cows.containsKey(id)) {
      Runtime.trap("Cow with id " # id.toText() # " not found");
    };
    cows.remove(id);
    recordLog(
      changedBy,
      "delete",
      "cow",
      id.toText(),
      "Deleted cow id: " # id.toText(),
    );
  };

  public query ({ caller }) func getCowByTag(tag : Text) : async ?Cow {
    let iter = cows.values();
    iter.find(
      func(cow) {
        cow.tagNumber == tag or cow.qrCode == tag;
      }
    );
  };

  public shared ({ caller }) func addCalf(
    cowId : Nat,
    birthMonth : Nat,
    birthYear : Nat,
    gender : Text,
    tagNumber : Text,
    notes : Text,
    changedBy : Text,
  ) : async Nat {
    switch (cows.get(cowId)) {
      case (null) { Runtime.trap("Cow not found") };
      case (?_) {
        let id = calfIdCounter;
        calfIdCounter += 1;
        let calf : Calf = {
          id;
          cowId;
          birthMonth;
          birthYear;
          gender;
          tagNumber;
          notes;
          addedDate = Time.now();
        };
        calves.add(id, calf);
        recordLog(
          changedBy,
          "add",
          "calf",
          "Calf for cow " # cowId.toText(),
          "Added calf",
        );
        id;
      };
    };
  };

  public query ({ caller }) func getCalvesByCow(cowId : Nat) : async [Calf] {
    let iter = calves.values();
    iter.filter(func(calf) { calf.cowId == cowId }).toArray();
  };

  public shared ({ caller }) func deleteCalf(id : Nat, changedBy : Text) : async () {
    if (not calves.containsKey(id)) {
      Runtime.trap("Calf with id " # id.toText() # " not found");
    };
    calves.remove(id);
    recordLog(
      changedBy,
      "delete",
      "calf",
      id.toText(),
      "Deleted calf id: " # id.toText(),
    );
  };

  public shared ({ caller }) func addDonation(
    donorName : Text,
    amount : Float,
    message : Text,
    purpose : Text,
    changedBy : Text,
  ) : async Nat {
    let id = donationIdCounter;
    donationIdCounter += 1;
    let donation : Donation = {
      id;
      donorName;
      amount;
      date = Time.now();
      message;
      purpose;
    };
    donations.add(id, donation);
    recordLog(
      changedBy,
      "add",
      "donation",
      donorName,
      "Donation by: " # donorName,
    );
    id;
  };

  public query ({ caller }) func getDonation(id : Nat) : async Donation {
    switch (donations.get(id)) {
      case (null) { Runtime.trap("Donation not found") };
      case (?donation) { donation };
    };
  };

  public query ({ caller }) func getAllDonations() : async [Donation] {
    donations.values().toArray();
  };

  public shared ({ caller }) func addHealthRecord(
    cowId : Nat,
    notes : Text,
    status : Text,
    vetName : Text,
    changedBy : Text,
  ) : async Nat {
    if (not cows.containsKey(cowId)) {
      Runtime.trap("Cow not found");
    };
    let id = healthRecordIdCounter;
    healthRecordIdCounter += 1;
    let record : HealthRecord = {
      id;
      cowId;
      date = Time.now();
      notes;
      status;
      vetName;
    };
    healthRecords.add(id, record);
    recordLog(
      changedBy,
      "add",
      "health",
      "Cow " # cowId.toText(),
      "Added health record",
    );
    id;
  };

  public query ({ caller }) func getHealthRecord(id : Nat) : async HealthRecord {
    switch (healthRecords.get(id)) {
      case (null) { Runtime.trap("Health record not found") };
      case (?record) { record };
    };
  };

  public query ({ caller }) func getHealthRecordsByCow(cowId : Nat) : async [HealthRecord] {
    let iter = healthRecords.values();
    iter.filter(func(record) { record.cowId == cowId }).toArray();
  };

  public shared ({ caller }) func addAnnouncement(
    title : Text,
    titleHindi : Text,
    content : Text,
    contentHindi : Text,
    isActive : Bool,
    changedBy : Text,
  ) : async Nat {
    let id = announcementIdCounter;
    announcementIdCounter += 1;
    let announcement : Announcement = {
      id;
      title;
      titleHindi;
      content;
      contentHindi;
      date = Time.now();
      isActive;
    };
    announcements.add(id, announcement);
    recordLog(changedBy, "add", "announcement", title, "Added announcement");
    id;
  };

  public query ({ caller }) func getAnnouncement(id : Nat) : async Announcement {
    switch (announcements.get(id)) {
      case (null) { Runtime.trap("Announcement not found") };
      case (?announcement) { announcement };
    };
  };

  public query ({ caller }) func getActiveAnnouncements() : async [Announcement] {
    let iter = announcements.values();
    iter.filter(func(a) { a.isActive }).toArray();
  };

  public shared ({ caller }) func addMilkRecord(
    cowId : Nat,
    cowName : Text,
    date : Text,
    morning : Float,
    evening : Float,
    changedBy : Text,
  ) : async Nat {
    let id = milkRecordIdCounter;
    milkRecordIdCounter += 1;
    let record : MilkRecord = {
      id;
      cowId;
      cowName;
      date;
      morning;
      evening;
      addedDate = Time.now();
      changedBy;
    };
    milkRecords.add(id, record);
    recordLog(
      changedBy,
      "add",
      "milk",
      cowName,
      "Added milk record for " # cowName,
    );
    id;
  };

  public query ({ caller }) func getMilkRecordsByDate(date : Text) : async [MilkRecord] {
    let iter = milkRecords.values();
    iter.filter(func(record) { record.date == date }).toArray();
  };

  public query ({ caller }) func getAllMilkRecords() : async [MilkRecord] {
    milkRecords.values().toArray();
  };

  public shared ({ caller }) func deleteMilkRecord(id : Nat, changedBy : Text) : async () {
    if (not milkRecords.containsKey(id)) {
      Runtime.trap("Milk record not found");
    };
    milkRecords.remove(id);
    recordLog(
      changedBy,
      "delete",
      "milk",
      id.toText(),
      "Deleted milk record",
    );
  };

  public query ({ caller }) func getTodayMilkRecords() : async [MilkRecord] {
    let todayRecords = milkRecords.values().toArray();
    todayRecords.sort(compareByDate);
  };

  public shared ({ caller }) func updateFeedStock(
    feedType : Text,
    totalStock : Float,
    dailyPerCow : Float,
    updatedBy : Text,
  ) : async () {
    let stockId = if (feedType == "wet") { 1 } else if (feedType == "dry") { 2 } else { Runtime.trap("Invalid feed type") };
    let updatedStock : FeedStock = {
      id = stockId;
      feedType;
      totalStock;
      dailyPerCow;
      lastUpdated = Time.now();
      updatedBy;
    };
    feedStocks.remove(stockId);
    feedStocks.add(stockId, updatedStock);
    recordLog(updatedBy, "update_feed_stock", "feed_stock", feedType, "Feed stock updated");
  };

  public shared ({ caller }) func addFeedStockQuantity(
    feedType : Text,
    quantity : Float,
    notes : Text,
    recordedBy : Text,
  ) : async () {
    let stockId = if (feedType == "wet") { 1 } else if (feedType == "dry") { 2 } else { Runtime.trap("Invalid feed type") };
    let currentStock = switch (feedStocks.get(stockId)) {
      case (null) { { id = stockId; feedType; totalStock = 0.0; dailyPerCow = 0.0; lastUpdated = Time.now(); updatedBy = recordedBy } };
      case (?stock) { stock };
    };
    let updatedStock : FeedStock = {
      id = stockId;
      feedType;
      totalStock = currentStock.totalStock + quantity;
      dailyPerCow = currentStock.dailyPerCow;
      lastUpdated = Time.now();
      updatedBy = recordedBy;
    };
    feedStocks.remove(stockId);
    feedStocks.add(stockId, updatedStock);

    let historyId = feedHistoryIdCounter;
    feedHistoryIdCounter += 1;
    feedHistories.add(historyId, { id = historyId; feedType; action = "add"; quantity; notes; date = Time.now(); recordedBy });
    recordLog(recordedBy, "add_feed_stock", "feed_stock", feedType, "Added " # quantity.toText() # " kg");
  };

  public shared ({ caller }) func recordFeedConsumption(
    feedType : Text,
    quantity : Float,
    notes : Text,
    recordedBy : Text,
  ) : async () {
    if (quantity <= 0.0) { Runtime.trap("Quantity must be positive") };
    let stockId = if (feedType == "wet") { 1 } else if (feedType == "dry") { 2 } else { Runtime.trap("Invalid feed type") };
    let currentStock = switch (feedStocks.get(stockId)) {
      case (null) { Runtime.trap("Feed stock not found") };
      case (?stock) { stock };
    };
    if (currentStock.totalStock < quantity) { Runtime.trap("Insufficient stock") };
    let updatedStock : FeedStock = {
      id = stockId;
      feedType;
      totalStock = currentStock.totalStock - quantity;
      dailyPerCow = currentStock.dailyPerCow;
      lastUpdated = Time.now();
      updatedBy = recordedBy;
    };
    feedStocks.remove(stockId);
    feedStocks.add(stockId, updatedStock);

    let historyId = feedHistoryIdCounter;
    feedHistoryIdCounter += 1;
    feedHistories.add(historyId, { id = historyId; feedType; action = "consume"; quantity; notes; date = Time.now(); recordedBy });
    recordLog(recordedBy, "consume_feed", "feed_stock", feedType, "Consumed " # quantity.toText() # " kg");
  };

  public query ({ caller }) func getFeedStocks() : async [FeedStock] {
    feedStocks.values().toArray();
  };

  public query ({ caller }) func getFeedHistory() : async [FeedHistory] {
    let historyArray = feedHistories.values().toArray();
    historyArray.sort(compareFeedHistoryByDate);
  };
};
