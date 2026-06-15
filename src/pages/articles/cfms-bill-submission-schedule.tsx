// src/pages/articles/cfms-bill-submission-schedule.tsx
import ArticleLayout from '../../components/ArticleLayout'

const schedule: { window: string; label: string; bills: string }[] = [
  {
    window: 'Throughout the month',
    label: 'Any working day',
    bills:
      'Bills pertaining to Raj Bhavan, High Court, Decretal Charges, Legal Charges, Loan, Annuity and Interest payments, Election-related expenses, Exam-related expenses, Protocol Expenses, Obsequies charges, Natural Calamities (TR-27), AC bills, Medical Advances, and first payment to pensioners.',
  },
  {
    window: '6th – 10th of the month',
    label: 'Arrears & supplementary',
    bills:
      'Supplementary salary bills, all types of arrear bills, Honorarium, Wages, etc. — including salaries paid through PD Account, and Scholarships and Stipends of all Welfare Departments.',
  },
  {
    window: '11th – 15th of the month',
    label: 'Budget, GPF & advances',
    bills:
      'All Budget-related bills, GPF, Loans and Advances of employees, and PD A/c payments other than salaries.',
  },
  {
    window: '16th – 25th of the month',
    label: 'Regular salaries & pensions',
    bills:
      'Regular Pensions, GIS, FBF, regular salary bills, Wages, Work Charged Establishment, Professional Services, Other Contractual Services, Grants-in-Aid towards salaries, Payments to Home Guards, Payments to Anganwadi Workers, Honorarium to VRAs, all regular salary-related items including salary through PD A/c, Social Security Pensions, subsidies of Rice and Power, and all other bills not covered above.',
  },
]

export default function CfmsBillSubmissionSchedule() {
  return (
    <ArticleLayout
      title="CFMS Bill Submission Schedule: When to Submit Bills to Treasury / PAO"
      description="The Andhra Pradesh CFMS bill submission schedule — which bills (salary, arrears, GPF, pensions, grants) must be presented to the Treasury and PAO on which dates of the month, based on G.O. RT No. 1512 dated 01.06.2020."
      canonicalPath="/articles/cfms-bill-submission-schedule"
      subtitle="Andhra Pradesh re-introduced a fixed calendar for presenting different types of bills to the Treasury and PAO. Submitting your bill in the right window helps it get processed without avoidable delay."
      readingTime="6 min read"
    >
      <p>
        One question DDOs and office staff ask often is: "When should I submit this bill?"
        In Andhra Pradesh, the answer depends on the <em>type</em> of bill. The government
        operates a fixed schedule that assigns different categories of bills to specific date
        windows in each month. Submitting a bill in its correct window helps the Treasury and
        Pay and Accounts Office (PAO) manage their workload and audit quality — and helps your
        bill move without unnecessary hold-ups.
      </p>

      <div className="note">
        <strong>Source:</strong> This schedule is based on{' '}
        <strong>G.O. RT No. 1512, Finance (Cash and Debt Management) Department, dated 01.06.2020</strong>,
        which re-introduced the schedule for presentation of bills under various schemes and
        programmes, with effect from July 2020. Always confirm the current schedule through
        official channels, as instructions can be revised.
      </div>

      <h2>Why there is a submission schedule</h2>
      <p>
        During the early phase of CFMS, the schedule for presenting bills was kept on hold, so
        there was no restriction on the dates DDOs could submit bills. Over time, the
        government found that this unregulated submission affected the quality of bill
        preparation, the quality of audit, and the estimation and management of fund outflows,
        and also placed an uneven load on CFMS system resources.
      </p>
      <p>
        To streamline the state's public financial management — and to prioritise flagship and
        Centrally Sponsored Scheme payments — the schedule for bill presentation was
        re-introduced. The aim is proper scheduling, efficiency, and predictable processing.
      </p>

      <h2>The CFMS bill submission schedule</h2>
      <p>
        The table below shows which bills should be presented to the Treasury and PAO in each
        window of the month.
      </p>

      <table>
        <thead>
          <tr>
            <th style={{ width: '150px' }}>Submission window</th>
            <th>Bills to be submitted</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row, i) => (
            <tr key={i}>
              <td>
                <strong>{row.window}</strong>
                <br />
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{row.label}</span>
              </td>
              <td>{row.bills}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Quick summary by bill type</h2>
      <ul>
        <li><strong>Regular salary bills</strong> — 16th to 25th of the month.</li>
        <li><strong>Regular pensions and Social Security Pensions</strong> — 16th to 25th.</li>
        <li><strong>Arrear and supplementary salary bills</strong> — 6th to 10th.</li>
        <li><strong>Honorarium and wages</strong> — 6th to 10th.</li>
        <li><strong>Scholarships and stipends (Welfare)</strong> — 6th to 10th.</li>
        <li><strong>GPF, loans and advances</strong> — 11th to 15th.</li>
        <li><strong>Other budget-related and non-salary PD bills</strong> — 11th to 15th.</li>
        <li><strong>Court, legal, loan, interest, election, exam, protocol and calamity bills</strong> — any working day.</li>
        <li><strong>Medical advances and first payment to pensioners</strong> — any working day.</li>
      </ul>

      <h2>What happens if the last day is a holiday?</h2>
      <p>
        If the last day for submitting a bill or making a payment falls on a holiday, it is
        carried out on the following working day. So you do not lose your window simply
        because it ends on a Sunday or public holiday.
      </p>

      <h2>Important points to keep in mind</h2>
      <ul>
        <li>
          DDOs are instructed to follow this schedule strictly. Presenting a bill in the
          right window keeps processing orderly and predictable.
        </li>
        <li>
          The Director of Treasuries and Accounts and the PAO issue internal guidelines for
          passing presented bills within a stipulated timeframe.
        </li>
        <li>
          Payment timing is also subject to the state's ways-and-means (cash) position, so the
          schedule governs <em>presentation</em>; actual release can depend on fund
          availability.
        </li>
      </ul>

      <h2>How this fits with the rest of the process</h2>
      <p>
        Submitting on schedule is one part of getting paid smoothly. The other parts are using
        the correct expenditure code and tracking the bill afterwards. See the{' '}
        <a href="/articles/cfms-object-heads-list">CFMS Object Heads list</a> to choose the
        right Detailed/Sub-Detailed Head for your bill, our{' '}
        <a href="/articles/cfms-guide-for-ddos">guide for DDOs</a> for handling bills
        efficiently, and{' '}
        <a href="/articles/cfms-bill-status-meaning">what each CFMS bill status means</a> to
        follow a bill once it has been submitted.
      </p>

      <h2>Summary</h2>
      <p>
        The CFMS bill submission schedule assigns each type of bill to a date window: court
        and emergency-type bills any time, arrears and welfare scholarships from the 6th to
        10th, budget and GPF bills from the 11th to 15th, and regular salaries and pensions
        from the 16th to 25th. Following the right window helps your bill reach the Treasury
        in good order and supports timely processing.
      </p>
    </ArticleLayout>
  )
}
