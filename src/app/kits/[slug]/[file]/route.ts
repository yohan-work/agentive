import { agents } from "@/data/agents";
import { getInstallKitFiles } from "@/lib/agent-install-kit";

// Every install kit file is written to out/kits/<slug>/<file> at build time, so kits have stable URLs
// that can be fetched with curl or linked from other projects.
export const dynamic = "force-static";
export const dynamicParams = false;

type KitRouteContext = { params: Promise<{ slug: string; file: string }> };

export function generateStaticParams() {
  return agents.flatMap((agent) => getInstallKitFiles(agent).map((file) => ({ slug: agent.slug, file: file.name })));
}

export async function GET(_request: Request, { params }: KitRouteContext) {
  const { slug, file } = await params;
  const agent = agents.find((candidate) => candidate.slug === slug);
  const kitFile = agent ? getInstallKitFiles(agent).find((candidate) => candidate.name === file) : undefined;

  if (!kitFile) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(kitFile.content, { headers: { "Content-Type": kitFile.mimeType } });
}
