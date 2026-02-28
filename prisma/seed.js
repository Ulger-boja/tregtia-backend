const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: 'vehicles', name_sq: 'Automjete', name_en: 'Vehicles', icon: 'car', sortOrder: 1,
    children: [
      { slug: 'cars', name_sq: 'Makina', name_en: 'Cars', icon: 'car', sortOrder: 1 },
      { slug: 'motorcycles', name_sq: 'Motorra', name_en: 'Motorcycles', icon: 'bike', sortOrder: 2 },
      { slug: 'parts', name_sq: 'Pjesë këmbimi', name_en: 'Parts', icon: 'wrench', sortOrder: 3 },
    ]},
  { slug: 'properties', name_sq: 'Prona', name_en: 'Properties', icon: 'home', sortOrder: 2,
    children: [
      { slug: 'apartments', name_sq: 'Apartamente', name_en: 'Apartments', sortOrder: 1 },
      { slug: 'houses', name_sq: 'Shtëpi', name_en: 'Houses', sortOrder: 2 },
      { slug: 'land', name_sq: 'Tokë', name_en: 'Land', sortOrder: 3 },
      { slug: 'commercial', name_sq: 'Komerciale', name_en: 'Commercial', sortOrder: 4 },
    ]},
  { slug: 'electronics', name_sq: 'Elektronikë', name_en: 'Electronics', icon: 'smartphone', sortOrder: 3,
    children: [
      { slug: 'phones', name_sq: 'Telefona', name_en: 'Phones', sortOrder: 1 },
      { slug: 'computers', name_sq: 'Kompjutera', name_en: 'Computers', sortOrder: 2 },
      { slug: 'tv-audio', name_sq: 'TV & Audio', name_en: 'TV & Audio', sortOrder: 3 },
      { slug: 'gaming', name_sq: 'Gaming', name_en: 'Gaming', sortOrder: 4 },
    ]},
  { slug: 'furniture', name_sq: 'Mobilje', name_en: 'Furniture', icon: 'sofa', sortOrder: 4,
    children: [
      { slug: 'living-room', name_sq: 'Dhomë ndenje', name_en: 'Living Room', sortOrder: 1 },
      { slug: 'bedroom', name_sq: 'Dhomë gjumi', name_en: 'Bedroom', sortOrder: 2 },
      { slug: 'kitchen', name_sq: 'Kuzhinë', name_en: 'Kitchen', sortOrder: 3 },
      { slug: 'office', name_sq: 'Zyrë', name_en: 'Office', sortOrder: 4 },
    ]},
  { slug: 'fashion', name_sq: 'Modë', name_en: 'Fashion', icon: 'shirt', sortOrder: 5,
    children: [
      { slug: 'mens', name_sq: 'Për meshkuj', name_en: "Men's", sortOrder: 1 },
      { slug: 'womens', name_sq: 'Për femra', name_en: "Women's", sortOrder: 2 },
      { slug: 'kids', name_sq: 'Për fëmijë', name_en: "Kids", sortOrder: 3 },
      { slug: 'shoes', name_sq: 'Këpucë', name_en: 'Shoes', sortOrder: 4 },
    ]},
  { slug: 'jobs', name_sq: 'Punë', name_en: 'Jobs', icon: 'briefcase', sortOrder: 6,
    children: [
      { slug: 'full-time', name_sq: 'Kohe e plotë', name_en: 'Full-time', sortOrder: 1 },
      { slug: 'part-time', name_sq: 'Kohë e pjesshme', name_en: 'Part-time', sortOrder: 2 },
      { slug: 'freelance', name_sq: 'Freelance', name_en: 'Freelance', sortOrder: 3 },
    ]},
  { slug: 'services', name_sq: 'Shërbime', name_en: 'Services', icon: 'wrench', sortOrder: 7 },
  { slug: 'pets', name_sq: 'Kafshë', name_en: 'Pets', icon: 'paw-print', sortOrder: 8 },
  { slug: 'sports', name_sq: 'Sport', name_en: 'Sports', icon: 'dumbbell', sortOrder: 9 },
  { slug: 'other', name_sq: 'Të tjera', name_en: 'Other', icon: 'more-horizontal', sortOrder: 10 },
];

async function main() {
  console.log('Seeding categories...');
  for (const cat of CATEGORIES) {
    const { children, ...data } = cat;
    const parent = await prisma.category.upsert({
      where: { slug: data.slug },
      create: data,
      update: data,
    });
    console.log(`  ✓ ${data.slug}`);
    if (children) {
      for (const child of children) {
        await prisma.category.upsert({
          where: { slug: child.slug },
          create: { ...child, parentId: parent.id },
          update: { ...child, parentId: parent.id },
        });
        console.log(`    ↳ ${child.slug}`);
      }
    }
  }
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
