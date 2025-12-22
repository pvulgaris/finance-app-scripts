/**
 * Tax bracket data for federal and state income tax calculations
 * Each bracket contains [income_threshold, tax_rate]
 * Income thresholds represent the upper limit of each bracket
 *
 * Data Sources:
 * - Federal: IRS Publication 15 and Revenue Procedures
 * - NY: NY State Department of Taxation and Finance
 * - CA: California Franchise Tax Board (FTB)
 * - NC: North Carolina Department of Revenue (NCDOR)
 *
 * IMPORTANT NOTES:
 * - All rates are for "Married Filing Jointly" status (NC flat tax applies to all filing statuses)
 * - Rates marked as "ESTIMATED" are projections based on historical inflation adjustments
 * - 2026 federal rates may change if Tax Cuts and Jobs Act provisions expire
 * - CA calculations include 1% Mental Health Services Tax on income over $1M (Prop 63, 2004)
 * - NC uses a flat tax rate that has been declining annually (4.75% in 2023 to 3.99% in 2026)
 * - NIIT (Net Investment Income Tax) is 3.8% on investment income when MAGI > $250K (ACA, 2013)
 * - Child Tax Credit: $2,000-$2,200 per child, phases out above $400K MAGI (OBBBA, 2025)
 * - These calculations do not include standard deductions, personal exemptions, or other credits
 *
 * Last Updated: January 2025
 */

/**
 * Configuration constants for tax calculations
 */
const TAX_CONFIG = {
  MAX_INCOME: 100000000, // $100 million - effectively unlimited income
  SUPPORTED_YEARS: [2023, 2024, 2025, 2026],
  // California Mental Health Services Tax (Proposition 63, 2004)
  CA_MENTAL_HEALTH_TAX: {
    RATE: 0.01,           // 1% tax rate
    THRESHOLD: 1000000    // $1 million threshold
  },
  // Net Investment Income Tax (Affordable Care Act, 2013)
  // 3.8% surtax on investment income for high earners
  NIIT: {
    RATE: 0.038,          // 3.8% tax rate
    THRESHOLD: 250000     // $250,000 threshold (unchanged since 2013)
  },
  // Child Tax Credit phase-out parameters (married filing jointly)
  // Phase-out threshold permanent at $400,000 per OBBBA (July 2025)
  CHILD_TAX_CREDIT: {
    PHASE_OUT_THRESHOLD: 400000,  // $400,000 for married filing jointly
    PHASE_OUT_RATE: 50,            // $50 reduction per $1,000 over threshold
    PHASE_OUT_INCREMENT: 1000      // Phase-out calculated per $1,000 increment
  }
};

// NY State tax brackets (unchanged 2023-2026 per NY State 2025 Budget)
// Source: NY State Tax Law Section 601
const NY_BRACKETS = [
  [17150, 0.04],
  [23600, 0.045],
  [27900, 0.0525],
  [161550, 0.055],
  [323200, 0.06],
  [2155350, 0.0685],
  [5000000, 0.0965],
  [25000000, 0.103],
  [TAX_CONFIG.MAX_INCOME, 0.109],
];

