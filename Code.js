/**
 * Tax bracket data for federal and state income tax calculations
 * Each bracket contains [income_threshold, tax_rate]
 * Income thresholds represent the upper limit of each bracket
 *
 * Data Sources:
 * - Federal: IRS Publication 15 and Revenue Procedures
 * - NY: NY State Department of Taxation and Finance
 * - CA: California Franchise Tax Board (FTB)
 *
 * IMPORTANT NOTES:
 * - All rates are for "Married Filing Jointly" status
 * - Rates marked as "ESTIMATED" are projections based on historical inflation adjustments
 * - 2026 federal rates may change if Tax Cuts and Jobs Act provisions expire
 * - CA calculations include 1% Mental Health Services Tax on income over $1M (Prop 63, 2004)
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
  JURISDICTIONS: {
    federal: 'Federal',
    ny: 'NY',
    ca: 'CA'
  },
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
const TAX_BRACKETS = {
  federal: {
    // Federal tax brackets for married filing jointly
    // Source: IRS Revenue Procedure 2022-38 (2023), 2023-34 (2024), 2024-40 (2025)
    2023: [
      [22000, 0.10],    // 10% on income up to $22,000
      [89450, 0.12],    // 12% on income from $22,001 to $89,450
      [190750, 0.22],   // 22% on income from $89,451 to $190,750
      [364200, 0.24],   // 24% on income from $190,751 to $364,200
      [462500, 0.32],   // 32% on income from $364,201 to $462,500
      [693750, 0.35],   // 35% on income from $462,501 to $693,750
      [TAX_CONFIG.MAX_INCOME, 0.37], // 37% on income over $693,750
    ],
    // Source: IRS Revenue Procedure 2023-34
    2024: [
      [23200, 0.10],    // 10% on income up to $23,200
      [94300, 0.12],    // 12% on income from $23,201 to $94,300
      [201050, 0.22],   // 22% on income from $94,301 to $201,050
      [383900, 0.24],   // 24% on income from $201,051 to $383,900
      [487450, 0.32],   // 32% on income from $383,901 to $487,450
      [731200, 0.35],   // 35% on income from $487,451 to $731,200
      [TAX_CONFIG.MAX_INCOME, 0.37], // 37% on income over $731,200
    ],
    // Source: IRS Revenue Procedure 2024-40
    2025: [
      [23850, 0.10],    // 10% on income up to $23,850
      [96950, 0.12],    // 12% on income from $23,851 to $96,950
      [206700, 0.22],   // 22% on income from $96,951 to $206,700
      [394600, 0.24],   // 24% on income from $206,701 to $394,600
      [501050, 0.32],   // 32% on income from $394,601 to $501,050
      [751600, 0.35],   // 35% on income from $501,051 to $751,600
      [TAX_CONFIG.MAX_INCOME, 0.37], // 37% on income over $751,600
    ],
    // Source: IRS Revenue Procedure 2025-32 (One Big Beautiful Bill Act adjustments)
    2026: [
      [24800, 0.10],    // 10% on income up to $24,800
      [100800, 0.12],   // 12% on income from $24,801 to $100,800
      [211400, 0.22],   // 22% on income from $100,801 to $211,400
      [403550, 0.24],   // 24% on income from $211,401 to $403,550
      [512450, 0.32],   // 32% on income from $403,551 to $512,450
      [768700, 0.35],   // 35% on income from $512,451 to $768,700
      [TAX_CONFIG.MAX_INCOME, 0.37], // 37% on income over $768,700
    ],
  },
  ny: {
    // New York State tax brackets for married filing jointly
    // NY has not updated brackets for inflation in recent years

    // Source: NY State Tax Law Section 601
    2023: [
      [17150, 0.04],      // 4% on income up to $17,150
      [23600, 0.045],     // 4.5% on income from $17,151 to $23,600
      [27900, 0.0525],    // 5.25% on income from $23,601 to $27,900
      [161550, 0.055],    // 5.5% on income from $27,901 to $161,550
      [323200, 0.06],     // 6% on income from $161,551 to $323,200
      [2155350, 0.0685],  // 6.85% on income from $323,201 to $2,155,350
      [5000000, 0.0965],  // 9.65% on income from $2,155,351 to $5,000,000
      [25000000, 0.103],  // 10.3% on income from $5,000,001 to $25,000,000
      [TAX_CONFIG.MAX_INCOME, 0.109], // 10.9% on income over $25,000,000
    ],
    2024: [
      [17150, 0.04],      // 4% on income up to $17,150
      [23600, 0.045],     // 4.5% on income from $17,151 to $23,600
      [27900, 0.0525],    // 5.25% on income from $23,601 to $27,900
      [161550, 0.055],    // 5.5% on income from $27,901 to $161,550
      [323200, 0.06],     // 6% on income from $161,551 to $323,200
      [2155350, 0.0685],  // 6.85% on income from $323,201 to $2,155,350
      [5000000, 0.0965],  // 9.65% on income from $2,155,351 to $5,000,000
      [25000000, 0.103],  // 10.3% on income from $5,000,001 to $25,000,000
      [TAX_CONFIG.MAX_INCOME, 0.109], // 10.9% on income over $25,000,000
    ],
    // Source: NY State 2025 Budget (rates unchanged)
    2025: [
      [17150, 0.04],      // 4% on income up to $17,150
      [23600, 0.045],     // 4.5% on income from $17,151 to $23,600
      [27900, 0.0525],    // 5.25% on income from $23,601 to $27,900
      [161550, 0.055],    // 5.5% on income from $27,901 to $161,550
      [323200, 0.06],     // 6% on income from $161,551 to $323,200
      [2155350, 0.0685],  // 6.85% on income from $323,201 to $2,155,350
      [5000000, 0.0965],  // 9.65% on income from $2,155,351 to $5,000,000
      [25000000, 0.103],  // 10.3% on income from $5,000,001 to $25,000,000
      [TAX_CONFIG.MAX_INCOME, 0.109], // 10.9% on income over $25,000,000
    ],
    // Source: NY State 2025 Budget (rates unchanged through 2026; reductions start in 2027)
    2026: [
      [17150, 0.04],      // 4% on income up to $17,150
      [23600, 0.045],     // 4.5% on income from $17,151 to $23,600
      [27900, 0.0525],    // 5.25% on income from $23,601 to $27,900
      [161550, 0.055],    // 5.5% on income from $27,901 to $161,550
      [323200, 0.06],     // 6% on income from $161,551 to $323,200
      [2155350, 0.0685],  // 6.85% on income from $323,201 to $2,155,350
      [5000000, 0.0965],  // 9.65% on income from $2,155,351 to $5,000,000
      [25000000, 0.103],  // 10.3% on income from $5,000,001 to $25,000,000
      [TAX_CONFIG.MAX_INCOME, 0.109], // 10.9% on income over $25,000,000
    ],
  },
  ca: {
    // California State tax brackets for married filing jointly
    // Source: California Franchise Tax Board (FTB)

    // ESTIMATED - 2023 brackets based on 2024 with inflation adjustment
    2023: [
      [20924, 0.01],      // 1% on income up to $20,924 (estimated)
      [49564, 0.02],      // 2% on income from $20,925 to $49,564 (estimated)
      [78252, 0.04],      // 4% on income from $49,565 to $78,252 (estimated)
      [108616, 0.06],     // 6% on income from $78,253 to $108,616 (estimated)
      [137284, 0.08],     // 8% on income from $108,617 to $137,284 (estimated)
      [701308, 0.093],    // 9.3% on income from $137,285 to $701,308 (estimated)
      [841572, 0.103],    // 10.3% on income from $701,309 to $841,572 (estimated)
      [1402620, 0.113],   // 11.3% on income from $841,573 to $1,402,620 (estimated)
      [TAX_CONFIG.MAX_INCOME, 0.123],  // 12.3% on income over $1,402,620
    ],
    // Source: California FTB 2024 Tax Rate Schedules
    2024: [
      [21512, 0.01],      // 1% on income up to $21,512
      [50998, 0.02],      // 2% on income from $21,513 to $50,998
      [80490, 0.04],      // 4% on income from $50,999 to $80,490
      [111732, 0.06],     // 6% on income from $80,491 to $111,732
      [141212, 0.08],     // 8% on income from $111,733 to $141,212
      [721318, 0.093],    // 9.3% on income from $141,213 to $721,318
      [865574, 0.103],    // 10.3% on income from $721,319 to $865,574
      [1442628, 0.113],   // 11.3% on income from $865,575 to $1,442,628
      [TAX_CONFIG.MAX_INCOME, 0.123],  // 12.3% on income over $1,442,628
    ],
    // ESTIMATED - Based on CA inflation adjustment of 3.0% (CCPI)
    2025: [
      [22222, 0.01],      // 1% on income up to $22,222 (estimated)
      [52682, 0.02],      // 2% on income from $22,223 to $52,682 (estimated)
      [83146, 0.04],      // 4% on income from $52,683 to $83,146 (estimated)
      [115418, 0.06],     // 6% on income from $83,147 to $115,418 (estimated)
      [145912, 0.08],     // 8% on income from $115,419 to $145,912 (estimated)
      [745121, 0.093],    // 9.3% on income from $145,913 to $745,121 (estimated)
      [894338, 0.103],    // 10.3% on income from $745,122 to $894,338 (estimated)
      [1490235, 0.113],   // 11.3% on income from $894,339 to $1,490,235 (estimated)
      [TAX_CONFIG.MAX_INCOME, 0.123],  // 12.3% on income over $1,490,235
    ],
    // ESTIMATED - Based on continued inflation adjustment
    2026: [
      [22956, 0.01],      // 1% on income up to $22,956 (estimated)
      [54421, 0.02],      // 2% on income from $22,957 to $54,421 (estimated)
      [85890, 0.04],      // 4% on income from $54,422 to $85,890 (estimated)
      [119307, 0.06],     // 6% on income from $85,891 to $119,307 (estimated)
      [150657, 0.08],     // 8% on income from $119,308 to $150,657 (estimated)
      [769900, 0.093],    // 9.3% on income from $150,658 to $769,900 (estimated)
      [924503, 0.103],    // 10.3% on income from $769,901 to $924,503 (estimated)
      [1539143, 0.113],   // 11.3% on income from $924,504 to $1,539,143 (estimated)
      [TAX_CONFIG.MAX_INCOME, 0.123],  // 12.3% on income over $1,539,143
    ],
  },
};

/**
 * Child Tax Credit amounts by year (married filing jointly)
 * Source: IRS and One Big Beautiful Bill Act (OBBBA, July 2025)
 *
 * Structure: { creditPerChild, refundableAmount }
 * - creditPerChild: Maximum credit amount per qualifying child under age 17
 * - refundableAmount: Maximum refundable portion (Additional Child Tax Credit)
 *
 * Note: OBBBA made the $2,200 credit permanent and indexed for inflation starting 2026
 * Phase-out threshold remains permanently at $400,000 for married filing jointly
 */
