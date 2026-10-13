import { PrismaClient, OrderType, PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Orla Gym & Cafe MySQL Database...');

  // 1. Seed Admin
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@orlagym.com' },
    update: {},
    create: {
      email: 'admin@orlagym.com',
      password_hash: adminPasswordHash,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      is_active: true,
    },
  });
  console.log('✅ Admin seeded:', admin.email);

  // 2. Seed Business
  const business = await prisma.business.upsert({
    where: { id: 1 },
    update: {
      name: 'Orla Gym and Cafe',
      email: 'contact@orlagym.com',
      website: 'https://orlagym.com',
    },
    create: {
      name: 'Orla Gym and Cafe',
      logo: '/uploads/orla_logo.png',
      hero_banner: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop',
      description: 'Your premier destination for 100% authentic gym supplements, elite fitness apparel, training gear, and nutrient-dense cafe smoothies.',
      history: 'Founded with a passion to empower athletes and fitness enthusiasts with lab-tested, genuine nutrition and a welcoming community atmosphere.',
      mission: 'To deliver top-tier genuine supplements, wholesome protein cafe fuel, and expert guidance to help every athlete surpass their fitness milestones.',
      vision: 'To be the most trusted fitness lifestyle and nutritional hub across the nation.',
      phone: '+977 9801234567',
      email: 'contact@orlagym.com',
      website: 'https://orlagym.com',
      address: 'Fitness Street, New Baneshwor, Kathmandu, Nepal',
      social_links: {
        facebook: 'https://facebook.com/orlagym',
        instagram: 'https://instagram.com/orlagym_cafe',
        tiktok: 'https://tiktok.com/@orlagym',
        youtube: 'https://youtube.com/@orlagym',
      },
    },
  });

  console.log('✅ Business seeded:', business.name);

  // 3. Seed Owner
  const owner = await prisma.owner.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Ashim Sharma',
      position: 'Founder & Head Performance Coach',
      photo: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=600&auto=format&fit=crop',
      biography: 'Certified sports nutritionist and national bodybuilding competitor with over 10 years of experience helping thousands transform their physique, strength, and health.',
      experience: '12+ Years in Professional Bodybuilding & Athletic Nutrition Consulting',
      contact: '+977 9801234568',
      social_links: {
        instagram: 'https://instagram.com/ashim_fitness',
        linkedin: 'https://linkedin.com/in/ashim-sharma',
      },
    },
  });
  console.log('✅ Owner seeded:', owner.name);

  // 4. Seed Branches (1 can_order = true, 2 can_order = false)
  await prisma.branch.deleteMany();

  const branch1 = await prisma.branch.create({
    data: {
      name: 'Baneshwor Central (Main Hub & Ordering Center)',
      description: 'Our flagship store & cafe featuring complete supplement inventory, fresh shake bar, and instant home delivery dispatch.',
      address: 'Baneshwor Chowk, Near Civil Hospital, Kathmandu',
      phone: '+977 9801234567',
      latitude: 27.6915,
      longitude: 85.3420,
      opening_hours: 'Sun - Fri: 6:00 AM - 9:30 PM | Sat: 7:00 AM - 7:00 PM',
      image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=800&auto=format&fit=crop',
      can_order: true, // ONLY THIS BRANCH SUPPORTS ONLINE ORDERING
      is_active: true,
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      name: 'Jhamsikhel Fitness Outlet',
      description: 'Boutique supplements and fitness studio location with on-site protein bar.',
      address: 'Jhamsikhel Road, Lalitpur (Opposite St. Marys)',
      phone: '+977 9801234569',
      latitude: 27.6782,
      longitude: 85.3128,
      opening_hours: 'Sun - Fri: 6:30 AM - 9:00 PM | Sat: 8:00 AM - 6:00 PM',
      image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800&auto=format&fit=crop',
      can_order: false, // STORE LOCATION ONLY
      is_active: true,
    },
  });

  const branch3 = await prisma.branch.create({
    data: {
      name: 'Pokhara Lakeside Branch',
      description: 'Scenic lakeside supplement showroom and fitness lounge for athletes and tourists.',
      address: 'Lakeside Center, Pokhara 6, Kaski',
      phone: '+977 9801234570',
      latitude: 28.2096,
      longitude: 83.9585,
      opening_hours: 'Daily: 7:00 AM - 9:00 PM',
      image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=800&auto=format&fit=crop',
      can_order: false, // STORE LOCATION ONLY
      is_active: true,
    },
  });
  console.log('✅ Branches seeded (1 Online Ordering, 2 Store Location Only)');

  // 5. Seed Categories
  await prisma.productImage.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const catProteins = await prisma.category.create({
    data: {
      name: 'Whey & Plant Proteins',
      slug: 'proteins',
      image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?q=80&w=400&auto=format&fit=crop',
      is_active: true,
    },
  });

  const catCreatine = await prisma.category.create({
    data: {
      name: 'Creatine & Performance',
      slug: 'creatine-performance',
      image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=400&auto=format&fit=crop',
      is_active: true,
    },
  });

  const catPreWorkout = await prisma.category.create({
    data: {
      name: 'Pre-Workout & Energy',
      slug: 'pre-workout-energy',
      image: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?q=80&w=400&auto=format&fit=crop',
      is_active: true,
    },
  });

  const catVitamins = await prisma.category.create({
    data: {
      name: 'Vitamins & Health',
      slug: 'vitamins-health',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop',
      is_active: true,
    },
  });

  const catGear = await prisma.category.create({
    data: {
      name: 'Gym Gear & Accessories',
      slug: 'gear-accessories',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop',
      is_active: true,
    },
  });

  const catCafe = await prisma.category.create({
    data: {
      name: 'Cafe Fuel & Protein Snacks',
      slug: 'cafe-protein-snacks',
      image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=400&auto=format&fit=crop',
      is_active: true,
    },
  });
  console.log('✅ Categories seeded');

  // 6. Seed Products (12 rich products with discounts, featured, and out of stock)
  const productsData = [
    {
      category_id: catProteins.id,
      name: '100% Gold Standard 100% Whey Isolate (5 lbs)',
      slug: 'gold-standard-whey-isolate-5lbs',
      description: 'Ultra-pure whey isolate offering 25g of fast-digesting protein with 5.5g of BCAAs per serving. Low in carbs and fats for lean muscle building and rapid post-workout recovery.',
      price: 11500.00,
      discount_price: 9999.00,
      stock_quantity: 24,
      main_image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?q=80&w=600&auto=format&fit=crop',
      is_available: true,
      is_featured: true,
    },
    {
      category_id: catProteins.id,
      name: 'NitroTech Ripped Lean Protein Powder (4 lbs)',
      slug: 'nitrotech-ripped-lean-protein',
      description: 'Advanced 7-in-1 protein formula engineered with 30g of whey peptides and isolate, plus L-carnitine, CLA, and green tea extract for cutting phases.',
      price: 10200.00,
      discount_price: null,
      stock_quantity: 15,
      main_image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=600&auto=format&fit=crop',
      is_available: true,
      is_featured: true,
    },
    {
      category_id: catProteins.id,
      name: 'Serious Mass High Calorie Gainer (12 lbs)',
      slug: 'serious-mass-high-calorie-gainer',
      description: 'Ultimate mass building formula providing 1,250 calories and 50g of protein per serving with added creatine and glutamine for hardgainers.',
      price: 12800.00,
      discount_price: 11500.00,
      stock_quantity: 0, // OUT OF STOCK PRODUCT
      main_image: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?q=80&w=600&auto=format&fit=crop',
      is_available: true,
      is_featured: false,
    },
    {
      category_id: catCreatine.id,
      name: 'Pure Micronized Creatine Monohydrate (300g)',
      slug: 'pure-micronized-creatine-monohydrate-300g',
      description: '100% pure Creapure pharmaceutical-grade micronized creatine. Boosts cellular ATP energy, maximal muscle power, strength output, and workout endurance.',
      price: 3200.00,
      discount_price: 2650.00,
      stock_quantity: 45,
      main_image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=600&auto=format&fit=crop',
      is_available: true,
      is_featured: true,
    },
    {
      category_id: catCreatine.id,
      name: 'Xtend BCAA Intra-Workout Powder (30 Servings)',
      slug: 'xtend-bcaa-intra-workout-powder',
      description: '7g of Branched Chain Amino Acids in the proven 2:1:1 ratio, fortified with hydrating electrolytes to fuel recovery throughout strenuous sessions.',
      price: 4500.00,
      discount_price: null,
      stock_quantity: 30,
      main_image: 'https://images.unsplash.com/photo-1579722822180-2a62d64f0b2f?q=80&w=600&auto=format&fit=crop',
      is_available: true,
      is_featured: false,
    },
    {
      category_id: catPreWorkout.id,
      name: 'C4 Ultimate Pre-Workout Explosive Energy (20 Servings)',
      slug: 'c4-ultimate-pre-workout-explosive',
      description: 'Maximal potency pre-workout loaded with 300mg Caffeine, 3.2g CarnoSyn Beta-Alanine, and Nitrosigine for skin-splitting pumps and razor-sharp focus.',
      price: 5800.00,
      discount_price: 4950.00,
      stock_quantity: 18,
      main_image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop',
      is_available: true,
      is_featured: true,
    },
    {
      category_id: catPreWorkout.id,
      name: 'Animal Pump Non-Stim Nitric Oxide Booster',
      slug: 'animal-pump-non-stim-booster',
      description: 'Complete encapsulation pack of pure NO-precursors and cell volumizers without high stimulants, ideal for late evening lifting sessions.',
      price: 6400.00,
      discount_price: null,
      stock_quantity: 12,
      main_image: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?q=80&w=600&auto=format&fit=crop',
      is_available: true,
      is_featured: false,
    },
    {
      category_id: catVitamins.id,
      name: 'Triple Strength Omega-3 Fish Oil (120 Softgels)',
      slug: 'triple-strength-omega-3-fish-oil',
      description: 'Ultra-concentrated fish oil with 1400mg total Omega-3s (900mg active EPA/DHA) for joint lubrication, cardiovascular protection, and brain health.',
      price: 2800.00,
      discount_price: 2350.00,
      stock_quantity: 50,
      main_image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop',
      is_available: true,
      is_featured: false,
    },
    {
      category_id: catVitamins.id,
      name: 'Opti-Men Elite Daily Multivitamin (90 Tablets)',
      slug: 'opti-men-elite-daily-multivitamin',
      description: '75+ active ingredients in 4 performance blends designed specifically for the nutrient demands of hard-training athletes and lifters.',
      price: 3400.00,
      discount_price: null,
      stock_quantity: 28,
      main_image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=600&auto=format&fit=crop',
      is_available: true,
      is_featured: false,
    },
    {
      category_id: catGear.id,
      name: 'Orla Gym Heavy-Duty Steel Shaker Bottle (750ml)',
      slug: 'orla-gym-steel-shaker-bottle-750ml',
      description: 'Double-walled insulated stainless steel shaker with leakproof snap cap and internal blending whisk. Keeps protein shakes ice cold for up to 24 hours.',
      price: 1800.00,
      discount_price: 1450.00,
      stock_quantity: 60,
      main_image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop',
      is_available: true,
      is_featured: true,
    },
    {
      category_id: catGear.id,
      name: 'Pro Padded Lifting Wrist Straps (Pair)',
      slug: 'pro-padded-lifting-wrist-straps',
      description: 'Heavy-duty cotton webbing with neoprene wrist padding to eliminate grip fatigue on heavy deadlifts, shrugs, and barbell rows.',
      price: 1200.00,
      discount_price: 950.00,
      stock_quantity: 40,
      main_image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop',
      is_available: true,
      is_featured: false,
    },
    {
      category_id: catCafe.id,
      name: 'Signature High-Protein Almond Peanut Crunch (1kg)',
      slug: 'signature-protein-peanut-butter-1kg',
      description: 'Freshly milled in-house organic roasted peanuts and roasted almonds with zero added palm oil, sweetened with natural stevia and 32g protein per 100g.',
      price: 1600.00,
      discount_price: 1350.00,
      stock_quantity: 35,
      main_image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop',
      is_available: true,
      is_featured: true,
    },
  ];

  for (const item of productsData) {
    await prisma.product.create({
      data: item,
    });
  }
  console.log(`✅ ${productsData.length} Products seeded with rich fitness items`);

  // 7. Seed Sample Customer & Completed Order for Demo
  const demoCustomer = await prisma.customer.upsert({
    where: { phone_number: '+9779812345678' },
    update: {},
    create: {
      phone_number: '+9779812345678',
      name: 'Suman Thapa',
      email: 'suman@example.com',
      address: 'House 42, Shankhamul, Kathmandu',
    },
  });

  const product1 = await prisma.product.findFirst({ where: { slug: 'gold-standard-whey-isolate-5lbs' } });
  const product2 = await prisma.product.findFirst({ where: { slug: 'pure-micronized-creatine-monohydrate-300g' } });

  if (product1 && product2) {
    await prisma.order.create({
      data: {
        order_number: 'OG-20260927-1001',
        customer_id: demoCustomer.id,
        branch_id: branch1.id,
        customer_name: demoCustomer.name || 'Suman Thapa',
        customer_phone: demoCustomer.phone_number,
        delivery_address: demoCustomer.address,
        order_type: OrderType.DELIVERY,
        payment_method: PaymentMethod.CASH_ON_DELIVERY,
        payment_status: PaymentStatus.PENDING,
        order_status: OrderStatus.CONFIRMED,
        subtotal: 12649.00,
        delivery_charge: 150.00,
        total_amount: 12799.00,
        items: {
          create: [
            {
              product_id: product1.id,
              product_name: product1.name,
              product_price: 9999.00,
              quantity: 1,
              subtotal: 9999.00,
            },
            {
              product_id: product2.id,
              product_name: product2.name,
              product_price: 2650.00,
              quantity: 1,
              subtotal: 2650.00,
            },
          ],
        },
      },
    });
    console.log('✅ Demo Order seeded (Cash on Delivery)');
  }

  // 8. Seed Settings
  await prisma.setting.upsert({
    where: { key: 'delivery_charge' },
    update: {},
    create: {
      key: 'delivery_charge',
      value: '150.00',
      description: 'Standard delivery fee in NPR for cash on delivery orders',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'currency' },
    update: {},
    create: {
      key: 'currency',
      value: 'NPR',
      description: 'Default store currency display',
    },
  });

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
