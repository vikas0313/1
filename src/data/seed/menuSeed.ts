import { Category, MenuItem } from '../../types/menu';

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'STARTERS', sort_order: 1, diet_type: 'non_veg' },
  { id: 'cat-2', name: 'VEG STARTERS', sort_order: 2, diet_type: 'veg' },
  { id: 'cat-3', name: 'NOODLES – VEG', sort_order: 3, diet_type: 'veg' },
  { id: 'cat-4', name: 'NOODLES – NON-VEG', sort_order: 4, diet_type: 'non_veg' },
  { id: 'cat-5', name: 'VEG IN RICE', sort_order: 5, diet_type: 'veg' },
  { id: 'cat-6', name: 'RICE IN NON-VEG', sort_order: 6, diet_type: 'non_veg' },
  { id: 'cat-7', name: 'VEG CURRIES', sort_order: 7, diet_type: 'veg' },
  { id: 'cat-8', name: 'NON-VEG CURRIES', sort_order: 8, diet_type: 'non_veg' },
  { id: 'cat-9', name: "MOMO'S IN VEG", sort_order: 9, diet_type: 'veg' },
  { id: 'cat-10', name: "MOMO'S IN NON-VEG – CHICKEN", sort_order: 10, diet_type: 'non_veg' },
  { id: 'cat-11', name: "MOMO'S IN PANEER", sort_order: 11, diet_type: 'veg' },
  { id: 'cat-12', name: "BIRYANI'S IN VEG", sort_order: 12, diet_type: 'veg' },
  { id: 'cat-13', name: "BIRYANI'S IN NON-VEG", sort_order: 13, diet_type: 'non_veg' },
  { id: 'cat-14', name: 'SOFT DRINK', sort_order: 14, diet_type: 'veg' },
];

interface RawItemDef {
  no: number;
  catId: string;
  name: string;
  isVeg: boolean;
  desc?: string;
  singlePrice: number; // in ₹
  fullPrice?: number;   // in ₹
  fullNeedsVerif?: boolean;
  sizeLabels?: [string, string]; // default: ["Single", "Full"]
}

