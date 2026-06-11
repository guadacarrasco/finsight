"""Generate a realistic bank statement PDF for testing."""
import fitz

STATEMENT = """\
FIRST NATIONAL BANK
Account Statement — May 2026
Account Holder: Alex Rivera
Account Number: ****4821
Statement Period: May 1, 2026 – May 31, 2026

Opening Balance:   $3,241.18
Closing Balance:   $6,453.14

TRANSACTIONS
----------------------------------------------------------------------
Date       Description                        Amount      Balance
----------------------------------------------------------------------
05/01      RENT PAYMENT                    -$1,950.00    $1,291.18
05/01      NETFLIX SUBSCRIPTION               -$17.99    $1,273.19
05/03      WHOLE FOODS MARKET                 -$94.37    $1,178.82
05/05      STARBUCKS #3421                     -$6.75    $1,172.07
05/07      AMAZON.COM                         -$43.99    $1,128.08
05/10      TRADER JOE'S                       -$58.20    $1,069.88
05/14      SHELL GAS STATION                  -$52.40    $1,017.48
05/15      DIRECT DEPOSIT - ACME CORP      +$5,416.67    $6,434.15
05/20      ATM WITHDRAWAL                    -$200.00    $6,234.15
05/22      VENMO TRANSFER FROM J.SMITH       +$120.00    $6,354.15
05/25      CHIPOTLE MEXICAN GRILL             -$14.25    $6,339.90
05/28      AMAZON PRIME MEMBERSHIP            -$14.99    $6,324.91
05/30      COMCAST INTERNET                   -$89.99    $6,234.92
05/31      LYFT RIDE                          -$18.30    $6,216.62
05/31      INTEREST EARNED                    +$236.52    $6,453.14

----------------------------------------------------------------------
SUMMARY
  Total Credits:    $5,773.19
  Total Debits:    $2,561.23
  Net Change:      +$3,211.96

IMPORTANT NOTICES
  Minimum monthly balance requirement: $500.00
  You are enrolled in paperless statements.
  For questions call 1-800-555-0199 or visit firstnationalbank.example.com
----------------------------------------------------------------------
"""


def make_pdf(out_path: str) -> None:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text(
        (50, 60),
        STATEMENT,
        fontname="Courier",
        fontsize=9,
        color=(0, 0, 0),
    )
    doc.save(out_path)
    doc.close()
    print(f"Created {out_path}")


if __name__ == "__main__":
    import os
    out = os.path.join(os.path.dirname(__file__), "bank_statement.pdf")
    make_pdf(out)
