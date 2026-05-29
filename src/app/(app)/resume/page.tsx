import { ResumeEditor } from "@/components/resume/resume-editor";
import { ResumeMetadata } from "@/components/resume/resume-metadata";
import { PageHeader } from "@/components/page-header";
import { getPrimaryMasterResume } from "@/lib/resume/get-primary-master-resume";

export default async function ResumePage() {
  const resume = await getPrimaryMasterResume();
  const latexSource = resume?.latexSource ?? "";
  const lineCount = latexSource ? latexSource.split("\n").length : 0;

  return (
    <>
      <PageHeader
        title="Master resume"
        description="Your canonical LaTeX resume used as the source of truth for tailoring."
      />
      <div className="space-y-6 px-6 py-6">
        <ResumeMetadata
          resumeId={resume?.id ?? null}
          createdAt={resume?.createdAt ?? null}
          updatedAt={resume?.updatedAt ?? null}
          characterCount={latexSource.length}
          lineCount={lineCount}
        />
        <ResumeEditor
          resumeId={resume?.id ?? null}
          title={resume?.title ?? "Master resume"}
          latexSource={latexSource}
        />
      </div>
    </>
  );
}
