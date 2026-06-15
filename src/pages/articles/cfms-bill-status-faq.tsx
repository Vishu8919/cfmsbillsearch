// src/pages/articles/cfms-bill-status-faq.tsx
import Head from 'next/head'
import Link from 'next/link'
import ArticleLayout from '../../components/ArticleLayout'

const faqs: { q: string; a: string }[] = [
  {
    q: 'What is a CFMS bill number?',
    a: "A CFMS bill number identifies a single bill in the Andhra Pradesh treasury system. It has two parts — the financial year and a serial number — usually written like 2026-2575612, where 2026 is the year and 2575612 is the unique number for that year.",
  },
  {
    q: 'How do I check my CFMS bill status?',
    a: "Use the bill status checker on this site: enter the full bill number, or the year and number separately, and the official CFMS status page opens directly. You only need the bill number — no login is required to check a status.",
  },
  {
    q: 'Do I need to log in to check a bill status?',
    a: "No. Checking a single bill status only needs the bill number. Logging in is optional and unlocks extra features such as checking up to 30 bills at once and syncing your search history across devices.",
  },
  {
    q: 'Where can I find my bill number?',
    a: "Your DDO or office accounts/establishment section maintains the bill register and can give you the number. It may also appear on the submission acknowledgement or in any SMS you received about the bill.",
  },
  {
    q: 'What does "Pending" mean?',
    a: "Pending means the bill is still being checked by a verifying officer at the treasury or PAO. It is the normal status during processing. Wait and check again rather than resubmitting.",
  },
  {
    q: 'What does "Passed" mean?',
    a: "Passed means the bill has cleared all verification and the payment is approved. The release of funds is the next step and usually follows shortly after.",
  },
  {
    q: 'My bill is "Passed" but I haven\'t received the money. Why?',
    a: "There is normally a short gap between a bill being passed and the payment actually being released to the bank. This is common, especially during busy month-end and year-end periods, and usually resolves within a day or two.",
  },
  {
    q: 'What is the difference between Returned and Rejected?',
    a: "A returned bill has a correctable problem and is sent back to the DDO to fix and resubmit — it stays alive. A rejected bill is refused and usually has to be raised again from scratch after the underlying issue is fixed.",
  },
  {
    q: 'What does "Payment Released" mean?',
    a: "Payment Released means the treasury has disbursed the funds and the amount is on its way to, or already credited in, the beneficiary's bank account. Check the bank account within a day or two.",
  },
  {
    q: 'What does the "Pending At" field mean on an approved bill?',
    a: "On an approved bill, the 'Pending At' field usually reflects the last desk that handled it rather than an outstanding objection. If the main status says Passed or Released, the bill is progressing normally.",
  },
  {
    q: 'How long does a CFMS bill take to process?',
    a: "There is no fixed timeline; it depends on the bill type, budget position, and treasury workload. Routine salary bills often clear within a few working days, while month-end and March year-end periods are slower due to high volume.",
  },
  {
    q: 'Why was my bill rejected?',
    a: "Common reasons include a wrong budget head, exhausted or lapsed allotment, missing documents, incorrect beneficiary bank details, duplicate claims, or calculation errors. Your DDO can see the recorded reason and prepare a corrected bill.",
  },
  {
    q: 'Can I check more than one bill at a time?',
    a: "Yes. After logging in, the bulk-check feature lets you paste up to 30 bill numbers and retrieve all their statuses together, and save them as named batches to re-check later.",
  },
  {
    q: 'Is my search history saved?',
    a: "Yes. Bills you look up are saved so you can re-open them in one tap. You can rename and delete entries. When logged in, your history syncs to your account and is available on any device.",
  },
  {
    q: 'Is this the official CFMS website?',
    a: "No. This is a free, unofficial helper tool that provides a simpler way to reach the official AP CFMS bill status page. It is not affiliated with or endorsed by the Andhra Pradesh government or APCFSS. All status data comes from the official portal (prdcfms.apcfss.in).",
  },
  {
    q: 'The CFMS portal page won\'t open. What should I do?',
    a: "The official portal occasionally undergoes maintenance or is slow during peak hours. Your bill number is still valid — wait a little while and try again.",
  },
  {
    q: 'It says "No data found" but my bill number is correct. Why?',
    a: "Check that the year and serial parts are not swapped and that there are no extra spaces. A freshly submitted bill can also take a little time to appear in the system.",
  },
  {
    q: 'Who do I contact about a delayed payment?',
    a: "Start with your DDO or the office accounts/establishment section. They have access to the full bill details in CFMS and can tell you the exact reason and next step.",
  },
  {
    q: 'What is a DDO?',
    a: "A Drawing and Disbursing Officer is the official authorised to draw funds from the treasury on behalf of an office and disburse them. In CFMS, all of an office's bills are raised and tracked under the DDO.",
  },
  {
    q: 'What is the difference between CFMS, APCFSS and the treasury?',
    a: "CFMS is the software system that manages government finances, APCFSS is the organisation that runs and maintains it, and the treasury is the government function that verifies bills and releases payments using CFMS.",
  },
  {
    q: 'Does it cost anything to check a bill status?',
    a: "No. Checking your CFMS bill status with this tool is completely free.",
  },
  {
    q: 'Can I check a bill from any device?',
    a: "Yes. The checker works on phones, tablets and computers. If you log in, your saved bills and history are available across all your devices.",
  },
]

export default function CfmsBillStatusFaq() {
  return (
    <>
      <Head>
        {/* FAQPage structured data — eligible for rich results in Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />
      </Head>
      <ArticleLayout
        title="CFMS Bill Status FAQ: 22 Common Questions Answered"
        description="Answers to the most common questions about Andhra Pradesh CFMS bill status — what each status means, why bills get delayed or rejected, how to check multiple bills, and more."
        canonicalPath="/articles/cfms-bill-status-faq"
        subtitle="Quick, clear answers to the questions people ask most about checking and understanding CFMS bills in Andhra Pradesh."
        readingTime="8 min read"
      >
        <p>
          Below are answers to the questions we see most often about CFMS bills, payment
          statuses, and how to track them. If you are new to the system, the{' '}
          <Link href="/articles/cfms-guide-for-employees">complete CFMS guide for employees</Link>{' '}
          and the explainer on{' '}
          <Link href="/articles/cfms-bill-status-meaning">what each bill status means</Link> are
          good places to start.
        </p>

        {faqs.map((f, i) => (
          <div key={i}>
            <h2>{f.q}</h2>
            <p>{f.a}</p>
          </div>
        ))}

        <h2>Still have a question?</h2>
        <p>
          If your question isn&#39;t answered here, the best people to help with anything about a
          specific bill are your DDO and the office accounts section, who can see the full
          details inside CFMS. For general feedback about this site, see our{' '}
          <Link href="/contact">contact page</Link>.
        </p>
      </ArticleLayout>
    </>
  )
}
