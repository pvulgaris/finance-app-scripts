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
 * Last Updated: April 2026
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

// NY State tax brackets - Source: NY State Tax Law Section 601
// 2023-2025: Original rates per NY State 2025 Budget
// 2026: Reduced rates for income ≤$323,200 per NY Budget Act of 2025
const NY_BRACKETS_2023_2025 = [
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

const NY_BRACKETS_2026 = [
  [17150, 0.039],
  [23600, 0.044],
  [27900, 0.0515],
  [161550, 0.054],
  [323200, 0.059],
  [2155350, 0.0685],
  [5000000, 0.0965],
  [25000000, 0.103],
  [TAX_CONFIG.MAX_INCOME, 0.109],
];

// ─── NY tax table benefit recapture (MFJ) ───────────────────────────────
// NY Form IT-201-I, Tax computation worksheets 2–6 (2025). Source:
//   https://www.tax.ny.gov/pdf/2025/inc/it201i_2025.pdf (pp. 34–35)
// Coefficients verified identical in the 2023 and 2024 editions.
//
// For NYAGI > $107,650, NY phases out the benefit of the lower brackets:
//   phase-in fraction f = min(NYAGI − anchor, 50,000) / 50,000
//   recaptured tax     = bracketed + base + benefit × f
// Once f = 1, the top applicable rate effectively applies to ALL taxable
// income in the band, not just the amount above the bracket threshold.
//
// The first-band worksheet (WS 1) phases in from bracketed tax to a flat
// 5.5% × taxable income, anchored at $107,650.
//
// Only MFJ is encoded here — matches the rest of the library, which is
// MFJ-only (see top-of-file notes and the README). This library receives
// a single income argument; we treat it as both NYAGI (line 33) and
// taxable income (line 38). Where recapture matters (high income), the
// phase-in is fully complete, so this simplification matches filed-
// return outcomes.

const _NY_RECAPTURE_PHASE_IN_START = 107650;      // phase-in begins here
const _NY_RECAPTURE_PHASE_IN_WINDOW = 50000;      // completes over $50K of NYAGI
const _NY_RECAPTURE_CLIFF_THRESHOLD = 25000000;   // WS 6: flat top rate above this
const _NY_RECAPTURE_CLIFF_RATE = 0.109;

// Each row is either a higher band { tiLimit, anchor, base, benefit }
// or a first-band row { tiLimit, firstBand: true, flatRate, anchor }.
// MFJ & qualifying surviving spouse — Worksheets 1–5.
const _NY_RECAPTURE_BANDS_MFJ_2023_2025 = [
  { tiLimit: 161550,   firstBand: true, flatRate: 0.055, anchor: 107650 },
  { tiLimit: 323200,   anchor: 161550,   base: 333,    benefit: 807 },
  { tiLimit: 2155350,  anchor: 323200,   base: 1140,   benefit: 2747 },
  { tiLimit: 5000000,  anchor: 2155350,  base: 3887,   benefit: 60350 },
  { tiLimit: Infinity, anchor: 5000000,  base: 64237,  benefit: 32500 },
];

const NY_RECAPTURE_MFJ_TABLE = {
  2023: _NY_RECAPTURE_BANDS_MFJ_2023_2025,
  2024: _NY_RECAPTURE_BANDS_MFJ_2023_2025,
  2025: _NY_RECAPTURE_BANDS_MFJ_2023_2025,
  // 2026 intentionally omitted — recapture coefficients will change with
  // the NY Budget Act of 2025 rate cuts; the official 2026 IT-201-I has
  // not been published yet. getNYIncomeTax returns bracketed tax only
  // for 2026 (prior behavior) until the coefficients are transcribed.
};

// ─── NY itemized deduction phaseout (MFJ) ───────────────────────────────
// NY Form IT-196 Itemized Deductions, lines 46–47 (MFJ). Sources:
//   2025: https://www.tax.ny.gov/pdf/current_forms/it/it196i.pdf (pp. 20–21)
//   2024: https://www.tax.ny.gov/pdf/2024/inc/it196i_2024.pdf (pp. 20–21)
//   2023: https://www.tax.ny.gov/pdf/2023/printable-pdfs/inc/it196i-2023.pdf
//         (pp. 29–30)
// Coefficients verified identical in 2023, 2024, and 2025 editions. (2025
// collapses the NYAGI > $1M cases into a single "enter % of line 19"
// instruction on line 47; 2023–2024 achieve the same result via
// Worksheets 5 and 6. Net allowed deduction is the same formula.)
//
// 2026 rolls forward from 2025 — the phaseout structure has been stable
// since NY introduced IT-196 in 2018, and the NY 2025 Budget Act cut
// rates without touching the itemized phaseout or standard deduction
// (which is statutorily fixed in NY Tax Law §614). To be re-verified
// when IT-196-I 2026 publishes (~Jan 2027).
//
// At higher NYAGI the allowed itemized deduction is reduced; in the top
// bands it is replaced by a flat percentage of charitable contributions:
//   NYAGI > $1M,  ≤ $10M: allowed = 50% × charitable
//   NYAGI > $10M:         allowed = 25% × charitable
//
// MFJ only — matches the rest of the library. The filing-status knob is
// the Worksheet 3 anchor ($200,000 for MFJ / QSS; lower for other
// statuses), folded into _NY_WS3_ANCHOR_MFJ below.

const _NY_WS3_ANCHOR_MFJ = 200000;             // WS 3 line 2 (MFJ/QSS)
const _NY_WS3_WINDOW = 50000;                  // WS 3 ramp window
const _NY_WS4_WINDOW = 50000;                  // WS 4 ramp window

// Each band: { upperAgi, apply(nyAgi, itemizedTotal, charitable) }.
// `upperAgi` is inclusive; bands are matched first-fit.
const _NY_DEDUCTION_BANDS_MFJ_2023_2026 = [
  // NYAGI ≤ $100K: no phaseout.
  { upperAgi: 100000,
    apply: (_nyAgi, itemizedTotal) => itemizedTotal },

  // WS 3: reduce by 25% × (min(NYAGI − $200K, $50K) / $50K) of line 45.
  // Between NYAGI $100K and $200K the fraction is zero (MFJ anchor is
  // $200K, which leaves WS 3 line 3 ≤ 0 → line 46 blank). Ramps 0→25%
  // across $200K–$250K, then flat 25% through $475K.
  { upperAgi: 475000,
    apply: (nyAgi, itemizedTotal) => {
      const f = Math.min(
        Math.max(0, nyAgi - _NY_WS3_ANCHOR_MFJ),
        _NY_WS3_WINDOW
      ) / _NY_WS3_WINDOW;
      return itemizedTotal * (1 - 0.25 * f);
    } },

  // WS 4: ramp from 25% to 50% reduction across NYAGI $475K–$525K.
  { upperAgi: 525000,
    apply: (nyAgi, itemizedTotal) => {
      const f = Math.min(
        Math.max(0, nyAgi - 475000),
        _NY_WS4_WINDOW
      ) / _NY_WS4_WINDOW;
      return itemizedTotal * (1 - 0.25 * (1 + f));
    } },

  // NYAGI $525K–$1M: flat 50% reduction of line 45.
  { upperAgi: 1000000,
    apply: (_nyAgi, itemizedTotal) => itemizedTotal * 0.5 },

  // NYAGI $1M–$10M: allowed = 50% of charitable (IT-196 line 19).
  { upperAgi: 10000000,
    apply: (_nyAgi, _itemizedTotal, charitable) => charitable * 0.5 },

  // NYAGI > $10M: allowed = 25% of charitable.
  { upperAgi: Infinity,
    apply: (_nyAgi, _itemizedTotal, charitable) => charitable * 0.25 },
];

// Statutory MFJ standard deduction (NY Tax Law §614). Confirmed
// $16,050 in the 2023/2024/2025 IT-201-I standard deduction tables;
// 2026 is a rollover (see the comment above on the phaseout table).
const _NY_STANDARD_DEDUCTION_MFJ = {
  2023: 16050,
  2024: 16050,
  2025: 16050,
  2026: 16050,
};

const _NY_DEDUCTION_PHASEOUT_MFJ = {
  2023: _NY_DEDUCTION_BANDS_MFJ_2023_2026,
  2024: _NY_DEDUCTION_BANDS_MFJ_2023_2026,
  2025: _NY_DEDUCTION_BANDS_MFJ_2023_2026,
  2026: _NY_DEDUCTION_BANDS_MFJ_2023_2026,
};

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
    2023: NY_BRACKETS_2023_2025,
    2024: NY_BRACKETS_2023_2025,
    2025: NY_BRACKETS_2023_2025,
    2026: NY_BRACKETS_2026,
  },
  ca: {
    // Source: California FTB Schedule Y (2023-2025 actual; 2026 estimated via 2.971% CA CPI adjustment)
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
      [22158, 0.01],
      [52528, 0.02],
      [82904, 0.04],
      [115084, 0.06],
      [145448, 0.08],
      [742958, 0.093],
      [891542, 0.103],
      [1485906, 0.113],
      [TAX_CONFIG.MAX_INCOME, 0.123],
    ],
    2026: [
      [22816, 0.01],
      [54089, 0.02],
      [85367, 0.04],
      [118503, 0.06],
      [149769, 0.08],
      [765031, 0.093],
      [918030, 0.103],
      [1530052, 0.113],
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
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative finite number`);
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
 * Applies NY "tax table benefit recapture" on top of the MFJ bracketed tax.
 *
 * Encodes the IT-201-I Tax computation worksheets 2–6 (MFJ): for NYAGI
 * above $107,650, NY phases out the benefit of the lower brackets. See
 * NY_RECAPTURE_MFJ_TABLE above for the transcribed coefficients.
 *
 * Assumes NYAGI == taxableIncome (this library receives a single income
 * argument; see the NY_RECAPTURE_MFJ_TABLE comment for why this is safe).
 *
 * Years outside the published table (currently 2026) return the
 * bracketed tax unchanged so existing callers aren't broken.
 *
 * @param {number} taxableIncome - NY taxable income (also treated as NYAGI)
 * @param {number} bracketedTax - Progressive tax from NY MFJ brackets
 * @param {number} year - Tax year
 * @returns {number} Tax after recapture (unrounded)
 * @private
 */
function _applyNYRecapture(taxableIncome, bracketedTax, year) {
  // Below the phase-in threshold: no recapture applies.
  if (taxableIncome <= _NY_RECAPTURE_PHASE_IN_START) {
    return bracketedTax;
  }

  const bands = NY_RECAPTURE_MFJ_TABLE[year];
  if (!bands) {
    // Year not covered by transcribed worksheets — return bracketed tax
    // unchanged (preserves pre-fix behavior for e.g. 2026).
    return bracketedTax;
  }

  // WS 6: when NYAGI > $25M, flat top rate (10.9%) × taxable income.
  if (taxableIncome > _NY_RECAPTURE_CLIFF_THRESHOLD) {
    return _NY_RECAPTURE_CLIFF_RATE * taxableIncome;
  }

  // Locate the band whose taxable-income ceiling contains our income.
  const band = bands.find(b => taxableIncome <= b.tiLimit);
  const phaseIn = Math.min(
    Math.max(0, taxableIncome - band.anchor),
    _NY_RECAPTURE_PHASE_IN_WINDOW
  ) / _NY_RECAPTURE_PHASE_IN_WINDOW;

  if (band.firstBand) {
    // WS 1: phase in from bracketed tax to flatRate × taxableIncome.
    const flatTax = band.flatRate * taxableIncome;
    return bracketedTax + (flatTax - bracketedTax) * phaseIn;
  }

  // WS 2–5: bracketed + base + benefit × phase-in fraction.
  return bracketedTax + band.base + band.benefit * phaseIn;
}

/**
 * Calculates New York State income tax for married filing jointly.
 *
 * Applies the "tax table benefit recapture" required by Form IT-201
 * (worksheets 2–6 MFJ) for NYAGI > $107,650.
 *
 * @param {number} income - Annual NY taxable income (treated as NYAGI too)
 * @param {number} year - Tax year (2023-2026)
 * @returns {number} NY State income tax owed
 * @throws {Error} If parameters are invalid
 */
function getNYIncomeTax(income, year) {
  const bracketedTax = _calculateIncomeTax(income, year, 'ny');
  return _roundToCents(_applyNYRecapture(income, bracketedTax, year));
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
 * Returns the marginal tax rate for a given income level
 * The marginal rate is the tax rate applied to the next dollar of income
 *
 * @param {number} income - Annual taxable income
 * @param {number} year - Tax year (2023-2026)
 * @param {string} jurisdiction - Tax jurisdiction ('federal', 'ny', 'ca', 'nc')
 * @returns {number} Marginal tax rate as a decimal (e.g., 0.22 for 22%)
 * @throws {Error} If parameters are invalid
 *
 * @example
 * // Federal marginal rate for $150,000 income in 2024
 * getMarginalRate(150000, 2024, 'federal'); // Returns 0.22
 *
 * @example
 * // NY marginal rate for $500,000 income in 2025
 * getMarginalRate(500000, 2025, 'ny'); // Returns 0.0685
 */
function getMarginalRate(income, year, jurisdiction) {
  _validateTaxInputs(income, year, jurisdiction);

  const brackets = TAX_BRACKETS[jurisdiction][year];

  for (const [threshold, rate] of brackets) {
    if (income < threshold) {
      return rate;
    }
  }

  // Return highest rate if income exceeds all thresholds
  return brackets[brackets.length - 1][1];
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

  if (amount > totalTaxableIncome) {
    throw new Error(`${assetType} (${amount}) cannot exceed total taxable income (${totalTaxableIncome})`);
  }

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

/**
 * Returns the NY State allowed deduction for MFJ: the greater of the
 * income-phased itemized deduction or the standard deduction.
 *
 * Encodes Form IT-196 lines 46–47 (Itemized deduction adjustment and
 * after adjustment) plus the IT-201-I standard deduction table — see
 * _NY_DEDUCTION_BANDS_MFJ_2023_2026 for the transcribed coefficients
 * and sources.
 *
 * The caller must pass `itemizedTotal` as the would-be itemized amount
 * *before* the NY income-based phaseout (equivalent to IT-196 line 45),
 * and `charitable` as total gifts to charity (IT-196 line 19). The top
 * two bands replace the allowed deduction entirely with a fraction of
 * charitable contributions.
 *
 * @param {number} nyAgi - NY Adjusted Gross Income (IT-201 line 33)
 * @param {number} itemizedTotal - Itemized deductions before the NY
 *     income-based phaseout (IT-196 line 45)
 * @param {number} charitable - Total gifts to charity (IT-196 line 19)
 * @param {number} year - Tax year (2023-2026; 2026 rolls forward from 2025)
 * @returns {number} Allowed deduction (standard or phased itemized,
 *     whichever is greater).
 * @throws {Error} If parameters are invalid or the year isn't supported.
 *
 * @example
 * // 2025 MFJ, NYAGI $1,042,100, itemized $53,230 (incl. $4,456 charitable):
 * // NYAGI > $1M → allowed itemized = 50% × $4,456 = $2,228, less than
 * // the $16,050 MFJ standard, so the standard wins.
 * getNYDeductionMFJ(1042100, 53230, 4456, 2025); // → 16050
 */
function getNYDeductionMFJ(nyAgi, itemizedTotal, charitable, year) {
  _validateNonNegativeNumber(nyAgi, 'NY AGI');
  _validateNonNegativeNumber(itemizedTotal, 'Itemized total');
  _validateNonNegativeNumber(charitable, 'Charitable');
  _validateYear(year);

  const bands = _NY_DEDUCTION_PHASEOUT_MFJ[year];
  const standard = _NY_STANDARD_DEDUCTION_MFJ[year];
  if (!bands || standard === undefined) {
    throw new Error(
      `NY itemized deduction phaseout (MFJ) not available for year ${year}`
    );
  }

  const band = bands.find(b => nyAgi <= b.upperAgi);
  const phased = band.apply(nyAgi, itemizedTotal, charitable);
  return phased > standard ? _roundToCents(phased) : standard;
}