const TAX_BRACKETS = {
  federal: {
    // Source: IRS Revenue Procedure 2022-38 (2023), 2023-34 (2024), 2024-40 (2025), 2025-32 (2026)
    2023: [
      [22000, 0.10],
      [89450, 0.12],
      [190750, 0.22],
      [364200, 0.24],
      [462500, 0.32],
      [693750, 0.35],
      [TAX_CONFIG.MAX_INCOME, 0.37],
    ],
    2024: [
      [23200, 0.10],
      [94300, 0.12],
      [201050, 0.22],
      [383900, 0.24],
      [487450, 0.32],
      [731200, 0.35],
      [TAX_CONFIG.MAX_INCOME, 0.37],
    ],
    2025: [
      [23850, 0.10],
      [96950, 0.12],
      [206700, 0.22],
      [394600, 0.24],
      [501050, 0.32],
      [751600, 0.35],
      [TAX_CONFIG.MAX_INCOME, 0.37],
    ],
    2026: [
      [24800, 0.10],
      [100800, 0.12],
      [211400, 0.22],
      [403550, 0.24],
      [512450, 0.32],
      [768700, 0.35],
      [TAX_CONFIG.MAX_INCOME, 0.37],
    ],
  },
  ny: {
    2023: NY_BRACKETS,
    2024: NY_BRACKETS,
    2025: NY_BRACKETS,
    2026: NY_BRACKETS,
  },
  ca: {
    // Source: California FTB (2024 actual, others estimated with ~3% inflation)
    2023: [
      [20924, 0.01],
      [49564, 0.02],
      [78252, 0.04],
      [108616, 0.06],
      [137284, 0.08],
      [701308, 0.093],
      [841572, 0.103],
      [1402620, 0.113],
      [TAX_CONFIG.MAX_INCOME, 0.123],
    ],
    2024: [
      [21512, 0.01],
      [50998, 0.02],
      [80490, 0.04],
      [111732, 0.06],
      [141212, 0.08],
      [721318, 0.093],
      [865574, 0.103],
      [1442628, 0.113],
      [TAX_CONFIG.MAX_INCOME, 0.123],
    ],
    2025: [
      [22222, 0.01],
      [52682, 0.02],
      [83146, 0.04],
      [115418, 0.06],
      [145912, 0.08],
      [745121, 0.093],
      [894338, 0.103],
      [1490235, 0.113],
      [TAX_CONFIG.MAX_INCOME, 0.123],
    ],
    2026: [
      [22956, 0.01],
      [54421, 0.02],
      [85890, 0.04],
      [119307, 0.06],
      [150657, 0.08],
      [769900, 0.093],
      [924503, 0.103],
      [1539143, 0.113],
      [TAX_CONFIG.MAX_INCOME, 0.123],
    ],
  },
  nc: {
    // Source: NCDOR (flat tax, declining annually per Session Law 2023-134)
    2023: [[TAX_CONFIG.MAX_INCOME, 0.0475]],
    2024: [[TAX_CONFIG.MAX_INCOME, 0.045]],
    2025: [[TAX_CONFIG.MAX_INCOME, 0.0425]],
    2026: [[TAX_CONFIG.MAX_INCOME, 0.0399]],
  },
};

// Child Tax Credit amounts { creditPerChild, refundableAmount }
// Source: IRS Pub 972, OBBBA 2025 (permanent $2.2K starting 2026)
const CHILD_TAX_CREDIT_AMOUNTS = {
  2023: { creditPerChild: 2000, refundableAmount: 1600 },
  2024: { creditPerChild: 2000, refundableAmount: 1700 },
  2025: { creditPerChild: 2200, refundableAmount: 1700 },
  2026: { creditPerChild: 2200, refundableAmount: 1700 }
};

// Qualified dividends & long-term capital gains brackets (0%, 15%, 20% based on total income)
// Source: IRS Revenue Procedures 2022-38 (2023), 2023-34 (2024), 2024-40 (2025), 2025-32 (2026)
const QUALIFIED_DIVIDEND_BRACKETS = {
  2023: [[89250, 0.00], [553850, 0.15], [TAX_CONFIG.MAX_INCOME, 0.20]],
  2024: [[94050, 0.00], [583750, 0.15], [TAX_CONFIG.MAX_INCOME, 0.20]],
  2025: [[96700, 0.00], [600050, 0.15], [TAX_CONFIG.MAX_INCOME, 0.20]],
  2026: [[98900, 0.00], [613700, 0.15], [TAX_CONFIG.MAX_INCOME, 0.20]],
};

/**
 * Rounds a number to cents (2 decimal places) to avoid floating point errors
 * @param {number} value - Value to round
 * @returns {number} Value rounded to nearest cent
 * @private
 */
function _roundToCents(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Validates that a value is a non-negative number (private method)
 * @param {number} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @throws {Error} If value is not a non-negative number
 * @private
 */
function _validateNonNegativeNumber(value, fieldName) {
  if (typeof value !== 'number' || value < 0) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }
}

/**
 * Validates tax year with optional minimum year constraint (private method)
 * @param {number} year - Tax year to validate
 * @param {number} minYear - Optional minimum year (if not provided, uses SUPPORTED_YEARS)
 * @throws {Error} If year is invalid
 * @private
 */
function _validateYear(year, minYear = null) {
  if (minYear === null) {
    if (!TAX_CONFIG.SUPPORTED_YEARS.includes(year)) {
      throw new Error(`Year must be one of: ${TAX_CONFIG.SUPPORTED_YEARS.join(', ')}`);
    }
    return;
  }

  if (typeof year !== 'number' || year < minYear) {
    throw new Error(`Year must be ${minYear} or later`);
  }
}

/**
 * Validates input parameters for tax calculations (private method)
 * @param {number} income - Annual income amount
 * @param {number} year - Tax year
 * @param {string} jurisdiction - Tax jurisdiction
 * @throws {Error} If parameters are invalid
 * @private
 */
