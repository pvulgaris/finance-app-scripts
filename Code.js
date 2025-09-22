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
 * - These calculations do not include standard deductions, personal exemptions, or credits
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
    // ESTIMATED - Based on typical 2.8% inflation adjustment
    // Source: Tax Foundation projection based on inflation adjustments
    2026: [
      [24500, 0.10],    // 10% on income up to $24,500 (estimated)
      [99550, 0.12],    // 12% on income from $24,501 to $99,550 (estimated)
      [212500, 0.22],   // 22% on income from $99,551 to $212,500 (estimated)
      [405300, 0.24],   // 24% on income from $212,501 to $405,300 (estimated)
      [515100, 0.32],   // 32% on income from $405,301 to $515,100 (estimated)
      [772700, 0.35],   // 35% on income from $515,101 to $772,700 (estimated)
      [TAX_CONFIG.MAX_INCOME, 0.37], // 37% on income over $772,700
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
    // ESTIMATED - 0.1% reduction planned for lower brackets in 2026
    // Source: NY State 2025 Budget legislation
    2026: [
      [17150, 0.039],     // 3.9% on income up to $17,150 (reduced by 0.1%)
      [23600, 0.044],     // 4.4% on income from $17,151 to $23,600 (reduced by 0.1%)
      [27900, 0.0515],    // 5.15% on income from $23,601 to $27,900 (reduced by 0.1%)
      [161550, 0.054],    // 5.4% on income from $27,901 to $161,550 (reduced by 0.1%)
      [323200, 0.059],    // 5.9% on income from $161,551 to $323,200 (reduced by 0.1%)
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
    // ESTIMATED - Based on CA inflation adjustment of ~3.3%
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
 * Validates input parameters for tax calculations (private method)
 * @param {number} income - Annual income amount
 * @param {number} year - Tax year
 * @param {string} jurisdiction - Tax jurisdiction
 * @throws {Error} If parameters are invalid
 * @private
 */
function _validateTaxInputs(income, year, jurisdiction = 'federal') {
  if (typeof income !== 'number' || income < 0) {
    throw new Error('Income must be a non-negative number');
  }

  if (!TAX_CONFIG.SUPPORTED_YEARS.includes(year)) {
    throw new Error(`Year must be one of: ${TAX_CONFIG.SUPPORTED_YEARS.join(', ')}`);
  }

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
  const baseTax = _calculateIncomeTax(income, year, 'ca');
  const mentalHealthTax = _calculateCAMentalHealthTax(income);
  return baseTax + mentalHealthTax;
}