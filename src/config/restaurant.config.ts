export interface RestaurantTable {
  id: string;
  label: string;
  active: boolean;
}

export interface RestaurantConfig {
  restaurantName: string;
  tagline: string;
  phone: string; // PLACEHOLDER: Replace with actual restaurant contact phone
  gstin: string; // PLACEHOLDER: Replace with valid 15-digit GSTIN (e.g., 36AAAAA0000A1Z5)
  fssaiNumber: string; // PLACEHOLDER: Replace with 14-digit FSSAI license number
  address: {
    line1: string; // PLACEHOLDER: e.g. Shop No. 4, Food Court Lane
    line2: string; // PLACEHOLDER: e.g. Near Metro Pillar 124
    city: string; // PLACEHOLDER: e.g. Hyderabad
    state: string; // PLACEHOLDER: e.g. Telangana
    pincode: string; // PLACEHOLDER: e.g. 500081
  };
  demoUpiVpa: string; // PLACEHOLDER: Replace with merchant UPI ID (e.g. ritsufoodcorner@okaxis)
  demoUpiName: string; // Display name on UPI app
  taxRatePercent: number; // 5% GST
  cgstPercent: number; // 2.5% CGST
  sgstPercent: number; // 2.5% SGST
  pricesIncludeTax: boolean; // false: prices EXCLUDE GST, tax added on top
  maxCartLineQuantity: number; // 20
  tables: RestaurantTable[];
  partyOrderMessage: string;
}

export const RESTAURANT_CONFIG: RestaurantConfig = {
  restaurantName: "Ritsu Food Corner",
  tagline: "Indo-Chinese ka asli maza – Ritsu ke saath!",
  phone: "+91 98765 43210", // PLACEHOLDER - OWNER MUST FILL
  gstin: "36AAAAA0000A1Z5", // PLACEHOLDER - OWNER MUST FILL
  fssaiNumber: "13621000000000", // PLACEHOLDER - OWNER MUST FILL
  address: {
    line1: "Main Road, Opp. City Center", // PLACEHOLDER - OWNER MUST FILL
    line2: "Food Street", // PLACEHOLDER - OWNER MUST FILL
    city: "Hyderabad", // PLACEHOLDER - OWNER MUST FILL
    state: "Telangana", // PLACEHOLDER - OWNER MUST FILL
    pincode: "500032", // PLACEHOLDER - OWNER MUST FILL
  },
  demoUpiVpa: "ritsufoodcorner@okaxis", // PLACEHOLDER - OWNER MUST FILL
  demoUpiName: "Ritsu Food Corner",
  taxRatePercent: 5,
  cgstPercent: 2.5,
  sgstPercent: 2.5,
  pricesIncludeTax: false, // Core domain rule: menu prices EXCLUDE GST
  maxCartLineQuantity: 20,
  tables: [
    { id: "t1", label: "T1", active: true },
    { id: "t2", label: "T2", active: true },
    { id: "t3", label: "T3", active: true },
    { id: "t4", label: "T4", active: true },
    { id: "t5", label: "T5", active: true },
    { id: "t6", label: "T6", active: true },
    { id: "t7", label: "T7", active: true },
    { id: "t8", label: "T8", active: true },
  ],
  partyOrderMessage: "We undertake all party orders! Call us for bulk catering & celebrations.",
};
