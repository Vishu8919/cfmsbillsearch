// src/pages/articles/cfms-object-heads-list.tsx
import ArticleLayout from '../../components/ArticleLayout'
import Link from 'next/link'

// Object Head groups from G.O. MS No. 69, Dt. 14.08.2019 (Annexure I).
// Each group is a Detailed Head (DH) with its Sub-Detailed Heads (SDH).
const objectHeadGroups: { code: string; name: string; items: { code: string; desc: string }[] }[] = [
  {
    code: '010', name: 'Salaries', items: [
      { code: '011', desc: 'Pay' },
      { code: '012', desc: 'Allowances' },
      { code: '013', desc: 'Dearness Allowance' },
      { code: '014', desc: 'Sumptuary Allowance' },
      { code: '015', desc: 'Interim Relief' },
      { code: '016', desc: 'House Rent Allowance' },
      { code: '017', desc: 'Medical Reimbursement' },
      { code: '018', desc: 'Encashment of Earned Leave' },
      { code: '019', desc: 'Leave Travel Concession' },
    ],
  },
  {
    code: '020', name: 'Wages', items: [
      { code: '021', desc: 'Part Time Contingent Employees' },
      { code: '022', desc: 'Full Time Contingent Employees' },
      { code: '023', desc: 'Daily Wage Employees' },
      { code: '024', desc: 'Hourly Wage Employees' },
    ],
  },
  {
    code: '030', name: 'Overtime Allowance', items: [
      { code: '031', desc: 'Overtime Allowance' },
      { code: '032', desc: 'Night Duty Allowance' },
    ],
  },
  {
    code: '040', name: 'Pensionary Charges', items: [
      { code: '041', desc: 'Pensions' },
      { code: '042', desc: 'Gratuities' },
      { code: '043', desc: 'Medical Reimbursement' },
    ],
  },
  {
    code: '050', name: 'Rewards', items: [
      { code: '051', desc: 'Rewards' },
      { code: '052', desc: 'Awards' },
      { code: '053', desc: 'Trophies / Mementoes' },
    ],
  },
  {
    code: '060', name: 'GIA Salaries', items: [
      { code: '061', desc: 'GIA Pay' },
      { code: '062', desc: 'GIA Allowances' },
      { code: '063', desc: 'GIA Dearness Allowance' },
      { code: '065', desc: 'GIA Interim Relief' },
      { code: '066', desc: 'GIA House Rent Allowance' },
      { code: '067', desc: 'GIA Medical Reimbursement' },
      { code: '068', desc: 'GIA Encashment of Earned Leave' },
      { code: '069', desc: 'GIA Leave Travel Concession' },
    ],
  },
  {
    code: '070', name: 'Work Charged Establishment Salaries', items: [
      { code: '071', desc: 'WC Pay' },
      { code: '072', desc: 'WC Allowances' },
      { code: '073', desc: 'WC Dearness Allowance' },
      { code: '075', desc: 'WC Interim Relief' },
      { code: '076', desc: 'WC House Rent Allowance' },
      { code: '077', desc: 'WC Medical Reimbursement' },
      { code: '078', desc: 'WC Encashment of Earned Leave' },
    ],
  },
  {
    code: '090', name: 'Arrear Pensions', items: [
      { code: '091', desc: 'Arrear Pension' },
      { code: '093', desc: 'Arrear DA' },
      { code: '094', desc: 'Arrear IR' },
    ],
  },
  {
    code: '100', name: 'Arrear Salaries', items: [
      { code: '101', desc: 'Arrear Pay' },
      { code: '102', desc: 'Arrear Allowance' },
      { code: '103', desc: 'Arrear DA' },
      { code: '105', desc: 'IR Arrear' },
      { code: '106', desc: 'Arrear HRA' },
    ],
  },
  {
    code: '110', name: 'Domestic Travel Expenses', items: [
      { code: '111', desc: 'Travelling Allowance' },
      { code: '112', desc: 'Bus Warrants' },
      { code: '113', desc: 'T.A./D.A. to Non-Official Members' },
      { code: '114', desc: 'Fixed Travelling Allowance' },
      { code: '115', desc: 'Conveyance Allowance' },
      { code: '116', desc: 'TA/DA to Work Charged Employees' },
    ],
  },
  {
    code: '120', name: 'Foreign Travel Expenses', items: [
      { code: '121', desc: 'Foreign Travel Expenses' },
      { code: '122', desc: 'Foreign Travel TA/DA to Non-official Members' },
    ],
  },
  {
    code: '130', name: 'Office Expenses', items: [
      { code: '131', desc: 'Service Postage and Telephone' },
      { code: '133', desc: 'Water and Electricity Charges' },
      { code: '134', desc: 'Hiring of Private Vehicles' },
      { code: '135', desc: 'OE – Consumables / Stationery' },
      { code: '136', desc: 'OE – Maintenance / Minor Repairs' },
      { code: '137', desc: 'OE – Administrative Expenses' },
      { code: '138', desc: 'OE – Internet Charges' },
      { code: '139', desc: 'OE – Mobile Services / Call Charges' },
    ],
  },
  {
    code: '140', name: 'Rents, Rates and Taxes', items: [
      { code: '141', desc: 'Rents, Rates and Taxes' },
    ],
  },
  {
    code: '150', name: 'Royalty', items: [
      { code: '151', desc: 'Royalty' },
    ],
  },
  {
    code: '160', name: 'Publications', items: [
      { code: '161', desc: 'Publications' },
      { code: '162', desc: 'Purchase of Books, Magazines and Periodicals' },
    ],
  },
  {
    code: '170', name: 'Training', items: [
      { code: '171', desc: 'Training / Course Fees' },
      { code: '172', desc: 'Training Expenses – Employees' },
      { code: '173', desc: 'Honorarium to Trainers / Payment to Trainers' },
      { code: '174', desc: 'Meetings / Workshops Expenses' },
      { code: '175', desc: 'Departmental Training Programs to Employees' },
      { code: '176', desc: 'Departmental Training Programs to Non-employees' },
      { code: '177', desc: 'Exposure Visits' },
    ],
  },
  {
    code: '200', name: 'Other Administrative Expenses', items: [
      { code: '201', desc: 'Conferences, Seminars' },
      { code: '202', desc: 'Functions & Events' },
      { code: '203', desc: 'Hospitality & Entertainment' },
      { code: '204', desc: 'Protocol Expenses for Dignitaries' },
      { code: '205', desc: 'Accommodation & Travel (Non-employees)' },
      { code: '206', desc: 'Investigation Expenses' },
      { code: '207', desc: 'Medical Expenses (Non-Employees)' },
    ],
  },
  {
    code: '210', name: 'Supplies and Materials', items: [
      { code: '211', desc: 'Materials and Supplies' },
      { code: '212', desc: 'Drugs and Medicines' },
      { code: '213', desc: 'Purchase of Office Hardware & Peripherals' },
      { code: '214', desc: 'Fee of Software Licenses' },
      { code: '215', desc: 'AMC Charges – Hardware' },
      { code: '216', desc: 'AMC Charges – Software' },
      { code: '217', desc: 'Purchase of Furniture & Fixtures' },
      { code: '218', desc: 'Transportation of Materials' },
      { code: '219', desc: 'Software Development' },
    ],
  },
  {
    code: '220', name: 'Arms and Ammunition', items: [
      { code: '221', desc: 'Arms and Ammunition' },
    ],
  },
  {
    code: '230', name: 'Cost of Ration / Diet Charges', items: [
      { code: '231', desc: 'Diet Charges' },
      { code: '232', desc: 'Cooking Charges' },
      { code: '233', desc: 'Ration Charges' },
      { code: '234', desc: 'Cook-cum-Helpers' },
    ],
  },
  {
    code: '240', name: 'Petrol, Oil and Lubricants', items: [
      { code: '241', desc: 'Charges towards Office Vehicles' },
      { code: '242', desc: 'Charges towards Other purposes' },
    ],
  },
  {
    code: '250', name: 'Clothing, Tentage and Store', items: [
      { code: '251', desc: 'Clothing' },
      { code: '252', desc: 'Providing Uniforms' },
      { code: '253', desc: 'Stitching Charges' },
      { code: '254', desc: 'Shoes & Socks' },
      { code: '255', desc: 'Tentage Charges' },
      { code: '256', desc: 'Store Charges' },
    ],
  },
  {
    code: '260', name: 'Advertisements, Sales and Publicity Expenses', items: [
      { code: '261', desc: 'Advertisements – Print Media' },
      { code: '262', desc: 'Advertisements – Electronic Media' },
      { code: '263', desc: 'Outdoor Advertisements' },
      { code: '264', desc: 'Sponsorships / Publicity' },
      { code: '265', desc: 'Promotional Expenses' },
      { code: '266', desc: 'Trade Fairs' },
    ],
  },
  {
    code: '270', name: 'Minor Works', items: [
      { code: '271', desc: 'Minor Works' },
      { code: '272', desc: 'Maintenance' },
      { code: '274', desc: 'H.T.C.C Charges' },
      { code: '275', desc: 'Buildings' },
      { code: '278', desc: 'Emergency Repairs' },
    ],
  },
  {
    code: '280', name: 'Professional Services', items: [
      { code: '281', desc: 'Pleaders Fees' },
      { code: '282', desc: 'Payments to Home Guards' },
      { code: '283', desc: 'Payments to Anganwadi Workers' },
      { code: '285', desc: 'Sanitation Workers' },
      { code: '286', desc: "Honorarium to V.R.A's" },
      { code: '287', desc: 'Payments to Direct Individual Professionals' },
      { code: '288', desc: 'Individual Professionals engaged – 3rd party' },
      { code: '289', desc: 'Service Based Professional Services' },
      { code: '290', desc: 'Other Professional Services' },
      { code: '291', desc: 'Payments to Asha Workers' },
      { code: '292', desc: 'Payments to Archakas' },
      { code: '293', desc: 'Payments to Village Volunteers' },
      { code: '294', desc: 'Payments to Ward Volunteers' },
      { code: '295', desc: 'Payments to Tribal Community Health Workers' },
      { code: '296', desc: 'Payments to Gopalmitras' },
      { code: '297', desc: 'Honorarium / Lump sum Salary to Nominated Posts / Advisors' },
    ],
  },
  {
    code: '300', name: 'Other Contractual Services', items: [
      { code: '301', desc: 'Individual Contract Employees' },
      { code: '302', desc: 'Outsourcing Employees through agencies' },
      { code: '303', desc: 'TA/DA to Contract Employees' },
      { code: '304', desc: 'Contract Services through 3rd party firms' },
    ],
  },
  {
    code: '310', name: 'Grants-in-Aid', items: [
      { code: '311', desc: 'Grants-in-Aid towards Salaries' },
      { code: '312', desc: 'Other Grants-in-Aid' },
      { code: '313', desc: 'Per-capita Grants' },
      { code: '314', desc: 'Seigniorage Grants' },
      { code: '315', desc: 'TA/DA to GIA Employees' },
      { code: '316', desc: 'Payments to Beneficiaries in Calamities / Notified Events' },
      { code: '317', desc: 'Ex-gratia Payments (Accidental Death / Compassionate Appointments)' },
      { code: '318', desc: 'Obsequies Charges' },
      { code: '319', desc: 'Grants for Creation of Capital Assets' },
    ],
  },
  {
    code: '320', name: 'Contributions', items: [
      { code: '321', desc: 'Contributions towards CPS' },
      { code: '322', desc: 'Contributions towards EHS' },
      { code: '323', desc: 'Other Contributions' },
    ],
  },
  {
    code: '330', name: 'Subsidies', items: [
      { code: '331', desc: 'Subsidies to Individual Beneficiaries' },
      { code: '332', desc: 'Subsidies to Organizations' },
      { code: '333', desc: 'Incentives to Individual Beneficiaries' },
      { code: '334', desc: 'Incentives to Organizations / Industries' },
    ],
  },
  {
    code: '340', name: 'Scholarships and Stipends', items: [
      { code: '341', desc: 'Maintenance Fees (MTF)' },
      { code: '342', desc: 'Reimbursement of Tuition Fees (RTF)' },
      { code: '343', desc: 'Stipends' },
      { code: '344', desc: 'Other Scholarships' },
    ],
  },
  {
    code: '350', name: 'Scheme / Project based Assistance', items: [
      { code: '351', desc: 'EAP – Organizations' },
      { code: '352', desc: 'EAP – Beneficiaries' },
      { code: '353', desc: 'Payment to WUA – Para Workers' },
      { code: '354', desc: '3rd Party Consultancy Works' },
      { code: '355', desc: 'Training and Exposure Visits' },
    ],
  },
  {
    code: '360', name: 'Fees, Fines & Refunds', items: [
      { code: '361', desc: 'Accreditation Fees' },
      { code: '362', desc: 'Fees paid for Services' },
      { code: '363', desc: 'Fines' },
      { code: '364', desc: 'Refunds' },
    ],
  },
  {
    code: '410', name: 'Secret Services Expenditure', items: [
      { code: '411', desc: 'Secret Services Expenditure' },
    ],
  },
  {
    code: '430', name: 'Suspense', items: [
      { code: '431', desc: 'Purchases – Dr.' },
      { code: '432', desc: 'Stock – Dr.' },
      { code: '433', desc: 'Miscellaneous P.W. Advances – Dr.' },
      { code: '434', desc: 'Workshop Suspense – Dr.' },
    ],
  },
  {
    code: '450', name: 'Interest', items: [
      { code: '451', desc: 'Interest towards OMB' },
      { code: '452', desc: 'Interest towards NABARD' },
      { code: '453', desc: 'Interest towards EAP' },
      { code: '454', desc: 'Interest towards REC / PFC' },
      { code: '455', desc: 'Interest towards NCDC' },
      { code: '456', desc: 'Other Interest Payments' },
    ],
  },
  {
    code: '500', name: 'Other Charges', items: [
      { code: '501', desc: 'Compensation (Non – R&R)' },
      { code: '502', desc: 'R&R Cash Benefits' },
      { code: '504', desc: 'Cosmetic Charges' },
    ],
  },
  {
    code: '510', name: 'Motor Vehicles', items: [
      { code: '511', desc: 'Maintenance of Office Vehicles' },
      { code: '512', desc: 'Purchase of Motor Vehicles' },
    ],
  },
  {
    code: '520', name: 'Machinery and Equipment', items: [
      { code: '521', desc: 'Purchase of Machinery & Equipment' },
      { code: '522', desc: 'Purchase of Tools & Plants' },
      { code: '523', desc: 'Repairs & Maintenance to Machinery & Equipment' },
    ],
  },
  {
    code: '530', name: 'Major Works', items: [
      { code: '531', desc: 'Major Works' },
      { code: '532', desc: 'Lands (Non R&R)' },
      { code: '533', desc: 'Buildings' },
      { code: '534', desc: 'Price Adjustment' },
      { code: '535', desc: 'R&R Works' },
      { code: '536', desc: 'Land Acquisition for R&R Works' },
    ],
  },
  {
    code: '540', name: 'Investments', items: [
      { code: '541', desc: 'Investments' },
    ],
  },
  {
    code: '560', name: 'Repayment of Borrowings', items: [
      { code: '561', desc: 'Repayment of Borrowings' },
    ],
  },
  {
    code: '630', name: 'Inter Account Transfers', items: [
      { code: '631', desc: 'Inter Account Transfers' },
    ],
  },
  {
    code: '640', name: 'Write Off and Losses', items: [
      { code: '641', desc: 'Write Off' },
      { code: '642', desc: 'Losses' },
    ],
  },
  {
    code: '700', name: 'Deduct – Recoveries', items: [
      { code: '701', desc: 'Receipts and Recoveries on Capital Account' },
      { code: '702', desc: 'Receipts and Recoveries due on Tools and Plants' },
      { code: '703', desc: 'Suspense Credits' },
      { code: '704', desc: 'Purchases – Cr.' },
      { code: '705', desc: 'Stock – Cr.' },
      { code: '706', desc: 'Miscellaneous P.W. Advances – Cr.' },
      { code: '707', desc: 'Workshop Suspense – Cr.' },
      { code: '711', desc: 'Karnataka Share' },
      { code: '732', desc: 'Deduct – Share recovered from Karnataka Electricity Board' },
      { code: '733', desc: 'Deduct – Royalty recovered from Karnataka Electricity Board' },
    ],
  },
  {
    code: '800', name: 'User Charges', items: [
      { code: '802', desc: 'User Charges – Transport Facility' },
      { code: '803', desc: 'User Charges – Travelling Allowance' },
      { code: '804', desc: 'User Charges – Utility Payments' },
      { code: '806', desc: 'User Charges – Advertisements, Sales and Publicity Expenses' },
      { code: '807', desc: 'User Charges – Maintenance' },
      { code: '811', desc: 'User Charges – Materials & Supplies' },
      { code: '812', desc: 'User Charges – Petrol, Oil & Lubricants' },
      { code: '814', desc: 'User Charges – Purchases' },
      { code: '815', desc: 'User Charges – IT Related Purchases' },
      { code: '816', desc: 'User Charges – IT Related Services' },
    ],
  },
]

