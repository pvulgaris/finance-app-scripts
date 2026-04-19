# finance-app-scripts

Google Apps Script functions for U.S. federal and state income tax
calculations, usable as custom functions in Google Sheets. Covers tax years
**2023–2026** for **married filing jointly** status (North Carolina's flat
tax applies to all filing statuses).

## Disclaimer

**This software is not tax advice.** It is provided for educational and
personal planning purposes only. Tax law is complex and changes frequently,
and calculations here may be incomplete, estimated, or out of date. Consult a
qualified tax professional before relying on any output for filing,
withholding, or financial decisions. See `LICENSE` for the full no-warranty
terms.

## Functions

| Function | Description |
| --- | --- |
| `getFederalIncomeTax(income, year)` | Federal income tax (progressive brackets) |
| `getNYIncomeTax(income, year)` | New York State income tax |
| `getCAIncomeTax(income, year)` | California State income tax + 1% Mental Health Services Tax on income over $1M |
| `getNCIncomeTax(income, year)` | North Carolina State income tax (flat rate) |
| `getMarginalRate(income, year, jurisdiction)` | Marginal tax rate on the next dollar of income |
| `getQualifiedDividendTax(qualifiedDividends, totalTaxableIncome, year)` | Federal tax on qualified dividends (0% / 15% / 20%) |
| `getLongTermCapitalGainsTax(longTermCapitalGains, totalTaxableIncome, year)` | Federal tax on long-term capital gains (0% / 15% / 20%) |
| `getNetInvestmentIncomeTax(netInvestmentIncome, modifiedAGI, year)` | NIIT — 3.8% surtax when MAGI > $250,000 (year ≥ 2013) |
| `getChildTaxCredit(numberOfChildren, modifiedAGI, year)` | Child Tax Credit with $400K MAGI phase-out |

Supported jurisdictions for `getMarginalRate`: `federal`, `ny`, `ca`, `nc`.

## Usage in Google Sheets

Once deployed (see below), call any function directly from a cell:

```
=getFederalIncomeTax(A1, 2024)
=getCAIncomeTax(150000, 2025)
=getMarginalRate(200000, 2024, "federal")
=getQualifiedDividendTax(50000, 200000, 2024)
```

Standard deductions, personal exemptions, and other credits are **not**
applied — pass taxable income, not gross income, if your scenario requires
deductions.

## Setup

### Option A: Copy/paste into Apps Script

1. In Google Sheets, open **Extensions → Apps Script**.
2. Replace the contents of `Code.gs` with the contents of `Code.js` from this
   repo.
3. Save. The functions are now available in the spreadsheet.

### Option B: Deploy with `clasp`

[`clasp`](https://github.com/google/clasp) is Google's CLI for Apps Script.

```bash
npm install -g @google/clasp
clasp login
git clone https://github.com/pvulgaris/finance-app-scripts.git
cd finance-app-scripts
clasp create --type sheets --title "Finance App Scripts"   # or: clasp clone <scriptId>
clasp push
```

`.clasp.json` is intentionally gitignored — it holds your personal script ID.

## Data Sources

- **Federal**: IRS Revenue Procedures 2022-38, 2023-34, 2024-40, 2025-32
- **New York**: NY State Tax Law Section 601; NY Budget Act of 2025
- **California**: California Franchise Tax Board (FTB)
- **North Carolina**: NC Department of Revenue; Session Law 2023-134

Years marked "estimated" in `Code.js` use projected inflation adjustments and
should be re-verified once official rates are published.

## Contributing

Issues and pull requests welcome. If you update bracket data, please cite the
primary source (e.g., IRS Revenue Procedure number) in the commit message or
PR description.

## License

MIT — see `LICENSE`.
