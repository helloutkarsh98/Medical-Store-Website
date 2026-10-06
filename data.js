// =============================================
// MedQuick — Data Store (data.js)
// =============================================

// Store Location (set this to your actual store lat/lng)
const STORE_LOCATION = {
  lat: 28.6139,   // Example: New Delhi
  lng: 77.2090,
  address: 'MedQuick Pharmacy, Connaught Place, New Delhi - 110001'
};

const DELIVERY_RADIUS_KM = 5;
const DELIVERY_FEE = 40;
const FREE_DELIVERY_ABOVE = 500;

// Promo Codes
const PROMO_CODES = {
  'SAVE10':  { type: 'percent', value: 10, desc: '10% off on all orders' },
  'FIRST20': { type: 'percent', value: 20, desc: '20% off for new users' },
  'MEDS15':  { type: 'percent', value: 15, desc: '15% off on medicines' },
  'FLAT50':  { type: 'flat',    value: 50, desc: '₹50 flat discount' },
  'FLAT100': { type: 'flat',    value: 100, desc: '₹100 flat discount' }
};

// Categories
const CATEGORIES = [
  { name: 'Pain Relief',         emoji: '💊', color: '#ef4444' },
  { name: 'Antibiotics',         emoji: '🦠', color: '#f59e0b' },
  { name: 'Vitamins',            emoji: '🌟', color: '#10b981' },
  { name: 'Diabetes',            emoji: '🩺', color: '#3b82f6' },
  { name: 'Heart & Blood Pressure', emoji: '❤️', color: '#ec4899' },
  { name: 'Digestive',           emoji: '🍃', color: '#14b8a6' },
  { name: 'Skin Care',           emoji: '✨', color: '#8b5cf6' },
  { name: 'Cold & Flu',          emoji: '🤧', color: '#06b6d4' },
  { name: 'Allergy',             emoji: '🌸', color: '#f97316' },
  { name: 'Eye & Ear',           emoji: '👁️', color: '#6366f1' },
  { name: 'First Aid',           emoji: '🩹', color: '#22c55e' },
  { name: 'Baby Care',           emoji: '👶', color: '#fb923c' }
];

