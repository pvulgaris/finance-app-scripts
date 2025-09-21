function getFederalIncomeTax(income, year) {
  let MAX_INCOME = 10000000;
  let rates = {
    2023:[
      [22000, 0.10],
      [89450, 0.12],
      [190750, 0.22],
      [364200, 0.24],
      [462500, 0.32],
      [693750, 0.35],
      [MAX_INCOME, 0.37],
    ],
    2024:[
      [23200, 0.10],
      [94300, 0.12],
      [201050, 0.22],
      [383900, 0.24],
      [487450, 0.32],
      [731200, 0.35],
      [MAX_INCOME, 0.37],
    ],
    2025:[
      [23850, 0.10],
      [96950, 0.12],
      [206700, 0.22],
      [394600, 0.24],
      [501050, 0.32],
      [751600, 0.35],
      [MAX_INCOME, 0.37],
    ],
    // https://taxfoundation.org/blog/2026-tax-brackets-tax-cuts-and-jobs-act-expires/
    2026:[
      [24500, 0.10],
      [99550, 0.12],
      [212200, 0.22],
      [405050, 0.24],
      [514400, 0.32],
      [771550, 0.35],
      [MAX_INCOME, 0.37],
    ],
  };
  let lastIncomeBracket = 0;
  return (rates[year] || array())
    .map((row) => {
      let partialTax = Math.max(0, Math.min(income, row[0]) - lastIncomeBracket) * row[1];
      lastIncomeBracket = row[0] + 1;
      return partialTax;
    })
    .reduce((a, v) => a + v);
}
function getNYIncomeTax(income, year) {
  let MAX_INCOME = 10000000;
  let rates = {
    // https://smartasset.com/taxes/new-york-tax-calculator
    2025:[
      [17150, 0.04],
      [23600, 0.045],
      [27900, 0.0525],
      [161550, 0.055],
      [323200, 0.06],
      [2155350, 0.0685],
      [5000000, 0.0965],
      [25000000, 0.103],
      [MAX_INCOME, 0.109],
    ],
    // TODO: Update these
    2026:[
      [17150, 0.04],
      [23600, 0.045],
      [27900, 0.0525],
      [161550, 0.055],
      [323200, 0.06],
      [2155350, 0.0685],
      [5000000, 0.0965],
      [25000000, 0.103],
      [MAX_INCOME, 0.109],
    ],
  };
  let lastIncomeBracket = 0;
  return (rates[year] || array())
    .map((row) => {
      let partialTax = Math.max(0, Math.min(income, row[0]) - lastIncomeBracket) * row[1];
      lastIncomeBracket = row[0] + 1;
      return partialTax;
    })
    .reduce((a, v) => a + v);
}