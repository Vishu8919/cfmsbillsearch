// src/pages/articles/why-cfms-bill-rejected.tsx
import ArticleLayout from '../../components/ArticleLayout'

export default function WhyCfmsBillRejected() {
  return (
    <ArticleLayout
      title="Why a CFMS Bill Gets Rejected or Returned — and How to Fix It"
      description="The most common reasons an Andhra Pradesh CFMS bill is returned or rejected — wrong budget head, insufficient allotment, missing documents, duplicate claims and more — plus practical fixes for each."
      canonicalPath="/articles/why-cfms-bill-rejected"
      subtitle="A returned or rejected bill delays everyone's payment. These are the causes that come up again and again in the AP treasury system, and how to prevent them."
      readingTime="9 min read"
    >
      <p>
        Few things slow down a government payment more than a bill bouncing back from the
        treasury. For a Drawing and Disbursing Officer (DDO), a returned or rejected CFMS
        bill means re-work; for the employee or vendor waiting on the money, it means more
        delay. The good news is that the reasons bills get sent back are surprisingly
        repetitive — and once you know them, most are easy to avoid.
      </p>
      <p>
        This guide goes through the common causes of returns and rejections in the
        Andhra Pradesh CFMS system and explains how to fix or prevent each one.
      </p>

      <h2>Returned vs rejected: know which you're dealing with</h2>
      <p>
        Before fixing anything, identify what happened:
      </p>
      <ul>
        <li>
          <strong>Returned / Objected</strong> — the treasury found a correctable issue and
          sent the bill back with a note. The bill is still alive; fix the issue and
          resubmit.
        </li>
        <li>
          <strong>Rejected</strong> — the bill was refused outright and usually has to be
          raised again. Rejections tend to point to a more fundamental problem.
        </li>
      </ul>
      <p>
        For a fuller explanation of these and every other status, see{' '}
        <a href="/articles/cfms-bill-status-meaning">what each CFMS bill status means</a>.
      </p>

      <h2>1. Wrong or invalid budget head</h2>
      <p>
        Every bill must be drawn against the correct Head of Account. If the head is wrong,
        does not match the nature of the expenditure, or is not the one under which funds
        were allotted, the bill will be objected to or rejected.
      </p>
      <p>
        <strong>Fix:</strong> double-check the Head of Account against the sanction order
        and the budget allotment before submitting. Make sure the major, minor and detailed
        heads all correspond to the type of payment. The{' '}
        <a href="/articles/cfms-object-heads-list">CFMS Object Heads list</a> shows the
        correct Detailed and Sub-Detailed Head codes for each kind of expenditure.
      </p>

      <h2>2. Insufficient or lapsed budget allotment</h2>
      <p>
        CFMS checks whether enough budget is available under the relevant head before a bill
        can pass. If the allotment is exhausted, has not been released, or has lapsed at
        year-end, the bill cannot go through.
      </p>
      <p>
        <strong>Fix:</strong> confirm that budget has been distributed and is available for
        the head before raising the bill. Near 31 March, be especially careful — allotments
        not used in time lapse, and bills against them will fail.
      </p>

      <h2>3. Missing or incorrect supporting documents</h2>
      <p>
        Many claims require enclosures — sanction orders, vouchers, certificates, or
        proof of expenditure. Medical reimbursement, travelling allowance, and contingent
        bills are common examples. If a required document is missing or does not match the
        claim, the bill is returned.
      </p>
      <p>
        <strong>Fix:</strong> keep a checklist of the documents each bill type needs and
        attach them all before submission. Ensure amounts and dates on the documents match
        the figures in the bill.
      </p>

      <h2>4. Beneficiary or bank account problems</h2>
      <p>
        If the beneficiary's bank account details are wrong, inactive, or not properly
        mapped in the system, the payment cannot be released even after the bill is passed.
        Mismatched names or incorrect account numbers are frequent culprits.
      </p>
      <p>
        <strong>Fix:</strong> verify the beneficiary's account number, IFSC and name
        against bank records before submitting. Correcting account details after a failure
        is slower than getting them right the first time.
      </p>

      <h2>5. Duplicate or double claims</h2>
      <p>
        If the same claim is submitted twice — for instance the same allowance billed in two
        separate bills — the system or the verifying officer will reject the duplicate.
      </p>
      <p>
        <strong>Fix:</strong> maintain a clear bill register so the office can see what has
        already been claimed. Before raising a bill, confirm the same amount has not already
        been submitted.
      </p>

      <h2>6. Calculation or amount errors</h2>
      <p>
        Arithmetic mistakes, wrong rates, incorrect deductions, or a total that does not add
        up will cause an objection. Even small inconsistencies between the figures and the
        supporting documents can hold a bill up.
      </p>
      <p>
        <strong>Fix:</strong> re-check all calculations, including deductions and recoveries,
        and make sure the net amount is consistent throughout the bill.
      </p>

      <h2>7. Rule or sanction issues</h2>
      <p>
        Some bills require a specific sanction or must comply with a particular government
        order. If the necessary sanction is absent, has expired, or the claim does not
        follow the applicable rule, the treasury will not pass it.
      </p>
      <p>
        <strong>Fix:</strong> ensure the relevant sanction order is in place and valid, and
        that the claim is admissible under current rules before submitting.
      </p>

      <h2>8. Data entry and formatting mistakes</h2>
      <p>
        Simple keying errors — a wrong date, a transposed figure, an incorrect employee
        ID — are an avoidable but common reason for returns. The system is precise, and a
        small mismatch can stop a bill.
      </p>
      <p>
        <strong>Fix:</strong> review every field carefully before submission. A two-minute
        check is faster than a full resubmission cycle.
      </p>

      <h2>A simple pre-submission checklist for DDOs</h2>
      <div className="note">
        Before submitting any bill in CFMS, confirm:
        <ul>
          <li>Correct Head of Account, matching the sanction.</li>
          <li>Budget allotment available and not lapsed.</li>
          <li>All required supporting documents attached.</li>
          <li>Beneficiary bank details verified.</li>
          <li>No duplicate of an already-submitted claim.</li>
          <li>All calculations and deductions checked.</li>
          <li>Necessary sanction order valid and enclosed.</li>
          <li>Every field reviewed for typing errors.</li>
        </ul>
      </div>

      <h2>What to do once a bill is returned</h2>
      <ol>
        <li>Read the objection or remark carefully — it tells you what is wrong.</li>
        <li>Fix exactly that issue; don't change unrelated parts of the bill.</li>
        <li>Re-verify documents and figures around the corrected item.</li>
        <li>Resubmit and track the status using the <a href="/">bill status checker</a>.</li>
      </ol>
      <p>
        For a rejected bill, you will usually need to prepare a fresh bill after addressing
        the root cause. If you are not sure why a bill failed, the office accounts section
        or treasury can clarify the reason recorded in CFMS.
      </p>

      <h2>The bottom line</h2>
      <p>
        Almost every CFMS rejection traces back to one of a few issues: the wrong head,
        missing budget, missing documents, bad bank details, or a duplicate claim. Building
        a habit of checking these before submission dramatically reduces returns — and keeps
        salaries, allowances and vendor payments moving on time.
      </p>
    </ArticleLayout>
  )
}
