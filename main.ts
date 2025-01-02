import Papa from "papaparse";

// Define interfaces for our data structures
interface Transaction {
  date: string;
  name: string;
  amount: number;
  status: string;
  category: string;
  "parent category": string;
  excluded: boolean;
  tags: string;
  type: string;
  account: string;
  "account mask": string;
  note: string;
  recurring: string;
}

interface CategoryDetail {
  [category: string]: number;
}

interface ParentCategoryDetail {
  total: number;
  categories: CategoryDetail;
}

interface CategoryTotals {
  [parentCategory: string]: ParentCategoryDetail;
}

interface ProcessExpensesOptions {
  csvFilePath: string;
  startDate: string;
  endDate: string;
}

async function processExpenses({
  csvFilePath,
  startDate,
  endDate,
}: ProcessExpensesOptions): Promise<CategoryTotals> {
  // Read the CSV file using Bun's file API
  const fileContent: string = await Bun.file(csvFilePath).text();

  // Parse the CSV
  const results = Papa.parse<Transaction>(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  // Convert dates to timestamps for easier comparison
  const startTimestamp: number = new Date(startDate).getTime();
  const endTimestamp: number = new Date(endDate).getTime();

  // Initialize the categories object
  const categoryTotals: CategoryTotals = {};

  // Process each transaction
  results.data.forEach((row: Transaction) => {
    // Skip if excluded is true
    if (row.excluded === true) return;

    // Convert transaction date to timestamp
    const transactionDate: number = new Date(row.date).getTime();

    // Skip if outside date range
    if (transactionDate < startTimestamp || transactionDate > endTimestamp)
      return;

    const amount = Math.abs(row.amount || 0);

    // Handle case where there's no parent category
    if (!row["parent category"] && row.category) {
      const category = row.category;
      if (!categoryTotals[category]) {
        categoryTotals[category] = {
          total: 0,
          categories: {},
        };
      }
      categoryTotals[category].total += amount;
      return;
    }

    // Handle case with parent category
    if (row["parent category"] && row.category) {
      const parentCategory = row["parent category"];
      const childCategory = row.category;

      // Initialize parent category if it doesn't exist
      if (!categoryTotals[parentCategory]) {
        categoryTotals[parentCategory] = {
          total: 0,
          categories: {},
        };
      }

      // Initialize child category if it doesn't exist
      if (!categoryTotals[parentCategory].categories[childCategory]) {
        categoryTotals[parentCategory].categories[childCategory] = 0;
      }

      // Update both total and child category amount
      categoryTotals[parentCategory].total += amount;
      categoryTotals[parentCategory].categories[childCategory] += amount;
    }
  });

  // Round all totals to 2 decimal places
  Object.keys(categoryTotals).forEach((parentCategory: string) => {
    categoryTotals[parentCategory].total = Number(
      categoryTotals[parentCategory].total.toFixed(2)
    );

    Object.keys(categoryTotals[parentCategory].categories).forEach(
      (childCategory: string) => {
        categoryTotals[parentCategory].categories[childCategory] = Number(
          categoryTotals[parentCategory].categories[childCategory].toFixed(2)
        );
      }
    );
  });

  return categoryTotals;
}

// for expenses that we don't track in the Copilot Money app, we can manuallya dd them to the expenses.json object here at the end
// for example: mortgage, property tax, etc.
const applyManualOverrides = (
  expensesObj: CategoryTotals,
  overrideObj: CategoryTotals
) => {
  // guard to make sure we're not overwriting categories that already exist
  const parentCategories = new Set(Object.keys(expensesObj));

  // for each key in overrideObj, check if included in parentCategories and throw if so
  Object.keys(overrideObj).forEach((overrideKey) => {
    if (parentCategories.has(overrideKey)) {
      throw new Error("collision on keys");
    }
  });

  return { ...expensesObj, ...overrideObj };
};

///////////////////////////////

// Example usage:

const manualOverrides: CategoryTotals = {
  Mortgage: { total: 123, categories: {} },
  "Property Taxes": { total: 456, categories: {} },
};

const options: ProcessExpensesOptions = {
  csvFilePath: "./transactions.csv",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
};

try {
  const categories = await processExpenses(options);
  const categoriesWithOverrides = applyManualOverrides(
    categories,
    manualOverrides
  );
  await Bun.write(
    "expenses.json",
    JSON.stringify(categoriesWithOverrides, null, 2)
  );
  console.log(JSON.stringify(categoriesWithOverrides, null, 2));
} catch (error) {
  if (error instanceof Error) {
    console.error("Error processing expenses:", error.message);
  } else {
    console.error("An unknown error occurred");
  }
}

///////////////////////////////

export { processExpenses };
export type {
  Transaction,
  CategoryTotals,
  ParentCategoryDetail,
  CategoryDetail,
  ProcessExpensesOptions,
};