function _validateTaxInputs(income, year, jurisdiction = 'federal') {
  _validateNonNegativeNumber(income, 'Income');
  _validateYear(year);

  if (!(jurisdiction in TAX_BRACKETS)) {
    throw new Error(`Jurisdiction must be one of: ${Object.keys(TAX_BRACKETS).join(', ')}`);
  }
}

/**
 * Calculates progressive income tax based on tax brackets (private method)
 * @param {Array<Array<number>>} taxBrackets - Array of [income_threshold, tax_rate] pairs
 * @param {number} income - Annual income amount
 * @returns {number} Total tax owed
 * @private
 */
function _calculateProgressiveTax(taxBrackets, income) {
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
 * Generic tax calculation helper (private method)
 * @param {number} income - Annual gross income
 * @param {number} year - Tax year (2023-2026)
 * @param {string} jurisdiction - Tax jurisdiction ('federal', 'ny', 'ca')
 * @returns {number} Tax owed
 * @throws {Error} If parameters are invalid or brackets unavailable
 * @private
 */
function _calculateIncomeTax(income, year, jurisdiction) {
  _validateTaxInputs(income, year, jurisdiction);

  const brackets = TAX_BRACKETS[jurisdiction] && TAX_BRACKETS[jurisdiction][year];
  if (!brackets) {
    throw new Error(`Tax brackets for '${jurisdiction}' not available for year ${year}`);
  }

  // Flat tax optimization: single bracket means simple multiplication
  if (brackets.length === 1) {
    return income * brackets[0][1];
  }

  return _calculateProgressiveTax(brackets, income);
}

/**
 * Calculates California Mental Health Services Tax (private method)
 * @param {number} income - Annual gross income
 * @returns {number} Mental Health Services Tax owed (1% on income over $1M)
 * @private
 */
function _calculateCAMentalHealthTax(income) {
  const { RATE, THRESHOLD } = TAX_CONFIG.CA_MENTAL_HEALTH_TAX;
  if (income <= THRESHOLD) {
    return 0;
  }
  return (income - THRESHOLD) * RATE;
}

/**
 * Calculates federal income tax for married filing jointly
 * @param {number} income - Annual gross income
 * @param {number} year - Tax year (2023-2026)
 * @returns {number} Federal income tax owed
 */
function getFederalIncomeTax(income, year) {
  return _roundToCents(_calculateIncomeTax(income, year, 'federal'));
}

/**
 * Calculates New York State income tax for married filing jointly
 * @param {number} income - Annual gross income
 * @param {number} year - Tax year (2023-2026)
 * @returns {number} NY State income tax owed
 */
function getNYIncomeTax(income, year) {
  return _roundToCents(_calculateIncomeTax(income, year, 'ny'));
}

/**
 * Calculates California State income tax for married filing jointly
 * Includes base income tax plus 1% Mental Health Services Tax on income over $1M
 * @param {number} income - Annual gross income
 * @param {number} year - Tax year (2023-2026)
 * @returns {number} Total California State income tax owed (including Mental Health Services Tax)
 */
function getCAIncomeTax(income, year) {
  return _roundToCents(_calculateIncomeTax(income, year, 'ca') + _calculateCAMentalHealthTax(income));
}

/**
 * Calculates North Carolina State income tax
 * NC uses a flat tax rate that applies to all income regardless of filing status
 * @param {number} income - Annual gross income
 * @param {number} year - Tax year (2023-2026)
 * @returns {number} NC State income tax owed
 */
function getNCIncomeTax(income, year) {
  return _roundToCents(_calculateIncomeTax(income, year, 'nc'));
}

/**
 * Helper function to calculate preferential tax rate (0%, 15%, 20%)
 * Used for both qualified dividends and long-term capital gains
 *
 * This function correctly handles bracket-spanning: when preferential income
 * pushes total income across bracket boundaries, different portions are taxed
 * at different rates. Ordinary income fills lower brackets first, then
 * preferential income is stacked on top and taxed progressively.
 *
 * @param {number} amount - Amount subject to preferential tax rate
 * @param {number} totalTaxableIncome - Total taxable income (including preferential amount)
 * @param {number} year - Tax year (2023-2026)
 * @param {string} assetType - Description of asset type for error messages
 * @returns {number} Tax owed on the amount
 * @throws {Error} If parameters are invalid
 * @private
 */
function _calculatePreferentialTax(amount, totalTaxableIncome, year, assetType) {
  // Validate inputs
  _validateNonNegativeNumber(amount, assetType);
  _validateNonNegativeNumber(totalTaxableIncome, 'Total taxable income');
  _validateYear(year);

  const brackets = QUALIFIED_DIVIDEND_BRACKETS[year];
  if (!brackets) {
    throw new Error(`Tax brackets not available for year ${year}`);
  }

  // Ordinary income fills brackets first; preferential income stacks on top
  const ordinaryIncome = totalTaxableIncome - amount;
  let totalTax = 0;
  let remainingAmount = amount;
  let previousThreshold = 0;

  for (const [threshold, rate] of brackets) {
    // Calculate space in this bracket after ordinary income
    const bracketStart = Math.max(ordinaryIncome, previousThreshold);
    const bracketSpace = Math.max(0, threshold - bracketStart);

    // Calculate how much preferential income fits in this bracket
    const amountInBracket = Math.min(remainingAmount, bracketSpace);

    if (amountInBracket > 0) {
      totalTax += amountInBracket * rate;
      remainingAmount -= amountInBracket;
    }

    if (remainingAmount <= 0) break;
    previousThreshold = threshold;
  }

  return totalTax;
}

/**
 * Calculates federal qualified dividend tax for married filing jointly
 * Qualified dividends are taxed at preferential capital gains rates (0%, 15%, or 20%)
 * based on total taxable income rather than the dividend amount
 *
 * @param {number} qualifiedDividends - Total qualified dividend income
 * @param {number} totalTaxableIncome - Total taxable income (including dividends)
 * @param {number} year - Tax year (2023-2026)
 * @returns {number} Federal tax owed on qualified dividends
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Example: $50,000 in qualified dividends, $200,000 total income in 2024
 * // Total income of $200,000 falls in the 15% bracket
 * const tax = getQualifiedDividendTax(50000, 200000, 2024); // Returns $7,500
 */
function getQualifiedDividendTax(qualifiedDividends, totalTaxableIncome, year) {
  return _roundToCents(_calculatePreferentialTax(qualifiedDividends, totalTaxableIncome, year, 'Qualified dividends'));
}

/**
 * Calculates federal long-term capital gains tax for married filing jointly
 * Long-term capital gains (assets held > 1 year) are taxed at preferential rates
 * (0%, 15%, or 20%) based on total taxable income, same as qualified dividends
 *
 * @param {number} longTermCapitalGains - Total long-term capital gains
 * @param {number} totalTaxableIncome - Total taxable income (including gains)
 * @param {number} year - Tax year (2023-2026)
 * @returns {number} Federal tax owed on long-term capital gains
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Example: $100,000 in long-term capital gains, $200,000 total income in 2024
 * // Total income of $200,000 falls in the 15% bracket
 * const tax = getLongTermCapitalGainsTax(100000, 200000, 2024); // Returns $15,000
 */
function getLongTermCapitalGainsTax(longTermCapitalGains, totalTaxableIncome, year) {
  return _roundToCents(_calculatePreferentialTax(longTermCapitalGains, totalTaxableIncome, year, 'Long-term capital gains'));
}

/**
 * Calculates Net Investment Income Tax (NIIT) for married filing jointly
 * NIIT is a 3.8% surtax on investment income for high earners, introduced by the
 * Affordable Care Act in 2013. It applies when modified AGI exceeds $250,000.
 *
 * The tax is calculated as 3.8% of the LESSER of:
 * 1. Net investment income (dividends, capital gains, interest, passive rental income, etc.)
 * 2. The amount by which modified AGI exceeds the threshold ($250,000)
 *
 * Note: NIIT rate and threshold have remained unchanged since 2013.
 *
 * @param {number} netInvestmentIncome - Total net investment income (dividends, capital gains, interest, etc.)
 * @param {number} modifiedAGI - Modified Adjusted Gross Income (typically same as AGI)
 * @param {number} year - Tax year (2013 or later)
 * @returns {number} Net Investment Income Tax owed
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Example 1: $100,000 investment income, $300,000 MAGI
 * // MAGI exceeds threshold by $50,000, which is less than investment income
 * const tax1 = getNetInvestmentIncomeTax(100000, 300000, 2024); // Returns $1,900 (3.8% of $50,000)
 *
 * @example
 * // Example 2: $30,000 investment income, $400,000 MAGI
 * // MAGI exceeds threshold by $150,000, but investment income is only $30,000
 * const tax2 = getNetInvestmentIncomeTax(30000, 400000, 2024); // Returns $1,140 (3.8% of $30,000)
 *
 * @example
 * // Example 3: $50,000 investment income, $200,000 MAGI
 * // MAGI does not exceed threshold, so no NIIT
 * const tax3 = getNetInvestmentIncomeTax(50000, 200000, 2024); // Returns $0
 */
function getNetInvestmentIncomeTax(netInvestmentIncome, modifiedAGI, year) {
  // Validate inputs
  _validateNonNegativeNumber(netInvestmentIncome, 'Net investment income');
  _validateNonNegativeNumber(modifiedAGI, 'Modified AGI');
  _validateYear(year, 2013); // NIIT introduced in 2013

  const { RATE, THRESHOLD } = TAX_CONFIG.NIIT;

  // Calculate amount by which MAGI exceeds threshold
  const excessIncome = Math.max(0, modifiedAGI - THRESHOLD);

  // NIIT applies to the lesser of net investment income or excess income
  const taxableAmount = Math.min(netInvestmentIncome, excessIncome);

  // Apply 3.8% rate
  return _roundToCents(taxableAmount * RATE);
}

/**
 * Calculates Child Tax Credit for married filing jointly
 * The CTC provides tax relief for families with qualifying children under age 17.
 *
 * Credit amounts and refundability:
 * - 2023: $2,000 per child (up to $1,600 refundable)
 * - 2024: $2,000 per child (up to $1,700 refundable)
 * - 2025-2026: $2,200 per child (up to $1,700 refundable)
 *
 * The credit phases out at $50 per $1,000 (or fraction thereof) of modified AGI
 * exceeding $400,000 for married filing jointly.
 *
 * Note: The One Big Beautiful Bill Act (OBBBA, July 2025) made the enhanced CTC
 * permanent and indexed for inflation starting 2026. Phase-out threshold remains
 * permanently at $400,000 for married filing jointly.
 *
 * @param {number} numberOfChildren - Number of qualifying children under age 17
 * @param {number} modifiedAGI - Modified Adjusted Gross Income
 * @param {number} year - Tax year (2023-2026)
 * @returns {number} Child Tax Credit amount (before considering tax liability)
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Example 1: 2 children, $300,000 MAGI in 2024 (below phase-out threshold)
 * const credit1 = getChildTaxCredit(2, 300000, 2024); // Returns $4,000
 *
 * @example
 * // Example 2: 3 children, $450,000 MAGI in 2025 (above phase-out threshold)
 * // Excess: $50,000 / $1,000 = 50 increments × $50 = $2,500 reduction
 * const credit2 = getChildTaxCredit(3, 450000, 2025); // Returns $4,100 ($6,600 - $2,500)
 *
 * @example
 * // Example 3: 1 child, $600,000 MAGI in 2026 (high income)
 * // Excess: $200,000 / $1,000 = 200 increments × $50 = $10,000 reduction
 * // Credit fully phased out (reduction exceeds credit amount)
 * const credit3 = getChildTaxCredit(1, 600000, 2026); // Returns $0
 */
function getChildTaxCredit(numberOfChildren, modifiedAGI, year) {
  // Validate inputs
  if (typeof numberOfChildren !== 'number' || numberOfChildren < 0 || !Number.isInteger(numberOfChildren)) {
    throw new Error('Number of children must be a non-negative integer');
  }

  _validateNonNegativeNumber(modifiedAGI, 'Modified AGI');
  _validateYear(year);

  // If no children, return 0
  if (numberOfChildren === 0) {
    return 0;
  }

  // Get credit amounts for the year
  const creditData = CHILD_TAX_CREDIT_AMOUNTS[year];
  if (!creditData) {
    throw new Error(`Child Tax Credit amounts not available for year ${year}`);
  }

  // Calculate base credit
  const baseCredit = creditData.creditPerChild * numberOfChildren;

  // Get phase-out parameters
  const { PHASE_OUT_THRESHOLD, PHASE_OUT_RATE, PHASE_OUT_INCREMENT } = TAX_CONFIG.CHILD_TAX_CREDIT;

  // Calculate phase-out reduction
  if (modifiedAGI <= PHASE_OUT_THRESHOLD) {
    // Below threshold, no phase-out
    return baseCredit;
  }

  // Calculate excess income over threshold
  const excessIncome = modifiedAGI - PHASE_OUT_THRESHOLD;

  // Calculate number of $1,000 increments (round up for any fraction)
  const increments = Math.ceil(excessIncome / PHASE_OUT_INCREMENT);

  // Calculate total reduction
  const reduction = increments * PHASE_OUT_RATE;

  // Apply reduction, but credit cannot go below zero
  const finalCredit = Math.max(0, baseCredit - reduction);

  return finalCredit;
}