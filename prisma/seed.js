const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default habits...');

  const gym = await prisma.habit.upsert({
    where: { key: 'gym' },
    update: {
      name: 'Went to Gym',
      question: 'Did you go to the gym today?',
      emoji: '🏋️',
      colorHex: '#22c55e',
      sortOrder: 0,
      isActive: true,
    },
    create: {
      key: 'gym',
      name: 'Went to Gym',
      question: 'Did you go to the gym today?',
      emoji: '🏋️',
      colorHex: '#22c55e',
      sortOrder: 0,
      isActive: true,
    },
  });

  const noMaida = await prisma.habit.upsert({
    where: { key: 'no_maida' },
    update: {
      name: 'No Maida',
      question: 'Did you avoid eating Maida today?',
      emoji: '🚫',
      colorHex: '#3b82f6',
      sortOrder: 1,
      isActive: true,
    },
    create: {
      key: 'no_maida',
      name: 'No Maida',
      question: 'Did you avoid eating Maida today?',
      emoji: '🚫',
      colorHex: '#3b82f6',
      sortOrder: 1,
      isActive: true,
    },
  });

  console.log('Seeded habits:', { gym, noMaida });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
