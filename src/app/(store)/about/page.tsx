import Link from "next/link";
import { PARENT_COMPANY, PARENT_COMPANY_URL, SITE_NAME } from "@/lib/constants";

export default function AboutPage() {
  return (
    <div className="container-page py-12">
      <h1 className="section-title">About {SITE_NAME}</h1>
      <div className="prose-store mt-8 max-w-3xl space-y-4">
        <p>
          {SITE_NAME} delivers professional two-way radio and communication
          solutions for businesses across hospitality, retail, healthcare,
          education, construction, security, and public safety. We offer a
          complete range of digital radios, accessories, expert programming, and
          nationwide sales and support.
        </p>
        <p>
          {SITE_NAME} is a sister concern of{" "}
          <Link
            href={PARENT_COMPANY_URL}
            target="_blank"
            className="font-semibold text-blue-600 hover:underline"
          >
            {PARENT_COMPANY}
          </Link>
          , a trusted communications provider based in Sault Ste. Marie, Ontario,
          with decades of experience serving teams across Canada and the US.
        </p>
        <p>
          Whether you need compact business radios, rugged commercial units, or
          nationwide push-to-talk over LTE, our team will match the right gear and
          programming to your workflows and existing fleets.
        </p>
      </div>
    </div>
  );
}
