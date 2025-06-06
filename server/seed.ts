import { db } from "./db";
import { cropTemplates } from "@shared/schema";

const templates = [
  {
    name: "Peas",
    variety: "Dunn",
    growingDays: 60,
    specialInstructions: "Plant in early spring. Keep soil moist but well-drained. Harvest when pods are plump but before they become tough."
  },
  {
    name: "Tomato",
    variety: "Cherry",
    growingDays: 70,
    specialInstructions: "Plant in full sun. Water regularly and deeply. Stake or cage plants for support. Harvest when fruits are fully colored."
  },
  {
    name: "Basil",
    variety: "Sweet",
    growingDays: 30,
    specialInstructions: "Plant in well-draining soil. Pinch off flower buds to encourage leaf growth. Harvest leaves regularly to promote bushiness."
  },
  {
    name: "Lettuce",
    variety: "Butterhead",
    growingDays: 45,
    specialInstructions: "Plant in cool weather. Keep soil consistently moist. Harvest outer leaves or entire head when mature."
  },
  {
    name: "Carrot",
    variety: "Nantes",
    growingDays: 65,
    specialInstructions: "Plant in loose, well-draining soil. Thin seedlings to prevent crowding. Harvest when roots are about 1 inch in diameter."
  },
  {
    name: "Cucumber",
    variety: "Marketmore",
    growingDays: 55,
    specialInstructions: "Plant in full sun. Provide trellis for vining varieties. Keep soil consistently moist. Harvest when fruits are firm and green."
  },
  {
    name: "Spinach",
    variety: "Bloomsdale",
    growingDays: 40,
    specialInstructions: "Plant in cool weather. Keep soil moist. Harvest outer leaves when they reach desired size."
  },
  {
    name: "Bell Pepper",
    variety: "California Wonder",
    growingDays: 75,
    specialInstructions: "Plant in full sun. Water regularly. Harvest when fruits are firm and fully colored."
  },
  {
    name: "Green Beans",
    variety: "Blue Lake",
    growingDays: 50,
    specialInstructions: "Plant in well-draining soil. Provide support for pole varieties. Harvest when pods are firm and crisp."
  },
  {
    name: "Radish",
    variety: "Cherry Belle",
    growingDays: 25,
    specialInstructions: "Plant in cool weather. Keep soil moist. Harvest when roots are about 1 inch in diameter."
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