const RAW_MENU_DEFS: RawItemDef[] = [
  // 1. STARTERS (non-veg) 1-25 (All full prices inferred *)
  { no: 1, catId: 'cat-1', name: 'Chicken Manchurian', isVeg: false, singlePrice: 140, fullPrice: 200, fullNeedsVerif: true },
  { no: 2, catId: 'cat-1', name: 'Chicken 65', isVeg: false, singlePrice: 170, fullPrice: 220, fullNeedsVerif: true },
  { no: 3, catId: 'cat-1', name: 'Chilli Chicken', isVeg: false, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 4, catId: 'cat-1', name: 'Schezwan Chicken', isVeg: false, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 5, catId: 'cat-1', name: 'Garlic Chicken', isVeg: false, singlePrice: 170, fullPrice: 220, fullNeedsVerif: true },
  { no: 6, catId: 'cat-1', name: 'Ginger Chicken', isVeg: false, singlePrice: 170, fullPrice: 220, fullNeedsVerif: true },
  { no: 7, catId: 'cat-1', name: 'Dragon Chicken', isVeg: false, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 8, catId: 'cat-1', name: 'Mongolian Chicken', isVeg: false, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 9, catId: 'cat-1', name: 'Chicken Majestic', isVeg: false, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 10, catId: 'cat-1', name: 'Crispy Chicken', isVeg: false, singlePrice: 200, fullPrice: 260, fullNeedsVerif: true },
  { no: 11, catId: 'cat-1', name: 'Pepper Chicken', isVeg: false, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 12, catId: 'cat-1', name: 'Kung Pao Chicken', isVeg: false, singlePrice: 200, fullPrice: 260, fullNeedsVerif: true },
  { no: 13, catId: 'cat-1', name: 'Hong Kong Chicken', isVeg: false, singlePrice: 200, fullPrice: 260, fullNeedsVerif: true },
  { no: 14, catId: 'cat-1', name: 'Prawns Manchurian', isVeg: false, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 15, catId: 'cat-1', name: 'Prawns 65', isVeg: false, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 16, catId: 'cat-1', name: 'Chilli Prawns', isVeg: false, singlePrice: 200, fullPrice: 260, fullNeedsVerif: true },
  { no: 17, catId: 'cat-1', name: 'Garlic Prawns', isVeg: false, singlePrice: 200, fullPrice: 260, fullNeedsVerif: true },
  { no: 18, catId: 'cat-1', name: 'Ginger Prawns', isVeg: false, singlePrice: 200, fullPrice: 260, fullNeedsVerif: true },
  { no: 19, catId: 'cat-1', name: 'Schezwan Prawns', isVeg: false, singlePrice: 220, fullPrice: 280, fullNeedsVerif: true },
  { no: 20, catId: 'cat-1', name: 'Apollo Fish', isVeg: false, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 21, catId: 'cat-1', name: 'Fish 65', isVeg: false, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 22, catId: 'cat-1', name: 'Chilli Fish', isVeg: false, singlePrice: 200, fullPrice: 260, fullNeedsVerif: true },
  { no: 23, catId: 'cat-1', name: 'Garlic Fish', isVeg: false, singlePrice: 200, fullPrice: 260, fullNeedsVerif: true },
  { no: 24, catId: 'cat-1', name: 'Ginger Fish', isVeg: false, singlePrice: 200, fullPrice: 260, fullNeedsVerif: true },
  { no: 25, catId: 'cat-1', name: 'Schezwan Fish', isVeg: false, singlePrice: 220, fullPrice: 280, fullNeedsVerif: true },

  // 2. VEG STARTERS 26-48 (All full prices inferred *)
  { no: 26, catId: 'cat-2', name: 'Veg Manchurian', isVeg: true, singlePrice: 80, fullPrice: 120, fullNeedsVerif: true },
  { no: 27, catId: 'cat-2', name: 'Veg 65', isVeg: true, singlePrice: 90, fullPrice: 130, fullNeedsVerif: true },
  { no: 28, catId: 'cat-2', name: 'Chilli Veg Manchurian', isVeg: true, singlePrice: 100, fullPrice: 160, fullNeedsVerif: true },
  { no: 29, catId: 'cat-2', name: 'Schezwan Veg Manchurian', isVeg: true, singlePrice: 100, fullPrice: 160, fullNeedsVerif: true },
  { no: 30, catId: 'cat-2', name: 'Gobi Manchurian', isVeg: true, singlePrice: 100, fullPrice: 160, fullNeedsVerif: true },
  { no: 31, catId: 'cat-2', name: 'Gobi 65', isVeg: true, singlePrice: 100, fullPrice: 160, fullNeedsVerif: true },
  { no: 32, catId: 'cat-2', name: 'Chilli Gobi', isVeg: true, singlePrice: 120, fullPrice: 180, fullNeedsVerif: true },
  { no: 33, catId: 'cat-2', name: 'Schezwan Gobi', isVeg: true, singlePrice: 120, fullPrice: 180, fullNeedsVerif: true },
  { no: 34, catId: 'cat-2', name: 'Chilli Potatoes', isVeg: true, singlePrice: 120, fullPrice: 180, fullNeedsVerif: true },
  { no: 35, catId: 'cat-2', name: 'Baby Corn Manchurian', isVeg: true, singlePrice: 140, fullPrice: 200, fullNeedsVerif: true },
  { no: 36, catId: 'cat-2', name: 'Baby Corn 65', isVeg: true, singlePrice: 170, fullPrice: 220, fullNeedsVerif: true },
  { no: 37, catId: 'cat-2', name: 'Chilli Baby Corn', isVeg: true, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 38, catId: 'cat-2', name: 'Schezwan Baby Corn', isVeg: true, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 39, catId: 'cat-2', name: 'Mushroom Manchurian', isVeg: true, singlePrice: 140, fullPrice: 200, fullNeedsVerif: true },
  { no: 40, catId: 'cat-2', name: 'Mushroom 65', isVeg: true, singlePrice: 170, fullPrice: 220, fullNeedsVerif: true },
  { no: 41, catId: 'cat-2', name: 'Chilli Mushroom', isVeg: true, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 42, catId: 'cat-2', name: 'Schezwan Mushroom', isVeg: true, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 43, catId: 'cat-2', name: 'Paneer Manchurian', isVeg: true, singlePrice: 140, fullPrice: 200, fullNeedsVerif: true },
  { no: 44, catId: 'cat-2', name: 'Paneer 65', isVeg: true, singlePrice: 170, fullPrice: 220, fullNeedsVerif: true },
  { no: 45, catId: 'cat-2', name: 'Chilli Paneer', isVeg: true, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 46, catId: 'cat-2', name: 'Schezwan Paneer', isVeg: true, singlePrice: 180, fullPrice: 240, fullNeedsVerif: true },
  { no: 47, catId: 'cat-2', name: 'Ginger Paneer', isVeg: true, singlePrice: 170, fullPrice: 220, fullNeedsVerif: true },
  { no: 48, catId: 'cat-2', name: 'Garlic Paneer', isVeg: true, singlePrice: 170, fullPrice: 220, fullNeedsVerif: true },

  // 3. NOODLES – VEG 49-60
  { no: 49, catId: 'cat-3', name: 'Veg Noodles', isVeg: true, singlePrice: 70, fullPrice: 120 },
  { no: 50, catId: 'cat-3', name: 'Veg Hakka Noodles', isVeg: true, singlePrice: 90, fullPrice: 140 },
  { no: 51, catId: 'cat-3', name: 'Veg Manchurian Noodles', isVeg: true, singlePrice: 80, fullPrice: 130 },
  { no: 52, catId: 'cat-3', name: 'Veg Singapore Noodles', isVeg: true, singlePrice: 90, fullPrice: 140 },
  { no: 53, catId: 'cat-3', name: 'Veg Schezwan Noodles', isVeg: true, singlePrice: 90, fullPrice: 140 },
  { no: 54, catId: 'cat-3', name: 'Chilli Garlic Noodles', isVeg: true, singlePrice: 90, fullPrice: 140 },
  { no: 55, catId: 'cat-3', name: 'Paneer Noodles', isVeg: true, singlePrice: 100, fullPrice: 140 },
  { no: 56, catId: 'cat-3', name: 'Paneer Manchurian Noodles', isVeg: true, singlePrice: 110, fullPrice: 150 },
  { no: 57, catId: 'cat-3', name: 'Paneer Hakka Noodles', isVeg: true, singlePrice: 110, fullPrice: 150 },
  { no: 58, catId: 'cat-3', name: 'Paneer Singapore Noodles', isVeg: true, singlePrice: 110, fullPrice: 150 },
  { no: 59, catId: 'cat-3', name: 'Paneer Schezwan Noodles', isVeg: true, singlePrice: 110, fullPrice: 150 },
  { no: 60, catId: 'cat-3', name: 'Chilli Garlic Paneer Noodles', isVeg: true, singlePrice: 110, fullPrice: 150 },

  // 4. NOODLES – NON-VEG 61-79
  { no: 61, catId: 'cat-4', name: 'Egg Noodles', isVeg: false, singlePrice: 80, fullPrice: 130 },
  { no: 62, catId: 'cat-4', name: 'Double Egg Noodles', isVeg: false, singlePrice: 90, fullPrice: 140 },
  { no: 63, catId: 'cat-4', name: 'Chilli Garlic Egg Noodles', isVeg: false, singlePrice: 90, fullPrice: 140 },
  { no: 64, catId: 'cat-4', name: 'Egg Hakka Noodles', isVeg: false, singlePrice: 90, fullPrice: 140 },
  { no: 65, catId: 'cat-4', name: 'Singapore Egg Noodles', isVeg: false, singlePrice: 90, fullPrice: 140 },
  { no: 66, catId: 'cat-4', name: 'Schezwan Egg Noodles', isVeg: false, singlePrice: 90, fullPrice: 140 },
  { no: 67, catId: 'cat-4', name: 'Chicken Noodles', isVeg: false, singlePrice: 100, fullPrice: 140 },
  { no: 68, catId: 'cat-4', name: 'Double Egg Chicken Noodles', isVeg: false, singlePrice: 110, fullPrice: 150 },
  { no: 69, catId: 'cat-4', name: 'Chilli Garlic Chicken Noodles', isVeg: false, singlePrice: 110, fullPrice: 150 },
  { no: 70, catId: 'cat-4', name: 'Chicken Hakka Noodles', isVeg: false, singlePrice: 110, fullPrice: 150 },
  { no: 71, catId: 'cat-4', name: 'Singapore Chicken Noodles', isVeg: false, singlePrice: 110, fullPrice: 150 },
  { no: 72, catId: 'cat-4', name: 'Chicken Schezwan Noodles', isVeg: false, singlePrice: 110, fullPrice: 150 },
  { no: 73, catId: 'cat-4', name: 'Prawns Noodles', isVeg: false, singlePrice: 140, fullPrice: 200 },
  { no: 74, catId: 'cat-4', name: 'Double Egg Prawns Noodles', isVeg: false, singlePrice: 150, fullPrice: 210 },
  { no: 75, catId: 'cat-4', name: 'Chilli Garlic Prawns Noodles', isVeg: false, singlePrice: 160, fullPrice: 220 },
  { no: 76, catId: 'cat-4', name: 'Prawns Hakka Noodles', isVeg: false, singlePrice: 160, fullPrice: 220 },
  { no: 77, catId: 'cat-4', name: 'Singapore Prawns Noodles', isVeg: false, singlePrice: 160, fullPrice: 220 },
  { no: 78, catId: 'cat-4', name: 'Prawns Schezwan Noodles', isVeg: false, singlePrice: 160, fullPrice: 220 },
  { no: 79, catId: 'cat-4', name: 'Mix Noodles (Egg + Chicken + Prawns)', isVeg: false, singlePrice: 180, fullPrice: 240 },

  // 5. VEG IN RICE 80-93 (Item 93 Kaju Rice full price inferred *)
  { no: 80, catId: 'cat-5', name: 'Veg Fried Rice', isVeg: true, singlePrice: 70, fullPrice: 120 },
  { no: 81, catId: 'cat-5', name: 'Jeera Rice', isVeg: true, singlePrice: 80, fullPrice: 130 },
  { no: 82, catId: 'cat-5', name: 'Veg Hakka Rice', isVeg: true, singlePrice: 80, fullPrice: 130 },
  { no: 83, catId: 'cat-5', name: 'Veg Manchurian Rice', isVeg: true, singlePrice: 80, fullPrice: 130 },
  { no: 84, catId: 'cat-5', name: 'Veg Singapore Rice', isVeg: true, singlePrice: 90, fullPrice: 140 },
  { no: 85, catId: 'cat-5', name: 'Veg Schezwan Rice', isVeg: true, singlePrice: 90, fullPrice: 140 },
  { no: 86, catId: 'cat-5', name: 'Chilli Garlic Rice', isVeg: true, singlePrice: 90, fullPrice: 140 },
  { no: 87, catId: 'cat-5', name: 'Paneer Rice', isVeg: true, singlePrice: 100, fullPrice: 140 },
  { no: 88, catId: 'cat-5', name: 'Paneer Manchurian Rice', isVeg: true, singlePrice: 110, fullPrice: 150 },
  { no: 89, catId: 'cat-5', name: 'Paneer Hakka Rice', isVeg: true, singlePrice: 110, fullPrice: 150 },
  { no: 90, catId: 'cat-5', name: 'Paneer Singapore Rice', isVeg: true, singlePrice: 110, fullPrice: 150 },
  { no: 91, catId: 'cat-5', name: 'Paneer Schezwan Rice', isVeg: true, singlePrice: 110, fullPrice: 150 },
  { no: 92, catId: 'cat-5', name: 'Paneer Garlic Rice', isVeg: true, singlePrice: 110, fullPrice: 150 },
  { no: 93, catId: 'cat-5', name: 'Kaju Rice', isVeg: true, singlePrice: 120, fullPrice: 160, fullNeedsVerif: true },

  // 6. RICE IN NON-VEG 94-111
  { no: 94, catId: 'cat-6', name: 'Egg Fried Rice', isVeg: false, singlePrice: 80, fullPrice: 130 },
  { no: 95, catId: 'cat-6', name: 'Double Egg Fried Rice', isVeg: false, singlePrice: 90, fullPrice: 140 },
  { no: 96, catId: 'cat-6', name: 'Chilli Garlic Egg Rice', isVeg: false, singlePrice: 90, fullPrice: 140 },
  { no: 97, catId: 'cat-6', name: 'Egg Hakka Rice', isVeg: false, singlePrice: 90, fullPrice: 140 },
  { no: 98, catId: 'cat-6', name: 'Singapore Egg Rice', isVeg: false, singlePrice: 90, fullPrice: 140 },
  { no: 99, catId: 'cat-6', name: 'Schezwan Egg Rice', isVeg: false, singlePrice: 90, fullPrice: 140 },
  { no: 100, catId: 'cat-6', name: 'Chicken Fried Rice', isVeg: false, singlePrice: 100, fullPrice: 140 },
  { no: 101, catId: 'cat-6', name: 'Double Egg Chicken Fried Rice', isVeg: false, singlePrice: 110, fullPrice: 150 },
  { no: 102, catId: 'cat-6', name: 'Chilli Garlic Chicken Rice', isVeg: false, singlePrice: 110, fullPrice: 150 },
  { no: 103, catId: 'cat-6', name: 'Chicken Hakka Rice', isVeg: false, singlePrice: 110, fullPrice: 150 },
  { no: 104, catId: 'cat-6', name: 'Singapore Chicken Rice', isVeg: false, singlePrice: 110, fullPrice: 150 },
  { no: 105, catId: 'cat-6', name: 'Chicken Schezwan Rice', isVeg: false, singlePrice: 110, fullPrice: 150 },
  { no: 106, catId: 'cat-6', name: 'Prawns Fried Rice', isVeg: false, singlePrice: 140, fullPrice: 200 },
  { no: 107, catId: 'cat-6', name: 'Double Egg Prawns Rice', isVeg: false, singlePrice: 150, fullPrice: 210 },
  { no: 108, catId: 'cat-6', name: 'Chilli Garlic Prawns Rice', isVeg: false, singlePrice: 150, fullPrice: 210 },
  { no: 109, catId: 'cat-6', name: 'Prawns Hakka Rice', isVeg: false, singlePrice: 150, fullPrice: 210 },
  { no: 110, catId: 'cat-6', name: 'Singapore Prawns Rice', isVeg: false, singlePrice: 150, fullPrice: 210 },
  { no: 111, catId: 'cat-6', name: 'Prawns Schezwan Rice', isVeg: false, singlePrice: 150, fullPrice: 210 },

  // 7. VEG CURRIES 112-119 (Single Price)
  { no: 112, catId: 'cat-7', name: 'Mix Veg Curry', isVeg: true, singlePrice: 100 },
  { no: 113, catId: 'cat-7', name: 'Kadai Veg', isVeg: true, singlePrice: 120 },
  { no: 114, catId: 'cat-7', name: 'Kaju Curry', isVeg: true, singlePrice: 160 },
  { no: 115, catId: 'cat-7', name: 'Paneer Curry', isVeg: true, singlePrice: 150 },
  { no: 116, catId: 'cat-7', name: 'Paneer Butter Masala', isVeg: true, singlePrice: 160 },
  { no: 117, catId: 'cat-7', name: 'Kadai Paneer', isVeg: true, singlePrice: 160 },
  { no: 118, catId: 'cat-7', name: 'Methi Paneer', isVeg: true, singlePrice: 160 },
  { no: 119, catId: 'cat-7', name: 'Methi Paneer Chaman', isVeg: true, singlePrice: 170 },

  // 8. NON-VEG CURRIES 120-126 (Single Price)
  { no: 120, catId: 'cat-8', name: 'Chicken Curry', isVeg: false, singlePrice: 140 },
  { no: 121, catId: 'cat-8', name: 'Butter Chicken Masala', isVeg: false, singlePrice: 160 },
  { no: 122, catId: 'cat-8', name: 'Kadai Chicken', isVeg: false, singlePrice: 160 },
  { no: 123, catId: 'cat-8', name: 'Masala Methi Chicken', isVeg: false, singlePrice: 160 },
  { no: 124, catId: 'cat-8', name: 'Afghani Chicken', isVeg: false, singlePrice: 170 },
  { no: 125, catId: 'cat-8', name: 'Egg Curry', isVeg: false, singlePrice: 100 },
  { no: 126, catId: 'cat-8', name: 'Egg Butter Masala', isVeg: false, singlePrice: 120 },

  // 9. MOMO'S IN VEG 127-136 (6 Pieces, Single Price)
  { no: 127, catId: 'cat-9', name: "Veg Momo's Steam", isVeg: true, desc: '6 pieces', singlePrice: 70 },
  { no: 128, catId: 'cat-9', name: "Veg Momo's Fry", isVeg: true, desc: '6 pieces', singlePrice: 80 },
  { no: 129, catId: 'cat-9', name: "Veg Kurkure Momo's", isVeg: true, desc: '6 pieces', singlePrice: 100 },
  { no: 130, catId: 'cat-9', name: "Veg Cheese Momo's", isVeg: true, desc: '6 pieces', singlePrice: 110 },
  { no: 131, catId: 'cat-9', name: "Veg Manchurian Momo's", isVeg: true, desc: '6 pieces', singlePrice: 130 },
  { no: 132, catId: 'cat-9', name: "Veg Chilli Momo's", isVeg: true, desc: '6 pieces', singlePrice: 140 },
  { no: 133, catId: 'cat-9', name: "Veg Schezwan Momo's", isVeg: true, desc: '6 pieces', singlePrice: 140 },
  { no: 134, catId: 'cat-9', name: "Veg Cheese Manchurian Momo's", isVeg: true, desc: '6 pieces', singlePrice: 150 },
  { no: 135, catId: 'cat-9', name: "Veg Cheese Chilli Momo's", isVeg: true, desc: '6 pieces', singlePrice: 160 },
  { no: 136, catId: 'cat-9', name: "Veg Cheese Schezwan Momo's", isVeg: true, desc: '6 pieces', singlePrice: 170 },

  // 10. MOMO'S IN NON-VEG – CHICKEN 137-146 (6 Pieces, Single Price)
  { no: 137, catId: 'cat-10', name: "Chicken Steam Momo's", isVeg: false, desc: '6 pieces', singlePrice: 80 },
  { no: 138, catId: 'cat-10', name: "Chicken Fry Momo's", isVeg: false, desc: '6 pieces', singlePrice: 90 },
  { no: 139, catId: 'cat-10', name: "Chicken Kurkure Momo's", isVeg: false, desc: '6 pieces', singlePrice: 120 },
  { no: 140, catId: 'cat-10', name: "Chicken Cheese Momo's", isVeg: false, desc: '6 pieces', singlePrice: 130 },
  { no: 141, catId: 'cat-10', name: "Chicken Manchurian Momo's", isVeg: false, desc: '6 pieces', singlePrice: 140 },
  { no: 142, catId: 'cat-10', name: "Chicken Chilli Momo's", isVeg: false, desc: '6 pieces', singlePrice: 150 },
  { no: 143, catId: 'cat-10', name: "Chicken Schezwan Momo's", isVeg: false, desc: '6 pieces', singlePrice: 160 },
  { no: 144, catId: 'cat-10', name: "Chicken Cheese Manchurian Momo's", isVeg: false, desc: '6 pieces', singlePrice: 160 },
  { no: 145, catId: 'cat-10', name: "Chicken Cheese Chilli Momo's", isVeg: false, desc: '6 pieces', singlePrice: 170 },
  { no: 146, catId: 'cat-10', name: "Chicken Cheese Schezwan Momo's", isVeg: false, desc: '6 pieces', singlePrice: 180 },

  // 11. MOMO'S IN PANEER 147-156 (6 Pieces, Single Price)
  { no: 147, catId: 'cat-11', name: "Paneer Steam Momo's", isVeg: true, desc: '6 pieces', singlePrice: 80 },
  { no: 148, catId: 'cat-11', name: "Paneer Fry Momo's", isVeg: true, desc: '6 pieces', singlePrice: 90 },
  { no: 149, catId: 'cat-11', name: "Paneer Kurkure Momo's", isVeg: true, desc: '6 pieces', singlePrice: 120 },
  { no: 150, catId: 'cat-11', name: "Paneer Cheese Momo's", isVeg: true, desc: '6 pieces', singlePrice: 130 },
  { no: 151, catId: 'cat-11', name: "Paneer Manchurian Momo's", isVeg: true, desc: '6 pieces', singlePrice: 140 },
  { no: 152, catId: 'cat-11', name: "Paneer Chilli Momo's", isVeg: true, desc: '6 pieces', singlePrice: 150 },
  { no: 153, catId: 'cat-11', name: "Paneer Schezwan Momo's", isVeg: true, desc: '6 pieces', singlePrice: 160 },
  { no: 154, catId: 'cat-11', name: "Paneer Cheese Manchurian Momo's", isVeg: true, desc: '6 pieces', singlePrice: 160 },
  { no: 155, catId: 'cat-11', name: "Paneer Cheese Chilli Momo's", isVeg: true, desc: '6 pieces', singlePrice: 170 },
  { no: 156, catId: 'cat-11', name: "Paneer Cheese Schezwan Momo's", isVeg: true, desc: '6 pieces', singlePrice: 180 },

  // 12. BIRYANI'S IN VEG 157-158 (Single Price)
  { no: 157, catId: 'cat-12', name: 'Veg Biryani', isVeg: true, singlePrice: 100 },
  { no: 158, catId: 'cat-12', name: 'Paneer Biryani', isVeg: true, singlePrice: 130 },

  // 13. BIRYANI'S IN NON-VEG 159-163
  { no: 159, catId: 'cat-13', name: 'Hyderabadi Dum Biryani', isVeg: false, singlePrice: 130 },
  { no: 160, catId: 'cat-13', name: 'Lollipop Biryani', isVeg: false, singlePrice: 150 },
  { no: 161, catId: 'cat-13', name: 'Special Biryani', isVeg: false, singlePrice: 100, fullPrice: 160, sizeLabels: ['Regular', 'Large'] },
  { no: 162, catId: 'cat-13', name: 'Prawns Biryani', isVeg: false, singlePrice: 100, fullPrice: 180, sizeLabels: ['Regular', 'Large'] },
  { no: 163, catId: 'cat-13', name: 'Fish Biryani', isVeg: false, singlePrice: 100, fullPrice: 180, sizeLabels: ['Regular', 'Large'] },

  // 14. SOFT DRINK 164-165
  { no: 164, catId: 'cat-14', name: 'Soft Drink', isVeg: true, singlePrice: 10, fullPrice: 20, sizeLabels: ['Small', 'Large'] },
  { no: 165, catId: 'cat-14', name: 'Add-Ons', isVeg: true, desc: 'Extra sauce / onion / lemon', singlePrice: 10 },
];

export function generateSeedMenuItems(): MenuItem[] {
  return RAW_MENU_DEFS.map((def) => {
    const hasFull = typeof def.fullPrice === 'number';
    const singleLabel = def.sizeLabels ? def.sizeLabels[0] : (hasFull ? 'Single' : 'Regular');
    const fullLabel = def.sizeLabels ? def.sizeLabels[1] : 'Full';

    const variants = [
      {
        id: `var-${def.no}-s`,
        label: singleLabel,
        price_paise: def.singlePrice * 100,
        available: true,
        needs_verification: false,
      },
    ];

    if (hasFull && def.fullPrice !== undefined) {
      variants.push({
        id: `var-${def.no}-f`,
        label: fullLabel,
        price_paise: def.fullPrice * 100,
        available: true,
        needs_verification: Boolean(def.fullNeedsVerif),
      });
    }

    return {
      id: `item-${def.no}`,
      category_id: def.catId,
      item_no: def.no,
      name: def.name,
      description: def.desc,
      is_veg: def.isVeg,
      available: true,
      sort_order: def.no,
      variants,
    };
  });
}

export const SEED_MENU_ITEMS: MenuItem[] = generateSeedMenuItems();
