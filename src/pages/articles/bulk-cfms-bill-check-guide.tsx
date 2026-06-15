// src/pages/articles/bulk-cfms-bill-check-guide.tsx
import ArticleLayout from '../../components/ArticleLayout'
import Link from 'next/link'

export default function BulkCfmsBillCheckGuide() {
  return (
    <ArticleLayout
      title="How to Check Multiple CFMS Bills at Once (Bulk Bill Checker Guide)"
      description="A complete guide to the bulk CFMS bill status checker — check up to 30 Andhra Pradesh treasury bills at once, see payment details and where each bill is pending, export to CSV, and save batches to re-run later."
      canonicalPath="/articles/bulk-cfms-bill-check-guide"
      subtitle="Checking bills one at a time is slow when you have dozens to track. The bulk checker lets DDOs and office staff look up as many as 30 bills together and get a full status report in one go."
      readingTime="7 min read"
    >
      <p>
        For a Drawing and Disbursing Officer (DDO) or an office accounts section, tracking
        bills one number at a time is tedious — especially around salary time, when you may
        have dozens of bills in flight at once. The <strong>bulk bill checker</strong> on this
        site solves that: paste up to 30 bill numbers, run them together, and get a complete
        status report for every bill in a single view, with the option to export everything to
        a spreadsheet and save the set to re-run later.
      </p>
      <p>
        This guide explains what the bulk checker does, how to use it step by step, and how to
        read the results.
      </p>

      <div className="note">
        <strong>Login required.</strong> Bulk checking is an account feature. You will need to{' '}
        <Link href="/register">create a free account</Link> (or{' '}
        <Link href="/login">log in</Link>) to use it. Single bill lookups on the{' '}
        <Link href="/">home page</Link> do not require an account.
      </div>

      <h2>What the bulk checker does</h2>
      <p>
        Instead of opening the CFMS portal once per bill, the bulk checker takes a whole list
        of bill numbers and retrieves the status of each one for you. For every bill, it
        reports:
      </p>
      <ul>
        <li>A clear <strong>verdict</strong> — for example Paid, Approved · Payment Pending, In Process, Rejected, or Returned</li>
        <li>The detailed <strong>bill status</strong></li>
        <li>The <strong>net amount</strong> of the bill</li>
        <li>The <strong>beneficiary</strong> name</li>
        <li><strong>Where the bill is pending</strong> and what action is pending there</li>
        <li><strong>Payment details</strong> — payment status, reference, and date where available</li>
      </ul>
      <p>
        Everything is shown together so you can see, at a glance, which bills are paid, which
        are still moving, and which need attention.
      </p>

      <h2>Step-by-step: how to use it</h2>
      <ol>
        <li>
          Log in to your account and open <strong>Check Multiple Bills at Once</strong> from
          the home page (or go to the bulk-check page directly).
        </li>
        <li>
          Enter your <strong>CFMS username and password</strong>. These are your official
          CFMS portal credentials — they are used only to fetch your bill statuses for this
          check.
        </li>
        <li>
          <strong>Paste your bill numbers</strong>, one per line, into the bills box. You can
          paste up to 30 at a time. You may also keep a short description on the same line as
          a bill — it will be carried through to the results so you can tell bills apart.
        </li>
        <li>
          Optionally give the batch a <strong>name</strong> (for example &quot;April Salary Bills&quot;
          or &quot;TA Claims&quot;) so you can find and re-run it later.
        </li>
        <li>
          Press <strong>Check All Bills</strong>. A progress indicator runs while the bills
          are being looked up.
        </li>
        <li>
          Review the results for every bill, then <strong>export to CSV</strong> if you want a
          spreadsheet copy.
        </li>
      </ol>

      <div className="warn">
        <strong>A note on your credentials:</strong> the bulk check uses your CFMS username and
        password to retrieve your bills, exactly as logging into the portal yourself would.
        Treat your credentials carefully and only ever enter them on pages you trust. For how
        data is handled on this site, see our{' '}
        <Link href="/privacy-policy">Privacy Policy</Link>.
      </div>

      <h2>Understanding the verdicts</h2>
      <p>
        Each bill is given a short verdict so you can scan the list quickly. The main ones mean:
      </p>
      <table>
        <thead>
          <tr>
            <th>Verdict</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Paid</strong></td>
            <td>The bill has been paid — funds released to the beneficiary.</td>
          </tr>
          <tr>
            <td><strong>Approved · Payment Pending</strong></td>
            <td>The bill is approved and is awaiting the payment release step.</td>
          </tr>
          <tr>
            <td><strong>In Process</strong></td>
            <td>The bill is still being processed in the system.</td>
          </tr>
          <tr>
            <td><strong>At ATO / Sub Treasury / Auditor / Executive Engineer</strong></td>
            <td>The bill is currently sitting with that authority for action.</td>
          </tr>
          <tr>
            <td><strong>Rejected</strong></td>
            <td>The bill was refused and usually needs to be raised again.</td>
          </tr>
          <tr>
            <td><strong>Returned</strong></td>
            <td>The bill was sent back for a correction.</td>
          </tr>
        </tbody>
      </table>
      <p>
        For a fuller explanation of what these statuses mean and what to do next, see{' '}
        <Link href="/articles/cfms-bill-status-meaning">what each CFMS bill status means</Link>.
      </p>

      <h2>Saving and re-running batches</h2>
      <p>
        This is what makes the bulk checker especially useful for repeated work. Every batch
        you run is <strong>saved automatically</strong> and appears in your batches list (the
        history button). From there you can:
      </p>
      <ul>
        <li><strong>Re-run</strong> a batch — look up the same set of bills again in one click to see what has changed.</li>
        <li><strong>Load only</strong> — bring the bill numbers back into the box without running them, so you can edit the list first.</li>
        <li><strong>Rename</strong> a batch to keep your lists organised.</li>
        <li><strong>Delete</strong> batches you no longer need.</li>
      </ul>
      <p>
        Because batches are tied to your account, they are available whenever you log in. The
        last run&#39;s summary is shown on each saved batch, so you can see at a glance how that
        set of bills was doing the last time you checked.
      </p>

      <h2>Exporting to CSV</h2>
      <p>
        After a run, the <strong>Export CSV</strong> option downloads a spreadsheet containing
        every bill and all its details — bill number, description, verdict, status, where it is
        pending, net amount, beneficiary, and payment information. This is handy for sharing an
        update, keeping office records, or reconciling a list of bills offline.
      </p>

      <h2>Tips for getting the most out of bulk checking</h2>
      <ul>
        <li>
          Group bills into meaningful batches — for example by type (&quot;Salary Bills&quot;,
          &quot;Contingent Bills&quot;) or by month — so re-running them later is quick and clear.
        </li>
        <li>
          Keep batches at or under 30 bills. If you have more, split them into a couple of
          batches.
        </li>
        <li>
          Add short descriptions on each line so the results and the exported CSV are easy to
          read.
        </li>
        <li>
          Re-run a saved batch periodically rather than re-entering numbers — it is the fastest
          way to track progress over days.
        </li>
      </ul>

      <h2>How this fits with the rest of your workflow</h2>
      <p>
        Bulk checking tells you where many bills stand at once. To keep those bills moving in
        the first place, it helps to submit them in the right window and use the correct
        expenditure codes. See the{' '}
        <Link href="/articles/cfms-bill-submission-schedule">CFMS bill submission schedule</Link>{' '}
        for submission dates, the{' '}
        <Link href="/articles/cfms-object-heads-list">CFMS Object Heads list</Link> for expenditure
        codes, and the{' '}
        <Link href="/articles/cfms-guide-for-ddos">CFMS guide for DDOs</Link> for handling bills
        efficiently.
      </p>

      <h2>Summary</h2>
      <p>
        The bulk bill checker turns a slow, one-by-one task into a single action: paste up to
        30 bills, run them together, read a complete status report, export it, and save the
        batch to re-run whenever you like. For DDOs and accounts staff tracking many bills, it
        is the fastest way to stay on top of payments.
      </p>
    </ArticleLayout>
  )
}
