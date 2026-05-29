/** Canonical LaTeX resume owned by the user. */
export type MasterResume = {
  id: string;
  userId: string;
  title: string;
  latexSource: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * A snapshot of tailored LaTeX produced for an application packet.
 * Multiple versions may exist per packet as the user iterates.
 */
export type ResumeVersion = {
  id: string;
  applicationPacketId: string;
  masterResumeId: string;
  label: string;
  latexSource: string;
  createdAt: string;
};