const CHILD_TAX_CREDIT_AMOUNTS = {
  // Source: IRS Publication 972 for 2023
  2023: {
    creditPerChild: 2000,      // $2,000 per qualifying child
    refundableAmount: 1600     // Up to $1,600 refundable (ACTC)
  },
  // Source: IRS Publication 972 for 2024
  2024: {
    creditPerChild: 2000,      // $2,000 per qualifying child
    refundableAmount: 1700     // Up to $1,700 refundable (ACTC)
  },
  // Source: OBBBA (July 2025)
  2025: {
    creditPerChild: 2200,      // $2,200 per qualifying child
    refundableAmount: 1700     // Up to $1,700 refundable (ACTC)
  },
  // Source: OBBBA (made permanent and indexed for inflation)
  2026: {
    creditPerChild: 2200,      // $2,200 per qualifying child
    refundableAmount: 1700     // Up to $1,700 refundable (ACTC)
  }
};

/**
 * Qualified dividend and long-term capital gains tax brackets for married filing jointly
 * Both qualified dividends and long-term capital gains are taxed at 0%, 15%, or 20%
 * based on total taxable income (same brackets apply to both)
 *
 * Structure: [income_threshold, tax_rate]
 * - If total income ≤ first threshold: 0% tax
 * - If total income ≤ second threshold: 15% tax
 * - If total income > second threshold: 20% tax
 *
 * Source: IRS Revenue Procedures (same as ordinary income brackets)
 */
