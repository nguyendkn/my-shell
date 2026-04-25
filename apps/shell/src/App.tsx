import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";

const steps = [
  "Shared theme tokens and Tailwind v4 utilities now come from @repo/ui.",
  "The shell can import shared shadcn components from @repo/ui/components/*.",
  "Future UI work can stay consistent across apps without duplicating setup.",
];

function App() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_30%),linear-gradient(180deg,#08111e_0%,#0b1526_48%,#0f1a30_100%)] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:py-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-3xl flex-col gap-4">
            <Badge variant="outline" className="w-fit bg-background/60">
              Shell + @repo/ui
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-4xl leading-none font-semibold tracking-[-0.06em] text-balance sm:text-6xl">
                The shell app now runs on the shared component layer.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                This Vite app is wired into the same UI package used across the
                workspace, so new screens can reuse tokens, components, and
                Tailwind v4 styles without local duplication.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href="https://ui.shadcn.com/docs/monorepo" target="_blank" rel="noreferrer">
                Monorepo Docs
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://tailwindcss.com/docs/installation/using-postcss" target="_blank" rel="noreferrer">
                Tailwind v4
              </a>
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
          <Card className="border border-border/50 bg-background/75 shadow-2xl shadow-black/15 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Connected workspace primitives</CardTitle>
              <CardDescription>
                The shell is consuming real shared components from{" "}
                <code>@repo/ui</code>, not a local copy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/50 bg-muted/35 p-4">
                  <div className="text-2xl font-semibold">Shared</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    component library already available from the UI package
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/35 p-4">
                  <div className="text-2xl font-semibold">1</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    shared stylesheet imported from the UI package
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/35 p-4">
                  <div className="text-2xl font-semibold">0</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    duplicated local Tailwind setup left in the shell app
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                {steps.map((step) => (
                  <div
                    key={step}
                    className="rounded-lg border border-border/40 bg-background/70 px-4 py-3 text-sm text-muted-foreground"
                  >
                    {step}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="justify-between gap-3 border-border/50 bg-muted/25">
              <span className="text-sm text-muted-foreground">
                Start building screens directly in <code>apps/shell/src/App.tsx</code>.
              </span>
              <Button variant="secondary">Shared UI Active</Button>
            </CardFooter>
          </Card>

          <Card className="border border-border/50 bg-background/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Working mode</CardTitle>
              <CardDescription>
                A small shell app, but now aligned with the same design system
                and tooling as the rest of the repo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                <div className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
                  Commands
                </div>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <code>bun run dev --filter=shell</code>
                  <code>bun run lint --filter=shell</code>
                  <code>bun run check-types --filter=shell</code>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge>Vite</Badge>
                <Badge variant="secondary">React 19</Badge>
                <Badge variant="outline">Tailwind v4</Badge>
                <Badge variant="outline">shadcn/ui</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default App;