const withdrawnHeads: { dh: string; sdh: string; desc: string }[] = [
  { dh: '130 – Office Expenses', sdh: '132', desc: 'Other Office Expenses' },
  { dh: '270 – Minor Works', sdh: '273', desc: 'Work Charged Establishment' },
  { dh: '280 – Professional Services', sdh: '284', desc: 'Other Professional Services' },
  { dh: '500 – Other Charges', sdh: '503', desc: 'Other Expenditure' },
  { dh: '530 – Major Works', sdh: '534', desc: 'Work Charged Establishment' },
  { dh: '800 – User Charges', sdh: '801', desc: 'Other Expenditure' },
  { dh: '800 – User Charges', sdh: '805', desc: 'Other Office Expenses' },
  { dh: '800 – User Charges', sdh: '808', desc: 'Other Payments' },
  { dh: 'All', sdh: '000', desc: 'Not Applicable' },
]

export default function CfmsObjectHeadsList() {
  return (
    <ArticleLayout
      title="CFMS Object Heads List (Detailed & Sub-Detailed Heads of Account)"
      description="The complete list of CFMS Object Heads — Detailed Heads (DH) and Sub-Detailed Heads (SDH) — used in Andhra Pradesh government accounts, based on G.O. MS No. 69 dated 14.08.2019, with the Head of Account structure explained."
      canonicalPath="/articles/cfms-object-heads-list"
      subtitle="Every expenditure code used in AP government bills — from 011 Pay to 312 Other Grants-in-Aid — in one searchable reference, with an explanation of how the Head of Account works."
      readingTime="12 min read"
    >
      <p>
        Every bill processed in the Andhra Pradesh CFMS system is recorded against a specific
        <strong> Object Head</strong> — a numeric code that says exactly what the money is
        being spent on, such as salary, travelling allowance, office expenses, or
        grants-in-aid. For DDOs, accounts staff, and anyone preparing or scrutinising bills,
        knowing the correct Object Head is essential, because the wrong code is one of the
        most common reasons a bill is objected to or rejected.
      </p>
      <p>
        This page explains the structure of the Head of Account, what Object Heads are, and
        provides the complete list of Detailed Heads (DH) and Sub-Detailed Heads (SDH) as
        standardised by the Government of Andhra Pradesh.
      </p>

      <div className="note">
        <strong>Source:</strong> This reference is based on the revised list of Object Heads
        notified in <strong>G.O. MS No. 69, Finance (Budget-I) Department, dated 14.08.2019</strong>,
        which standardised Object Heads for adoption in the State Government accounts. Codes
        and rules may be updated by later correction slips and orders — always confirm the
        current position through official channels for live bill work.
      </div>

      <h2>What is a Head of Account?</h2>
      <p>
        The Andhra Pradesh government classifies every financial transaction using a
        structured <strong>seven-tier Head of Account (HOA)</strong>. This structure makes
        it possible to record, control, and report on government spending in a consistent
        way, from the broad function right down to the specific item of expenditure. The
        seven tiers are:
      </p>
      <ol>
        <li><strong>Major Head (MH)</strong> — the main function of government, shown as a four-digit code.</li>
        <li><strong>Sub-Major Head (SMH)</strong> — a distinct sub-division of a major head, a two-digit code.</li>
        <li><strong>Minor Head</strong> — a specific programme under a major or sub-major head, a three-digit code.</li>
        <li><strong>Group Sub-Head (GSH)</strong> — a group of similar schemes under a common funding pattern, a two-digit code.</li>
        <li><strong>Sub-Head (SH)</strong> — a scheme or administrative set-up, a two-digit code.</li>
        <li><strong>Detailed Head (DH)</strong> — the object of expenditure, a three-digit code.</li>
        <li><strong>Sub-Detailed Head (SDH)</strong> — a further break-up of the detailed head, a three-digit code.</li>
      </ol>
      <p>
        The sixth and seventh tiers together — the Detailed Head and Sub-Detailed Head — are
        what is collectively known as the <strong>Object Head</strong>. It is the lowest unit
        of classification and is the primary unit of appropriation for the demands for grants.
      </p>

      <h2>What is an Object Head?</h2>
      <p>
        An Object Head indicates the <em>object</em> or <em>nature</em> of expenditure — what
        the money is actually being used for, in terms of inputs such as Salaries, Office
        Expenses, Grants-in-Aid, Loans, or Investments. By recording every transaction
        against an Object Head, the government can exercise itemised control over spending
        and understand exactly how funds are used across a scheme, activity, or organisation.
      </p>
      <p>
        For example, under the Detailed Head <code>010 Salaries</code> you will find
        Sub-Detailed Heads like <code>011 Pay</code>, <code>013 Dearness Allowance</code>,
        and <code>016 House Rent Allowance</code>. Each of these is a precise category of
        salary-related expenditure.
      </p>

      <h2>How to read the codes</h2>
      <p>
        In the list below, each <strong>bold three-digit code</strong> is a Detailed Head
        (the group), and the codes under it are its Sub-Detailed Heads (the specific items).
        When preparing a bill, you select the Sub-Detailed Head that matches the exact nature
        of the expenditure.
      </p>

      <h2>Complete list of CFMS Object Heads</h2>
      <p>
        The following is the standardised list of Detailed Heads and Sub-Detailed Heads of
        account used in Andhra Pradesh government expenditure.
      </p>

      {objectHeadGroups.map((group) => (
        <div key={group.code} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>
            {group.code} — {group.name}
          </h3>
          <table>
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Code</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((item) => (
                <tr key={item.code}>
                  <td><code>{item.code}</code></td>
                  <td>{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <h2>Object Heads that were withdrawn</h2>
      <p>
        As part of the same standardisation, certain Detailed/Sub-Detailed Head combinations
        were withdrawn and blocked from further use. Expenditure should not be booked against
        these codes:
      </p>
      <table>
        <thead>
          <tr>
            <th>Detailed Head</th>
            <th>SDH</th>
            <th>Withdrawn Description</th>
          </tr>
        </thead>
        <tbody>
          {withdrawnHeads.map((w, i) => (
            <tr key={i}>
              <td>{w.dh}</td>
              <td><code>{w.sdh}</code></td>
              <td>{w.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Why the correct Object Head matters</h2>
      <p>
        Choosing the right Object Head is not just a formality. The treasury and PAO scrutinise
        bills against the Object Head, and a mismatch between the nature of expenditure and the
        code used is a frequent cause of objections and rejections. Using a withdrawn code, or
        a code that does not match the sanction, will hold up the bill. If you frequently face
        returns, our guide on{' '}
        <Link href="/articles/why-cfms-bill-rejected">why CFMS bills get rejected and how to fix them</Link>{' '}
        covers this and other common issues.
      </p>

      <h2>Related guidance</h2>
      <p>
        Object Heads tell you <em>what</em> a bill is for. Two other things determine whether
        it gets paid smoothly: submitting it within the correct window, and understanding its
        status afterwards. See the{' '}
        <Link href="/articles/cfms-bill-submission-schedule">CFMS bill submission schedule</Link>{' '}
        for the dates different bills must be presented, and{' '}
        <Link href="/articles/cfms-bill-status-meaning">what each CFMS bill status means</Link> to
        track a bill once it is submitted.
      </p>

      <h2>Summary</h2>
      <p>
        Object Heads are the foundation of how Andhra Pradesh classifies and controls
        government spending. The Detailed Head and Sub-Detailed Head together form the lowest
        unit of the seven-tier Head of Account, and picking the correct one is essential for a
        bill to pass scrutiny. Bookmark this page as a quick reference whenever you need to
        confirm an expenditure code.
      </p>
    </ArticleLayout>
  )
}