const QUALIFIED_DIVIDEND_BRACKETS = {
  // Source: IRS Revenue Procedure 2022-38
  2023: [
    [89250, 0.00],    // 0% on qualified dividends if total income ≤ $89,250
    [553850, 0.15],   // 15% on qualified dividends if total income ≤ $553,850
    [TAX_CONFIG.MAX_INCOME, 0.20], // 20% on qualified dividends if total income > $553,850
  ],
  // Source: IRS Revenue Procedure 2023-34
  2024: [
    [94050, 0.00],    // 0% on qualified dividends if total income ≤ $94,050
    [583750, 0.15],   // 15% on qualified dividends if total income ≤ $583,750
    [TAX_CONFIG.MAX_INCOME, 0.20], // 20% on qualified dividends if total income > $583,750
  ],
  // Source: IRS Revenue Procedure 2024-40
  2025: [
    [96700, 0.00],    // 0% on qualified dividends if total income ≤ $96,700
    [600050, 0.15],   // 15% on qualified dividends if total income ≤ $600,050
    [TAX_CONFIG.MAX_INCOME, 0.20], // 20% on qualified dividends if total income > $600,050
  ],
  // Source: IRS Revenue Procedure 2025-32 (projected)
  2026: [
    [98900, 0.00],    // 0% on qualified dividends if total income ≤ $98,900
    [613700, 0.15],   // 15% on qualified dividends if total income ≤ $613,700
    [TAX_CONFIG.MAX_INCOME, 0.20], // 20% on qualified dividends if total income > $613,700
  ],
};

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
  if (minYear !== null) {
    if (typeof year !== 'number' || year < minYear) {
      throw new Error(`Year must be ${minYear} or later`);
    }
  } else {
    if (!TAX_CONFIG.SUPPORTED_YEARS.includes(year)) {
      throw new Error(`Year must be one of: ${TAX_CONFIG.SUPPORTED_YEARS.join(', ')}`);
    }
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

  if (!(jurisdiction in TAX_CONFIG.JURISDICTIONS)) {
    throw new Error(`Jurisdiction must be one of: ${Object.keys(TAX_CONFIG.JURISDICTIONS).join(', ')}`);
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
    throw new Error(`${TAX_CONFIG.JURISDICTIONS[jurisdiction]} tax brackets not available for year ${year}`);
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
  return Math.max(0, income - THRESHOLD) * RATE;
}

/**
 * Calculates federal income tax for married filing jointly
 * @param {number} income - Annual gross income
 * @param {number} year - Tax year (2023-2026)
 * @returns {number} Federal income tax owed
 */
function getFederalIncomeTax(income, year) {
  return _calculateIncomeTax(income, year, 'federal');
}

/**
 * Calculates New York State income tax for married filing jointly
 * @param {number} income - Annual gross income
 * @param {number} year - Tax year (2023-2026)
 * @returns {number} NY State income tax owed
 */
function getNYIncomeTax(income, year) {
  return _calculateIncomeTax(income, year, 'ny');
}

/**
 * Calculates California State income tax for married filing jointly
 * Includes base income tax plus 1% Mental Health Services Tax on income over $1M
 * @param {number} income - Annual gross income
 * @param {number} year - Tax year (2023-2026)
 * @returns {number} Total California State income tax owed (including Mental Health Services Tax)
 */
function getCAIncomeTax(income, year) {
  return _calculateIncomeTax(income, year, 'ca') + _calculateCAMentalHealthTax(income);
}

/**
 * Helper function to calculate preferential tax rate (0%, 15%, 20%)
 * Used for both qualified dividends and long-term capital gains
 *
 * @param {number} amount - Amount subject to preferential tax rate
 * @param {number} totalTaxableIncome - Total taxable income
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

  // Determine the tax rate based on total taxable income
  let applicableRate = 0;
  for (const [threshold, rate] of brackets) {
    applicableRate = rate;
    if (totalTaxableIncome <= threshold) {
      break;
    }
  }

  // Apply the rate to the amount
  return amount * applicableRate;
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
  return _calculatePreferentialTax(qualifiedDividends, totalTaxableIncome, year, 'Qualified dividends');
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
  return _calculatePreferentialTax(longTermCapitalGains, totalTaxableIncome, year, 'Long-term capital gains');
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
  return taxableAmount * RATE;
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

  // Get credit amounts for the year
  const creditData = CHILD_TAX_CREDIT_AMOUNTS[year];
  if (!creditData) {
    throw new Error(`Child Tax Credit amounts not available for year ${year}`);
  }

  // Calculate base credit
  const baseCredit = creditData.creditPerChild * numberOfChildren;

  // If no children or no credit, return 0
  if (numberOfChildren === 0 || baseCredit === 0) {
    return 0;
  }

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