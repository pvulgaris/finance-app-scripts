/**
 * Tax bracket data for federal and state income tax calculations
 * Each bracket contains [income_threshold, tax_rate]
 * Income thresholds represent the upper limit of each bracket
 */
const TAX_BRACKETS = {
  federal: {
    // Federal tax brackets for married filing jointly
    2023: [
      [22000, 0.10],    // 10% on income up to $22,000
      [89450, 0.12],    // 12% on income from $22,001 to $89,450
      [190750, 0.22],   // 22% on income from $89,451 to $190,750
      [364200, 0.24],   // 24% on income from $190,751 to $364,200
      [462500, 0.32],   // 32% on income from $364,201 to $462,500
      [693750, 0.35],   // 35% on income from $462,501 to $693,750
      [10000000, 0.37], // 37% on income over $693,750
    ],
    2024: [
      [23200, 0.10],
      [94300, 0.12],
      [201050, 0.22],
      [383900, 0.24],
      [487450, 0.32],
      [731200, 0.35],
      [10000000, 0.37],
    ],
    2025: [
      [23850, 0.10],
      [96950, 0.12],
      [206700, 0.22],
      [394600, 0.24],
      [501050, 0.32],
      [751600, 0.35],
      [10000000, 0.37],
    ],
    // Source: https://taxfoundation.org/blog/2026-tax-brackets-tax-cuts-and-jobs-act-expires/
    2026: [
      [24500, 0.10],
      [99550, 0.12],
      [212200, 0.22],
      [405050, 0.24],
      [514400, 0.32],
      [771550, 0.35],
      [10000000, 0.37],
    ],
  },
  ny: {
    // New York State tax brackets for married filing jointly
    // Source: https://smartasset.com/taxes/new-york-tax-calculator
    2025: [
      [17150, 0.04],      // 4% on income up to $17,150
      [23600, 0.045],     // 4.5% on income from $17,151 to $23,600
      [27900, 0.0525],    // 5.25% on income from $23,601 to $27,900
      [161550, 0.055],    // 5.5% on income from $27,901 to $161,550
      [323200, 0.06],     // 6% on income from $161,551 to $323,200
      [2155350, 0.0685],  // 6.85% on income from $323,201 to $2,155,350
      [5000000, 0.0965],  // 9.65% on income from $2,155,351 to $5,000,000
      [25000000, 0.103],  // 10.3% on income from $5,000,001 to $25,000,000
      [10000000, 0.109],  // 10.9% on income over $25,000,000
    ],
    // TODO: Update these brackets when 2026 data becomes available
    2026: [
      [17150, 0.04],
      [23600, 0.045],
      [27900, 0.0525],
      [161550, 0.055],
      [323200, 0.06],
      [2155350, 0.0685],
      [5000000, 0.0965],
      [25000000, 0.103],
      [10000000, 0.109],
    ],
  },
};

/**
 * Validates input parameters for tax calculations
 * @param {number} income - Annual income amount
 * @param {number} year - Tax year (2023-2026)
 * @throws {Error} If parameters are invalid
 */
function validateTaxInputs(income, year) {
  if (typeof income !== 'number' || income < 0) {
    throw new Error('Income must be a non-negative number');
  }

  if (typeof year !== 'number' || year < 2023 || year > 2026) {
    throw new Error('Year must be between 2023 and 2026');
  }
}

/**
 * Calculates progressive income tax based on tax brackets
 * @param {Array<Array<number>>} taxBrackets - Array of [income_threshold, tax_rate] pairs
 * @param {number} income - Annual income amount
 * @returns {number} Total tax owed
 */
function calculateProgressiveTax(taxBrackets, income) {
  let totalTax = 0;
  let previousBracketThreshold = 0;

  for (const [bracketThreshold, taxRate] of taxBrackets) {
    // Calculate taxable income in this bracket
    const taxableIncomeInBracket = Math.max(0, Math.min(income, bracketThreshold) - previousBracketThreshold);

    // Calculate tax for this bracket
    const taxForBracket = taxableIncomeInBracket * taxRate;
    totalTax += taxForBracket;

    // Update for next iteration
    previousBracketThreshold = bracketThreshold;

    // If income doesn't reach this bracket, we're done
    if (income <= bracketThreshold) {
      break;
    }
  }

  return totalTax;
}

/**
 * Calculates federal income tax for married filing jointly
 * @param {number} income - Annual gross income
 * @param {number} year - Tax year (2023, 2024, 2025, or 2026)
 * @returns {number} Federal income tax owed
 * @throws {Error} If income or year parameters are invalid
 */
function getFederalIncomeTax(income, year) {
  validateTaxInputs(income, year);

  const federalBrackets = TAX_BRACKETS.federal[year];
  if (!federalBrackets) {
    throw new Error(`Federal tax brackets not available for year ${year}`);
  }

  return calculateProgressiveTax(federalBrackets, income);
}

/**
 * Calculates New York State income tax for married filing jointly
 * @param {number} income - Annual gross income
 * @param {number} year - Tax year (2025 or 2026)
 * @returns {number} NY State income tax owed
 * @throws {Error} If income or year parameters are invalid
 */
function getNYIncomeTax(income, year) {
  validateTaxInputs(income, year);

  const nyBrackets = TAX_BRACKETS.ny[year];
  if (!nyBrackets) {
    throw new Error(`NY tax brackets not available for year ${year}`);
  }

  return calculateProgressiveTax(nyBrackets, income);
}