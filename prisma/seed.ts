import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { products } from "../src/data/products";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the product catalogue.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const result = await prisma.product.createMany({
    data: products.map((product) => ({
      displayName: product.displayName,
      slug: product.slug,
      description: product.description,
      category: "copra",
      isActive: true,
      isSample: product.isSample,
      image: product.image,
      imageAlt: product.imageAlt,
      packagingInformation: product.packagingInformation,
      isDirectCheckoutEnabled: false,
      price: null,
      priceCurrency: null,
      priceUnit: null,
      supportedSalesUnits: [],
    })),
    skipDuplicates: true,
  });

  console.info(`Seeded ${result.count} new sample product(s); existing slugs were preserved.`);
}

main()
  .catch(() => {
    console.error("Product catalogue seed failed. Review database access and migration status.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