// Medicine Products
const MEDICINES = [
  // Pain Relief
  { id: 1, name: 'Paracetamol 500mg', brand: 'Calpol', category: 'Pain Relief', price: 35, stock: 150, form: 'Tablet', prescription: false, featured: true, description: 'Effective fever reducer and mild pain reliever. Suitable for adults and children above 12 years.' },
  { id: 2, name: 'Ibuprofen 400mg', brand: 'Brufen', category: 'Pain Relief', price: 55, stock: 120, form: 'Tablet', prescription: false, featured: false, description: 'Anti-inflammatory pain reliever for headaches, dental pain, and muscle aches.' },
  { id: 3, name: 'Diclofenac 50mg', brand: 'Voveran', category: 'Pain Relief', price: 78, stock: 80, form: 'Tablet', prescription: true, featured: false, description: 'Prescription NSAID for moderate to severe pain and inflammation.' },
  { id: 4, name: 'Aspirin 75mg', brand: 'Ecosprin', category: 'Pain Relief', price: 28, stock: 200, form: 'Tablet', prescription: false, featured: false, description: 'Low-dose aspirin for heart health and mild pain relief.' },

  // Antibiotics
  { id: 5, name: 'Amoxicillin 500mg', brand: 'Mox', category: 'Antibiotics', price: 120, stock: 60, form: 'Capsule', prescription: true, featured: true, description: 'Broad-spectrum antibiotic for bacterial infections. Requires valid prescription.' },
  { id: 6, name: 'Azithromycin 500mg', brand: 'Azithral', category: 'Antibiotics', price: 145, stock: 50, form: 'Tablet', prescription: true, featured: false, description: 'Macrolide antibiotic for respiratory and skin infections.' },
  { id: 7, name: 'Ciprofloxacin 500mg', brand: 'Cifran', category: 'Antibiotics', price: 98, stock: 70, form: 'Tablet', prescription: true, featured: false, description: 'Fluoroquinolone antibiotic for urinary tract and other bacterial infections.' },

  // Vitamins
  { id: 8, name: 'Vitamin C 1000mg', brand: 'Limcee', category: 'Vitamins', price: 85, stock: 200, form: 'Tablet', prescription: false, featured: true, description: 'High-strength Vitamin C for immune support and antioxidant protection.' },
  { id: 9, name: 'Vitamin D3 60000 IU', brand: 'D-Rise', category: 'Vitamins', price: 220, stock: 90, form: 'Capsule', prescription: false, featured: true, description: 'Weekly Vitamin D3 supplement for bone health and immunity.' },
  { id: 10, name: 'Multivitamin Daily', brand: 'Supradyn', category: 'Vitamins', price: 350, stock: 75, form: 'Tablet', prescription: false, featured: false, description: 'Complete daily multivitamin with minerals for overall health.' },
  { id: 11, name: 'Zinc 50mg', brand: 'Zincovit', category: 'Vitamins', price: 145, stock: 110, form: 'Tablet', prescription: false, featured: false, description: 'Zinc supplement for immune function and wound healing.' },
  { id: 12, name: 'Omega-3 Fish Oil', brand: 'OmegaMax', category: 'Vitamins', price: 480, stock: 55, form: 'Capsule', prescription: false, featured: false, description: 'High-potency omega-3 fatty acids for heart and brain health.' },

  // Diabetes
  { id: 13, name: 'Metformin 500mg', brand: 'Glycomet', category: 'Diabetes', price: 68, stock: 100, form: 'Tablet', prescription: true, featured: true, description: 'First-line medication for type 2 diabetes management.' },
  { id: 14, name: 'Glipizide 5mg', brand: 'Glynase', category: 'Diabetes', price: 95, stock: 60, form: 'Tablet', prescription: true, featured: false, description: 'Sulfonylurea for blood sugar control in type 2 diabetes.' },
  { id: 15, name: 'Glucometer Test Strips', brand: 'OneTouch', category: 'Diabetes', price: 850, stock: 40, form: 'Strips', prescription: false, featured: false, description: 'Compatible test strips for blood glucose monitoring.' },

  // Heart & Blood Pressure
  { id: 16, name: 'Amlodipine 5mg', brand: 'Amlong', category: 'Heart & Blood Pressure', price: 78, stock: 85, form: 'Tablet', prescription: true, featured: false, description: 'Calcium channel blocker for high blood pressure and angina.' },
  { id: 17, name: 'Atorvastatin 10mg', brand: 'Lipitor', category: 'Heart & Blood Pressure', price: 135, stock: 70, form: 'Tablet', prescription: true, featured: false, description: 'Statin medication for lowering cholesterol levels.' },
  { id: 18, name: 'Aspirin 75mg (Cardiac)', brand: 'Disprin', category: 'Heart & Blood Pressure', price: 42, stock: 150, form: 'Tablet', prescription: false, featured: false, description: 'Low-dose aspirin for prevention of heart attacks and strokes.' },

  // Digestive
  { id: 19, name: 'Omeprazole 20mg', brand: 'Omez', category: 'Digestive', price: 88, stock: 100, form: 'Capsule', prescription: false, featured: true, description: 'Proton pump inhibitor for acid reflux and stomach ulcers.' },
  { id: 20, name: 'Antacid Suspension', brand: 'Gelusil', category: 'Digestive', price: 95, stock: 80, form: 'Syrup', prescription: false, featured: false, description: 'Fast-acting antacid for heartburn and indigestion relief.' },
  { id: 21, name: 'ORS Sachets', brand: 'Electral', category: 'Digestive', price: 45, stock: 200, form: 'Powder', prescription: false, featured: false, description: 'Oral rehydration salts for diarrhea and dehydration.' },
  { id: 22, name: 'Loperamide 2mg', brand: 'Imodium', category: 'Digestive', price: 65, stock: 90, form: 'Tablet', prescription: false, featured: false, description: 'Anti-diarrheal medication for acute diarrhea.' },

  // Skin Care
  { id: 23, name: 'Clotrimazole Cream 1%', brand: 'Canesten', category: 'Skin Care', price: 115, stock: 70, form: 'Cream', prescription: false, featured: false, description: 'Antifungal cream for skin infections, athlete\'s foot, and ringworm.' },
  { id: 24, name: 'Betadine Antiseptic', brand: 'Betadine', category: 'Skin Care', price: 85, stock: 100, form: 'Cream', prescription: false, featured: false, description: 'Povidone-iodine antiseptic for wound care and infection prevention.' },
  { id: 25, name: 'Hydrocortisone 1%', brand: 'Cortef', category: 'Skin Care', price: 130, stock: 55, form: 'Cream', prescription: false, featured: false, description: 'Mild steroid cream for skin inflammation, eczema, and rashes.' },

  // Cold & Flu
  { id: 26, name: 'Cetirizine 10mg', brand: 'Zyrtec', category: 'Cold & Flu', price: 45, stock: 150, form: 'Tablet', prescription: false, featured: true, description: 'Antihistamine for allergy symptoms, runny nose, and watery eyes.' },
  { id: 27, name: 'Cough Syrup DM', brand: 'Benadryl', category: 'Cold & Flu', price: 120, stock: 80, form: 'Syrup', prescription: false, featured: false, description: 'Dextromethorphan cough suppressant for dry cough.' },
  { id: 28, name: 'Nasal Spray Decongestant', brand: 'Otrivin', category: 'Cold & Flu', price: 155, stock: 60, form: 'Drops', prescription: false, featured: false, description: 'Fast-acting nasal decongestant for blocked nose relief.' },

  // Allergy
  { id: 29, name: 'Fexofenadine 180mg', brand: 'Allegra', category: 'Allergy', price: 185, stock: 65, form: 'Tablet', prescription: false, featured: false, description: 'Non-drowsy antihistamine for seasonal and perennial allergies.' },
  { id: 30, name: 'Loratadine 10mg', brand: 'Clarityn', category: 'Allergy', price: 95, stock: 90, form: 'Tablet', prescription: false, featured: false, description: 'Long-acting antihistamine for allergy relief without drowsiness.' },

  // Eye & Ear
  { id: 31, name: 'Eye Drops Lubricating', brand: 'Refresh', category: 'Eye & Ear', price: 175, stock: 55, form: 'Drops', prescription: false, featured: false, description: 'Preservative-free lubricating eye drops for dry eyes.' },
  { id: 32, name: 'Ciprofloxacin Eye Drops', brand: 'Ciplox', category: 'Eye & Ear', price: 95, stock: 45, form: 'Drops', prescription: true, featured: false, description: 'Antibiotic eye drops for bacterial conjunctivitis and eye infections.' },
  { id: 33, name: 'Ear Drops Wax Removal', brand: 'Earex', category: 'Eye & Ear', price: 145, stock: 50, form: 'Drops', prescription: false, featured: false, description: 'Gentle ear drops for ear wax softening and removal.' },

  // First Aid
  { id: 34, name: 'Bandage Roll 5cm', brand: 'MediPlus', category: 'First Aid', price: 35, stock: 200, form: 'Bandage', prescription: false, featured: false, description: 'Flexible cotton bandage roll for wound dressing and support.' },
  { id: 35, name: 'Antiseptic Wipes', brand: 'Dettol', category: 'First Aid', price: 85, stock: 150, form: 'Wipes', prescription: false, featured: false, description: 'Individually wrapped antiseptic wipes for wound cleaning.' },
  { id: 36, name: 'Digital Thermometer', brand: 'Dr. Morepen', category: 'First Aid', price: 299, stock: 40, form: 'Device', prescription: false, featured: true, description: 'Fast and accurate digital thermometer with fever alarm.' },

  // Baby Care
  { id: 37, name: 'Infant Paracetamol Drops', brand: 'Calpol Baby', category: 'Baby Care', price: 95, stock: 60, form: 'Drops', prescription: false, featured: false, description: 'Fever and pain relief drops formulated for infants 3 months and older.' },
  { id: 38, name: 'Baby Gripe Water', brand: 'Woodward\'s', category: 'Baby Care', price: 115, stock: 75, form: 'Syrup', prescription: false, featured: false, description: 'Traditional remedy for infant colic, gas, and stomach discomfort.' },
  { id: 39, name: 'Zinc & Vitamin A Syrup', brand: 'Zincolak', category: 'Baby Care', price: 145, stock: 50, form: 'Syrup', prescription: false, featured: false, description: 'Nutritional supplement for growing children for immune and growth support.' }
];

// Default admin credentials (for demo)
const ADMIN_CREDENTIALS = {
  email: 'admin@medquick.in',
  password: 'Admin@123',
  name: 'MedQuick Admin',
  role: 'admin'
};

// Demo user credentials
const DEMO_USER = {
  email: 'demo@medquick.in',
  password: 'Demo@123',
  firstName: 'Demo',
  lastName: 'User',
  phone: '+91 90000 00001',
  dob: '1990-01-01',
  role: 'customer'
};
