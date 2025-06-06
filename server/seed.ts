import { db } from "./db";
import { cropTemplates } from "@shared/schema";

const templates = [
  {
    name: "Peas",
    variety: "Dunn",
    growingDays: 60,
    specialInstructions: "Plant in early spring. Keep soil moist but well-drained. Harvest when pods are plump but before they become tough.",
    maintenanceSchedule: [
      {
        eventType: "watering",
        frequency: "daily",
        notes: "Water deeply in the morning, especially during flowering"
      },
      {
        eventType: "inspection",
        frequency: "every_3_days",
        notes: "Check for pests and disease, especially powdery mildew"
      },
      {
        eventType: "fertilizing",
        frequency: "weekly",
        notes: "Apply balanced fertilizer during early growth"
      }
    ]
  },
  {
    name: "Tomato",
    variety: "Cherry",
    growingDays: 70,
    specialInstructions: "Plant in full sun. Water regularly and deeply. Stake or cage plants for support. Harvest when fruits are fully colored.",
    maintenanceSchedule: [
      {
        eventType: "watering",
        frequency: "daily",
        notes: "Water at base of plant, avoid wetting leaves"
      },
      {
        eventType: "inspection",
        frequency: "daily",
        notes: "Check for pests, disease, and remove suckers"
      },
      {
        eventType: "fertilizing",
        frequency: "weekly",
        notes: "Apply tomato-specific fertilizer"
      }
    ]
  },
  {
    name: "Basil",
    variety: "Sweet",
    growingDays: 30,
    specialInstructions: "Plant in well-draining soil. Pinch off flower buds to encourage leaf growth. Harvest leaves regularly to promote bushiness.",
    maintenanceSchedule: [
      {
        eventType: "watering",
        frequency: "daily",
        notes: "Keep soil consistently moist but not waterlogged"
      },
      {
        eventType: "inspection",
        frequency: "daily",
        notes: "Check for pests and pinch off flower buds"
      },
      {
        eventType: "harvesting",
        frequency: "weekly",
        notes: "Harvest leaves to encourage bushier growth"
      }
    ]
  },
  {
    name: "Lettuce",
    variety: "Butterhead",
    growingDays: 45,
    specialInstructions: "Plant in cool weather. Keep soil consistently moist. Harvest outer leaves or entire head when mature.",
    maintenanceSchedule: [
      {
        eventType: "watering",
        frequency: "daily",
        notes: "Keep soil moist, especially in hot weather"
      },
      {
        eventType: "inspection",
        frequency: "daily",
        notes: "Check for pests and disease"
      },
      {
        eventType: "fertilizing",
        frequency: "weekly",
        notes: "Apply nitrogen-rich fertilizer"
      }
    ]
  },
  {
    name: "Carrot",
    variety: "Nantes",
    growingDays: 65,
    specialInstructions: "Plant in loose, well-draining soil. Thin seedlings to prevent crowding. Harvest when roots are about 1 inch in diameter.",
    maintenanceSchedule: [
      {
        eventType: "watering",
        frequency: "daily",
        notes: "Keep soil moist but not waterlogged"
      },
      {
        eventType: "inspection",
        frequency: "every_3_days",
        notes: "Check for pests and weed regularly"
      },
      {
        eventType: "thinning",
        frequency: "weekly",
        notes: "Thin seedlings to prevent crowding"
      }
    ]
  },
  {
    name: "Cucumber",
    variety: "Marketmore",
    growingDays: 55,
    specialInstructions: "Plant in full sun. Provide trellis for vining varieties. Keep soil consistently moist. Harvest when fruits are firm and green.",
    maintenanceSchedule: [
      {
        eventType: "watering",
        frequency: "daily",
        notes: "Water deeply, especially during fruiting"
      },
      {
        eventType: "inspection",
        frequency: "daily",
        notes: "Check for pests and train vines"
      },
      {
        eventType: "fertilizing",
        frequency: "weekly",
        notes: "Apply balanced fertilizer"
      }
    ]
  },
  {
    name: "Spinach",
    variety: "Bloomsdale",
    growingDays: 40,
    specialInstructions: "Plant in cool weather. Keep soil moist. Harvest outer leaves when they reach desired size.",
    maintenanceSchedule: [
      {
        eventType: "watering",
        frequency: "daily",
        notes: "Keep soil consistently moist"
      },
      {
        eventType: "inspection",
        frequency: "daily",
        notes: "Check for pests and disease"
      },
      {
        eventType: "fertilizing",
        frequency: "weekly",
        notes: "Apply nitrogen-rich fertilizer"
      }
    ]
  },
  {
    name: "Bell Pepper",
    variety: "California Wonder",
    growingDays: 75,
    specialInstructions: "Plant in full sun. Water regularly. Harvest when fruits are firm and fully colored.",
    maintenanceSchedule: [
      {
        eventType: "watering",
        frequency: "daily",
        notes: "Water deeply, especially during fruiting"
      },
      {
        eventType: "inspection",
        frequency: "daily",
        notes: "Check for pests and disease"
      },
      {
        eventType: "fertilizing",
        frequency: "weekly",
        notes: "Apply balanced fertilizer"
      }
    ]
  },
  {
    name: "Green Beans",
    variety: "Blue Lake",
    growingDays: 50,
    specialInstructions: "Plant in well-draining soil. Provide support for pole varieties. Harvest when pods are firm and crisp.",
    maintenanceSchedule: [
      {
        eventType: "watering",
        frequency: "daily",
        notes: "Keep soil moist but not waterlogged"
      },
      {
        eventType: "inspection",
        frequency: "every_3_days",
        notes: "Check for pests and disease"
      },
      {
        eventType: "fertilizing",
        frequency: "weekly",
        notes: "Apply balanced fertilizer"
      }
    ]
  },
  {
    name: "Radish",
    variety: "Cherry Belle",
    growingDays: 25,
    specialInstructions: "Plant in cool weather. Keep soil moist. Harvest when roots are about 1 inch in diameter.",
    maintenanceSchedule: [
      {
        eventType: "watering",
        frequency: "daily",
        notes: "Keep soil consistently moist"
      },
      {
        eventType: "inspection",
        frequency: "daily",
        notes: "Check for pests and disease"
      },
      {
        eventType: "thinning",
        frequency: "weekly",
        notes: "Thin seedlings to prevent crowding"
      }
    ]
  }
];

async function seed() {
  try {
    console.log("Seeding crop templates...");
    for (const template of templates) {
      await db.insert(cropTemplates).values(template);
    }
    console.log("Crop templates seeded successfully!");
  } catch (error) {
    console.error("Error seeding crop templates:", error);
  }
}

seed();
